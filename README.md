# ♻️ EcoVerse – Track, Learn, and Earn for Sustainable Living

EcoVerse is a web application that helps users understand the environmental impact of their daily choices. By scanning product barcodes, users can view carbon footprint estimates, check whether packaging is recyclable, and earn rewards for eco-friendly habits.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Demo Video](#-demo-video)
- [Setup Instructions](#️-setup-instructions)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Features

- 🔐 **Google Authentication (Firebase)**
  - Securely sign in using your Google account.
  - Provides a smooth and protected authentication experience.

- 📦 **Barcode Scanning**
  - Scan product barcodes in real time using your device camera.
  - Instantly identify products and retrieve sustainability-related information.

- 🌱 **Carbon Footprint Estimation**
  - Displays estimated carbon emissions associated with scanned products.
  - Helps users make environmentally conscious purchasing decisions.

- ♻️ **Recyclability Check**
  - Determines whether product packaging can be recycled.
  - Encourages responsible waste management and sustainable habits.

- 🧠 **Eco Points System & Monthly Rewards**
  - Earn points by performing eco-friendly activities.
  - Track progress and unlock rewards through continued engagement.

- 🧾 **Dashboard**
  - Monitor scan history, carbon savings, and reward levels.
  - Access all sustainability metrics from a single place.

- 📊 **Leaderboard**
  - Compare your eco-friendly impact with other users.
  - Promotes community participation through friendly competition.

- 🎨 **Dark/Light Theme Toggle**
  - Switch between light and dark themes based on your preference.
  - Enhances accessibility and viewing comfort.

- 📈 **Analytics Page**
  - Visualize sustainability trends through charts and insights.
  - Helps users better understand their environmental impact over time.

- 🔗 **Firebase–MongoDB Sync**
  - Synchronizes application data between Firebase and MongoDB.
  - Ensures reliable storage and consistent data management.

---

## 📦 Tech Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Authentication:** Firebase Auth (Google Sign-In)
- **Database:** MongoDB (Mongoose)
- **Scanning:** `@zxing/browser` for barcode recognition
- **Cloud Functions:** Firebase Functions (TypeScript)

---

## 📁 Project Structure

```text
EcoVerse/
├── app/                              # Next.js App Router pages
├── components/                       # Reusable UI and application components
│   ├── ui/                           # Shared UI primitives
│   ├── auth-provider.tsx
│   ├── dashboard-layout.tsx
│   ├── google-signin-button.tsx
│   ├── reward-notification.tsx
│   └── theme-provider.tsx
├── hooks/                            # Custom React hooks
├── lib/                              # Utility and service modules
│   ├── auth.ts
│   ├── carbon-calculator.ts
│   ├── firebase.ts
│   ├── mongodb.ts
│   ├── packaging-inference.ts
│   ├── rewards-system.ts
│   └── utils.ts
├── models/                           # Database models
├── public/                           # Static assets
├── styles/                           # Global styles
├── firebase-functions-sync-ts/       # Firebase synchronization functions
├── firebase-functions-sync-prisma/   # Prisma-based sync functions
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE.txt
└── README.md
```

> The project structure may evolve as new features and modules are added.

---

<a id="-demo-video"></a>
## 📽️ Demo Video

[▶️ Watch Demo Video on Google Drive](https://drive.google.com/file/d/1DDff6gDIA4S_em2jsJIeY2Z83XV7iJ65/view?usp=sharing)

---

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Shiv24angi/EcoVerse.git
cd EcoVerse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root and add the required environment variables.

```bash
Create a .env.local file in the project root.
```

### 4. Run the Development Server

```bash
npm run dev
```

Open your browser and visit:

```text
http://localhost:3000
```

---

## 🔐 Environment Variables

Create a `.env.local` file and configure the following variables:

| Variable | Description |
|-----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase project API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project identifier |
| `MONGODB_URI` | MongoDB connection string |

### Example

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

For detailed MongoDB setup instructions, refer to:

- `MONGODB_SETUP.md`
- `MONGODB_TROUBLESHOOTING.md`

---

## 🤝 Contributing

We welcome contributions from developers of all experience levels.

Before submitting a pull request, please review:

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

If you would like to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Submit a pull request.

Please check existing issues before starting work and follow the project's contribution guidelines.

---

## 📄 License

This project is licensed under the MIT License.

See the [LICENSE.txt](./LICENSE.txt) file for more information.

---

🌱 Together, we can make sustainable living more accessible, measurable, and rewarding.
