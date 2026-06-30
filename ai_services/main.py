from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timedelta, timezone
from typing import List

# Initialize the API
app = FastAPI(
    title="EcoVerse AI Services",
    description="Microservices for Carbon Estimation and Analytics",
    version="0.2.0"
)

# --- MODELS ---
class ProductData(BaseModel):
    product_name: str
    category: str
    barcode: str | None = None
    weight_g: float = Field(default=100.0, gt=0)

class ScanItem(BaseModel):
    product_name: str
    category: str
    carbon_footprint_kg: float = Field(ge=0)
    scanned_at: datetime

class AnalyticsRequest(BaseModel):
    user_id: str = Field(min_length=1)
    scans: List[ScanItem] = Field(min_length=1, max_length=5000)

class UserRecord(BaseModel):
    user_id: str = Field(min_length=1)
    total_emissions_kg: float = Field(ge=0)

class LeaderboardRequest(BaseModel):
    requesting_user_id: str = Field(min_length=1)
    users: List[UserRecord] = Field(min_length=1, max_length=5000)

    @field_validator("users")
    @classmethod
    def validate_unique_user_ids(cls, users: List[UserRecord]) -> List[UserRecord]:
        ids = [u.user_id for u in users]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate user_id values are not allowed.")
        return users

class UserStatsRequest(BaseModel):
    user_id: str = Field(min_length=1)
    total_scans: int = Field(ge=0)
    mom_change_percentage: float
    percentile_score: float = Field(ge=0, le=100)
    # The frontend will now pass an array of immutable 'badge_id' strings
    previously_earned_badges: List[str] = Field(default_factory=list)


# --- ENDPOINT 1: Estimation ---
@app.post("/api/estimate")
async def estimate_carbon(product: ProductData):
    category_multipliers = {
        "food": 2.5,
        "electronics": 15.0,
        "cosmetics": 5.0,
        "clothing": 10.0
    }
    
    normalized_category = product.category.strip().lower()
    multiplier = category_multipliers.get(normalized_category, 5.0)
    estimated_kg_co2 = (product.weight_g / 1000) * multiplier
    
    return {
        "success": True,
        "product": product.product_name,
        "category": product.category,
        "estimated_kg_co2": round(estimated_kg_co2, 2)
    }

# --- ENDPOINT 2: Analytics & Trends ---
@app.post("/api/analytics")
async def get_analytics(data: AnalyticsRequest):
    if not data.scans:
        raise HTTPException(status_code=422, detail="No scan data provided for analytics.")

    category_totals = {}
    total_emissions = 0.0

    for scan in data.scans:
        cat = scan.category.strip().title()
        category_totals[cat] = category_totals.get(cat, 0.0) + scan.carbon_footprint_kg
        total_emissions += scan.carbon_footprint_kg

    top_category = max(category_totals, key=category_totals.get)
    top_category_pct = (category_totals[top_category] / total_emissions) * 100 if total_emissions > 0 else 0

    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    
    recent_emissions = sum(s.carbon_footprint_kg for s in data.scans if s.scanned_at >= thirty_days_ago)
    older_emissions = sum(s.carbon_footprint_kg for s in data.scans if s.scanned_at < thirty_days_ago)

    if older_emissions > 0:
        mom_change_pct = ((recent_emissions - older_emissions) / older_emissions) * 100
    else:
        mom_change_pct = 0.0

    penalty = (total_emissions / 10.0) * 15  
    score = max(1, min(100, 100 - penalty)) 

    return {
        "success": True,
        "user_id": data.user_id,
        "total_emissions_kg": round(total_emissions, 2),
        "sustainability_score": round(score),
        "top_emitting_category": top_category,
        "top_category_percentage": round(top_category_pct, 1),
        "mom_change_percentage": round(mom_change_pct, 1),
        "trend_direction": "worsening" if mom_change_pct > 0 else "improving"
    }

