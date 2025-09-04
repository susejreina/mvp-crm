# Academia de IA - Sales CRM

A modern sales management system built for Academia de IA to track vendors, products, clients, and sales operations. This CRM enables directors to manage their sales teams and monitor performance through an intuitive dashboard interface.

## Project Overview

This CRM system is designed for directors (sales directors, HR directors, or company executives) to manage their sales operations efficiently. The application provides comprehensive tools for tracking sales performance, managing vendor relationships, and overseeing product sales across multiple currencies and markets.

### Key Features

- **Director Authentication** - Secure login system with Firebase Auth (Email/Password and Google OAuth)
- **Dashboard Overview** - Real-time metrics showing total vendors, clients, products, and sales
- **Sales Management** - Create and track both individual and group sales
- **Vendor Management** - Add and manage sales team members with profile images
- **Multi-currency Support** - Handle sales in USD, MXN, and COP
- **Sales Status Tracking** - Monitor sales through pending, approved, and rejected states
- **Comment System** - Internal communication on sales records
- **Profile Images** - Support for custom uploads and Google profile photos
- **Toast Notifications** - Consistent user feedback across all operations

## Technology Stack

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Email/Password + Google OAuth)
- **Storage**: Firebase Storage (for profile images)
- **Package Manager**: pnpm
- **Runtime**: Node.js 20+

