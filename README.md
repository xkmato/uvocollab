# UvoCollab

**Connect with legends in the music and podcast industries.**

UvoCollab is a curated marketplace and collaboration platform that bridges emerging artists ("New Artists") and podcasters with verified music and podcast industry professionals ("Legends"). The platform provides secure transactions, legal contract generation, and a project management hub for music and podcast collaborations.

## 🎵 What is UvoCollab?

UvoCollab solves a critical problem in the music industry: connecting talented emerging artists with established professionals in a secure, professional environment. Unlike open marketplaces, UvoCollab uses a vetted approval process to ensure quality and authenticity.

### Key Features

- **Curated Marketplace**: Browse verified music and podcast industry professionals offering services like verses, features, production, mixing, guest bookings, sponsorships, and more
- **Pitch-Based System**: Artists submit project pitches with demos and creative concepts for Legends to review and approve
- **Secure Payments & Escrow**: Integrated Flutterwave payment processing with escrow to protect both parties
- **Automated Legal Contracts**: Dynamic "Work for Hire" contract generation with e-signature integration
- **Collaboration Hub**: Private workspace for each project with file sharing, messaging, and milestone tracking
- **Transparent Payouts**: Automated payment distribution after project completion with platform commission handling

## 🚀 For New Artists (Buyers)

1. **Browse the Marketplace**: Filter Legends by genre, price range, and service type
2. **Submit Your Pitch**: Share your demo, previous work, and creative vision
3. **Secure Payment**: Pay upfront with funds held in escrow until project completion
4. **Collaborate**: Work directly with your chosen Legend in a private hub
5. **Receive Deliverables**: Download final files and mark the project complete to release payment

## ⭐ For Legends (Sellers)

1. **Apply for Verification**: Submit your credentials and industry proof for vetting
2. **Create Your Storefront**: Set up your profile and list your services with prices
3. **Review Pitches**: Accept or decline collaboration requests based on creative fit
4. **Connect Bank Account**: Link your Flutterwave account for automatic payouts
5. **Deliver & Get Paid**: Upload your work and receive payment when the buyer confirms completion

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 with React 19, TypeScript, and Tailwind CSS
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Payments**: Flutterwave (with subaccounts for split payments)
- **Contracts**: Custom PDF generation with PDFKit
- **Email**: Mailgun

## 📋 Getting Started

### Prerequisites

- Node.js 20+
- Firebase project with Firestore, Auth, and Storage enabled
- Flutterwave account with API credentials
- Mailgun account for email notifications

### Installation

1. Clone the repository:

```bash
git clone https://github.com/xkmato/uvocollab.git
cd uvocollab
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file with your Firebase, Flutterwave, and Mailgun credentials.

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
app/
├── api/              # API routes for backend logic
├── auth/             # Authentication pages (login, signup)
├── marketplace/      # Browse Legends
├── legend/           # Legend public profiles and dashboard
├── collaboration/    # Private collaboration hubs
├── admin/            # Admin vetting dashboard
├── apply/            # Legend application page
└── components/       # Shared React components

lib/
├── firebase.ts       # Firebase client configuration
├── firebase-admin.ts # Firebase Admin SDK
├── flutterwave.ts    # Payment processing
└── contract-generator.ts # PDF contract generation
```

## 🔒 Security & Legal

- All payments are held in escrow until project completion
- Automated "Work for Hire" contracts ensure legal clarity
- Master ownership goes to the buyer; writer's share retained by Legend
- All communications are logged on-platform for dispute resolution

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For questions or access, contact the repository owner.

---

Built with ❤️ for the music community.
