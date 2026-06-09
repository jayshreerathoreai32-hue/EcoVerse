import { NextResponse } from "next/server"
import axios from "axios"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import { calculateCarbonFootprint } from "@/lib/carbon-calculator"
import {
  calculateScanPoints,
  calculateLevel,
  checkAchievements,
  calculateMonthlyBonus,
  confirmPendingPoints,
  getUserPointsSummary,
} from "@/lib/rewards-system"
import { inferPackaging } from "@/lib/packaging-inference"

type OpenFoodFactsResponse = {
  product: {
    product_name?: string;
    brands?: string;
    categories_tags?: string[];
    ingredients_text?: string;
  };
  status: number;
  code: string;
};

export async function POST(req: Request) {
  const { barcode } = await req.json()
  const userEmail = req.headers.get("x-user-email")

  if (!userEmail) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  } // ✅ Fallback to dev email if no JWT session exists

  if (!barcode) {
    return NextResponse.json({ error: "Barcode missing" }, { status: 400 })
  }

  try {
    const productRes = await axios.get<OpenFoodFactsResponse>(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    )

    const product = productRes.data.product

    if (!product?.product_name) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const categories = (product.categories_tags || []).map(cat => cat.replace("en:", ""))
    const packaging = inferPackaging(categories)

    const carbonData = calculateCarbonFootprint(product.product_name, product.brands)
    const carbonEstimate = carbonData.carbonFootprint

    try {
      await dbConnect()

      const user = await User.findOne({ email: userEmail })

      if (!user) {
        console.error("❌ No user found with email:", userEmail)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const isFirstScan = (user.totalScanned ?? 0) === 0
      const streakCount = user.streakCount ?? 0
      const totalScans = user.totalScanned ?? 0

      const pointsData = calculateScanPoints
        ? calculateScanPoints(carbonEstimate, isFirstScan, streakCount, totalScans)
        : { points: 0, reasons: [], isConfirmed: false }

      const isConfirmed = pointsData.isConfirmed
      const pointsEarned = pointsData.points

      // --- PREDICTIVE SIDE-EFFECT CALCULATIONS ---
      // We create a "virtual" updated state of the user to determine level-ups 
      // and new achievements. This allows us to maintain complex business logic 
      // while still using a single atomic database operation.
      const virtualUser = {
        ...user.toObject(),
        totalScanned: (user.totalScanned || 0) + 1,
        monthlyCarbon: (user.monthlyCarbon || 0) + carbonEstimate,
        rewardPoints: (user.rewardPoints || 0) + pointsEarned,
        totalPointsEarned: (user.totalPointsEarned || 0) + pointsEarned
      }

      const oldLevel = user.level || 1
      const levelData = calculateLevel ? calculateLevel(virtualUser) : { level: oldLevel }
      const earnedAchievements = checkAchievements ? checkAchievements(virtualUser) : []
      const monthlyBonus = calculateMonthlyBonus ? calculateMonthlyBonus(virtualUser) : 0

      // --- ATOMIC DATABASE UPDATE ---
      // We use findOneAndUpdate to eliminate the Read-Modify-Save race condition.
      // We use $inc, $set, and $push to perform a partial update that is 
      // naturally thread-safe at the MongoDB document level.
      const updatedUser = await User.findOneAndUpdate(
        { email: userEmail },
        {
          $inc: {
            monthlyCarbon: carbonEstimate,
            totalScanned: 1,
            rewardPoints: pointsEarned,
            totalPointsEarned: pointsEarned,
            confirmedPoints: isConfirmed ? pointsEarned : 0,
            unconfirmedPoints: isConfirmed ? 0 : pointsEarned,
            "points.confirmed": isConfirmed ? pointsEarned : 0,
            "points.unconfirmed": isConfirmed ? 0 : pointsEarned
          },
          $set: {
            level: levelData.level,
            achievements: earnedAchievements,
            updatedAt: new Date()
          },
          $push: {
            scans: {
              productName: product.product_name,
              carbonEstimate: carbonEstimate,
              category: carbonData.category,
              confidence: carbonData.confidence,
              barcode: barcode,
              date: new Date()
            }
          }
        },
        { 
          new: true, // IMPORTANT: Returns the ground-truth updated document from the DB
          runValidators: true 
        }
      )

      if (!updatedUser) {
        return NextResponse.json({ error: "Failed to re-fetch user" }, { status: 500 })
      }

      // We use the ground-truth data from 'updatedUser' for the final response.
      // This ensures the UI is always in sync with the actual database state.
      const pointsSummary = getUserPointsSummary(updatedUser)

      return NextResponse.json({
        productName: product.product_name,
        brand: product.brands || "Unknown",
        carbonEstimate: carbonEstimate.toFixed(2),
        category: carbonData.category,
        confidence: carbonData.confidence,
        calculation: carbonData.calculation,
        ingredients: product.ingredients_text || "Not available",
        packaging,
        rewards: {
          pointsEarned,
          pointsType: isConfirmed ? 'confirmed' : 'unconfirmed',
          reasons: pointsData.reasons,
          pointsSummary,
          level: updatedUser.level,
          leveledUp: updatedUser.level > oldLevel,
          newAchievements: earnedAchievements,
          streakCount: updatedUser.streakCount,
          monthlyBonus,
          sustainabilityTier:
            updatedUser.monthlyCarbon < 10 && updatedUser.totalScanned >= 15 ? 'Platinum' :
              updatedUser.monthlyCarbon < 20 && updatedUser.totalScanned >= 10 ? 'Gold' :
                updatedUser.monthlyCarbon < 30 && updatedUser.totalScanned >= 5 ? 'Silver' :
                  updatedUser.monthlyCarbon < 40 ? 'Bronze' : 'Beginner',
          pendingConfirmationInfo: (() => {
            const confirmationData = confirmPendingPoints
              ? confirmPendingPoints(updatedUser)
              : { confirmedPoints: 0, confirmedTransactions: [] }

            return confirmationData.confirmedPoints > 0
              ? {
                pointsConfirmed: confirmationData.confirmedPoints,
                transactionsConfirmed: confirmationData.confirmedTransactions.length
              }
              : null
          })()
        }
      })
    } catch (dbError) {
      console.error("🔥 Failed to update user stats:", dbError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
  } catch (error) {
    console.error("🔥 Error in scan API:", error)
    return NextResponse.json({ error: "Failed to scan product" }, { status: 500 })
  }
}