### Development Tools
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint
- **Type Checking**: TypeScript strict mode

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js 20 or higher** - [Download here](https://nodejs.org/)
2. **pnpm package manager** - Install with `npm install -g pnpm`
3. **Git** - For version control
4. **A Firebase project** - Create one at [Firebase Console](https://console.firebase.google.com)

## Installation Guide

### Step 1: Clone the Repository

```bash
git clone [repository-url]
cd mvp-crm
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Firebase Project Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Create Project" and follow the wizard
   - Enable Google Analytics (optional)

2. **Enable Required Services**:
   - **Authentication**:
     - Navigate to Authentication → Get Started
     - Enable "Email/Password" provider
     - Enable "Google" provider (configure OAuth consent screen)
   - **Firestore Database**:
     - Navigate to Firestore Database → Create Database
     - Start in "Test Mode" for development
     - Select your preferred region
   - **Storage** (optional for profile images):
     - Navigate to Storage → Get Started
     - Start in "Test Mode" for development

3. **Get Firebase Configuration**:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Add a Web app
   - Register your app and copy the configuration

### Step 4: Environment Configuration

Create a `.env.local` file in the project root:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Seeding Configuration (for development)
SEED_ADMIN_EMAIL=admin@yourdomain.com
SEED_ADMIN_PASSWORD=your-secure-password
```

### Step 5: Create Admin User in Firebase

**IMPORTANT**: Before running the seed script, you must manually create an admin user in Firebase Authentication:

1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Enter the email and password (use the same as `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`)
4. Click "Add user"

### Step 6: Configure Firestore Security Rules

For development, use these permissive rules (update `firestore.rules` in Firebase Console):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ WARNING**: These rules are for development only. Implement proper security before production.

### Step 7: Configure Storage Rules (if using profile images)

For Firebase Storage (update `storage.rules` in Firebase Console):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-images/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 8: Run Database Seeds

Populate your database with initial data:

```bash
pnpm seed
```

This will create:
- Reference data (sources, payment methods, evidence types)
- Demo products (8 AI courses)
- Demo vendors (3 team members including your admin)
- Demo sales and clients

### Step 9: Start the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 10: Login

Use your admin credentials to login:
- Email: The email you used in `SEED_ADMIN_EMAIL`
- Password: The password you used in `SEED_ADMIN_PASSWORD`

## Database Seeding

### What Gets Seeded

1. **Reference Data**:
   - 8 sales sources (Referral, LinkedIn, Facebook, etc.)
   - 4 payment methods (Transfer MX/CO, Credit Card, PayPal)
   - 2 evidence types (Payment Confirmation, Enrollment Proof)

2. **Products** (8 demo products):
   - Various AI courses and workshops
   - Prices in USD, MXN, and COP
   - Mix of active/inactive products

3. **Vendors** (3 demo vendors):
   - Your admin account (from SEED_ADMIN_EMAIL)
   - 2 additional sellers
   - All with position "Vendedor" by default

4. **Sales & Clients** (8 demo sales):
   - Mix of individual and group sales
   - Various statuses (pending, approved, rejected)
   - Automatically creates associated clients

### Advanced Seeding Options

```bash
# Reset all reference collections
pnpm seed -- --reset-all

# Reset specific collections
pnpm seed -- --reset=sources,payment_methods

# Run seed without reset
pnpm seed
```

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript type checking
pnpm seed         # Run database seeds
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
```

## Project Structure

```
mvp-crm/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (app)/             # Protected app routes
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── ventas/        # Sales management
│   │   │   ├── clientes/      # Client management
│   │   │   ├── productos/     # Product management
│   │   │   └── vendors/       # Vendor management
│   │   └── (auth)/            # Authentication routes
│   │       └── login/         # Login page
│   ├── components/            # React components
│   │   ├── auth/             # Authentication components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── layout/           # Layout components
│   │   ├── sales/            # Sales components (including modals)
│   │   ├── ui/               # Reusable UI components
│   │   └── vendors/          # Vendor components
│   ├── lib/                   # Utilities and services
│   │   ├── auth/             # Authentication service
│   │   ├── firestore/        # Firestore operations
│   │   ├── seed/             # Database seeding
│   │   └── types.ts          # TypeScript types
│   └── hooks/                 # Custom React hooks
├── scripts/
│   └── seed.ts               # Seed script entry point
├── public/
│   └── assets/               # Static assets (logos, icons)
└── tests/                     # Test files
```

## Features Details

### Authentication System
- Email/Password authentication
- Google OAuth integration
- Role-based access control (admin/seller)
- Automatic vendor validation

### Vendor Management
- Add/Edit/Deactivate vendors
- Profile image upload (Base64 stored in Firestore)
- Google profile photo integration
- Role management (Admin/Seller)
- Default position: "Vendedor"

### Sales Management
- Individual and group sales creation via unified modal
- Multi-currency support (USD/MXN/COP)
- Automatic USD conversion
- Status workflow (pending → approved/rejected)
- Interactive status change modal for pending sales (approve/reject with comments)
- Comment system for internal notes on all sales
- Evidence attachment support
- Real-time data refresh after status changes

### Dashboard Analytics
- Total sales in USD
- Active clients count
- Products in catalog
- Vendors team size
- Quick actions for common tasks

### Interactive Sales Features
- **Sales Table Actions**: Each sale has a dropdown menu with contextual options
- **Status Change Modal**: For pending sales, directors can approve/reject with mandatory comments
- **Add Comment Modal**: For all sales, users can add internal notes and observations
- **Unified Sale Creation**: Same modal experience across dashboard and sales page
- **Real-time Updates**: All changes refresh the data automatically

## Testing

Run the test suite:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Troubleshooting

### Common Issues

1. **"Missing SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD"**
   - Ensure `.env.local` exists with correct variables
   - Variables must match Firebase Authentication user

2. **"User not found in vendors collection"**
   - Run `pnpm seed` to create vendor records
   - Ensure admin email matches SEED_ADMIN_EMAIL

3. **CORS errors with image uploads**
   - Check Firebase Storage rules are configured
   - The app uses Base64 storage as fallback

4. **"Port 3000 is in use"**
   - The dev server will automatically use port 3001, 3002, etc.
   - Or kill the process: `lsof -ti:3000 | xargs kill -9`

## Deployment

### Production Checklist

- [ ] Update Firebase security rules
- [ ] Configure production environment variables
- [ ] Enable Firebase App Check
- [ ] Set up monitoring and analytics
- [ ] Configure custom domain
- [ ] Enable automatic backups
- [ ] Review and update CORS policies
- [ ] Set up CI/CD pipeline

## Contributing

1. Create a feature branch from `main`
2. Follow the established coding patterns
3. Write tests for new features
4. Ensure all tests pass
5. Update documentation as needed
6. Create a pull request with clear description

### Code Style Guidelines
- Use TypeScript strict mode
- Follow existing component patterns
- Keep components small and focused
- Use meaningful variable names
- Add comments only when necessary
- All comments in English

## License

This project is private and proprietary to Academia de IA.

## Support

For issues or questions, please contact the development team or create an issue in the repository.