# --- ENDPOINT 3: Gamification & Leaderboard ---
@app.post("/api/leaderboard")
async def get_leaderboard(data: LeaderboardRequest):
    if not data.users:
        raise HTTPException(status_code=422, detail="No user data provided.")

    sorted_users = sorted(data.users, key=lambda x: x.total_emissions_kg)
    
    total_global_emissions = sum(u.total_emissions_kg for u in data.users)
    global_average = total_global_emissions / len(data.users)

    requesting_user = next((u for u in data.users if u.user_id == data.requesting_user_id), None)
    
    if requesting_user is None:
        raise HTTPException(status_code=404, detail="Requesting user not found in the dataset.")

    req_emissions = requesting_user.total_emissions_kg
    user_rank = 1 + sum(1 for u in data.users if u.total_emissions_kg < req_emissions)
    people_beaten = sum(1 for u in data.users if u.total_emissions_kg > req_emissions)
    
    others = len(data.users) - 1
    percentile = (people_beaten / others) * 100 if others > 0 else 100.0

    top_10 = [
        {"rank": i + 1, "user_id": u.user_id, "emissions_kg": u.total_emissions_kg} 
        for i, u in enumerate(sorted_users[:10])
    ]

    return {
        "success": True,
        "leaderboard": top_10,
        "stats": {
            "requesting_user_id": data.requesting_user_id,
            "user_rank": user_rank,
            "percentile_score": round(percentile, 1),
            "global_average_kg": round(global_average, 2),
            "status_message": f"You are more sustainable than {round(percentile)}% of users!"
        }
    }

# --- ENDPOINT 4: Achievements & Badges ---

# Single Source of Truth for Badge Metadata
BADGE_CATALOG = {
    "first_step": {"name": "First Step", "description": "Scanned your first item."},
    "eco_beginner": {"name": "Eco Beginner", "description": "Scanned 10 items."},
    "carbon_cutter": {"name": "Carbon Cutter", "description": "Reduced emissions by 15% MoM."},
    "global_guardian": {"name": "Global Guardian", "description": "Reached the Top 10% globally."}
}

@app.post("/api/achievements")
async def get_achievements(stats: UserStatsRequest):
    """
    Evaluates stats to award badges using immutable badge_ids.
    Ensures previously earned badges are retained even if stats regress.
    """
    previously_earned = []
    newly_earned = []
    next_goals = []

    earned_ids = set(stats.previously_earned_badges)

    # 1. Unconditionally build the 'previously_earned' list from history
    for b_id in earned_ids:
        if b_id in BADGE_CATALOG:
            previously_earned.append({
                "badge_id": b_id,
                "name": BADGE_CATALOG[b_id]["name"],
                "description": BADGE_CATALOG[b_id]["description"]
            })

    # 2. Evaluate Rule 1: First Step
    if "first_step" not in earned_ids:
        if stats.total_scans >= 1:
            newly_earned.append({"badge_id": "first_step", **BADGE_CATALOG["first_step"]})
        else:
            next_goals.append({"badge_id": "first_step", "name": BADGE_CATALOG["first_step"]["name"], "progress": f"{stats.total_scans}/1 items"})

    # 3. Evaluate Rule 2: Eco Beginner
    if "eco_beginner" not in earned_ids:
        if stats.total_scans >= 10:
            newly_earned.append({"badge_id": "eco_beginner", **BADGE_CATALOG["eco_beginner"]})
        else:
            next_goals.append({"badge_id": "eco_beginner", "name": BADGE_CATALOG["eco_beginner"]["name"], "progress": f"{stats.total_scans}/10 items"})

    # 4. Evaluate Rule 3: Carbon Cutter
    if "carbon_cutter" not in earned_ids:
        if stats.mom_change_percentage <= -15.0:
            newly_earned.append({"badge_id": "carbon_cutter", **BADGE_CATALOG["carbon_cutter"]})
        else:
            next_goals.append({"badge_id": "carbon_cutter", "name": BADGE_CATALOG["carbon_cutter"]["name"], "progress": f"Current: {stats.mom_change_percentage}% (Target: -15.0%)"})

    # 5. Evaluate Rule 4: Global Guardian
    if "global_guardian" not in earned_ids:
        if stats.percentile_score >= 90.0:
            newly_earned.append({"badge_id": "global_guardian", **BADGE_CATALOG["global_guardian"]})
        else:
            current_top = round(100 - stats.percentile_score, 1)
            next_goals.append({"badge_id": "global_guardian", "name": BADGE_CATALOG["global_guardian"]["name"], "progress": f"Current: Top {current_top}% (Target: Top 10%)"})

    return {
        "success": True,
        "user_id": stats.user_id,
        "total_new_badges": len(newly_earned),
        "newly_earned_badges": newly_earned,
        "previously_earned_badges": previously_earned,
        "next_goals": next_goals
    }