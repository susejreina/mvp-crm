# Academia de IA - Sales CRM

A modern sales management system built for Academia de IA to track vendors, products, clients, and sales operations. This CRM enables directors to manage their sales teams and monitor performance through an intuitive dashboard interface.

## Project Overview

This CRM system is designed for directors (sales directors, HR directors, or company executives) to manage their sales operations efficiently. The application provides comprehensive tools for tracking sales performance, managing vendor relationships, and overseeing product sales across multiple currencies and markets.

### Key Features

- **Director Authentication** - Secure login system for authorized directors
- **Dashboard Overview** - Real-time metrics showing total vendors, clients, products, and sales
- **Sales Management** - Create and track both individual and group sales
- **Vendor Management** - Add and manage sales team members
- **Multi-currency Support** - Handle sales in USD, MXN, and COP
- **Sales Status Tracking** - Monitor sales through pending, approved, and denied states
- **Comment System** - Internal communication on sales records

## User Flow

### 1. Authentication (Login)
Directors authenticate using email/password to access the system.

### 2. Dashboard
Upon login, directors see an overview with:
- Total number of vendors (sales team)
- Total clients
- Active products
- Sales metrics and totals

### 3. Sales Management

#### Adding New Sales
Directors can create two types of sales:
- **Individual Sales** - Single customer purchases
- **Group Sales** - Corporate or team purchases with multiple users

#### Sales List Management
- View all sales with filtering options
- Access individual sale details
- Add comments to sales records
- Change sale status (pending → approved/denied)

### 4. Vendor Management
- View all sales team members
- Add new vendors/sellers to the team
- Manage vendor roles and permissions

## Technology Stack

- **Frontend**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Package Manager**: pnpm
- **Node Version**: 20

## Data Model

### Vendors
Sales team members with roles (admin/seller) who can create and manage sales.

### Products
AI courses and workshops offered by Academia de IA, with pricing in multiple currencies.

### Clients
Customer information, including support for group sales with multiple users per client.

### Sales
Transaction records linking vendors, products, and clients with comprehensive tracking:
- Individual or group sale types
- Multi-currency amounts
- Payment methods (transfers, cards, PayPal)
- Sales sources and tracking metrics
- Status workflow (pending → approved/denied)
- Evidence attachments

## Getting Started

### Prerequisites

1. Node.js 20 or higher
2. pnpm package manager
3. Firebase project with Firestore and Authentication enabled

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables in `.env.local`:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

   # Seeding (for development)
   SEED_ADMIN_EMAIL=your-admin@domain.com
   SEED_ADMIN_PASSWORD=your-password
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Seeding

The project includes a comprehensive seeding system for development and testing.

### Environment Configuration

Add seeding credentials to your `.env.local`:

```env
SEED_ADMIN_EMAIL=your-admin@domain.com
SEED_ADMIN_PASSWORD=your-password
```

**Important**: The admin account must exist in Firebase Authentication and have a corresponding document in the `vendors` collection with `role: "admin"`.

### Running the Seed

```bash
pnpm seed
```

### What Gets Seeded

1. **Products** (8 demo products)
   - AI courses and workshops with realistic pricing
   - Multiple currencies (USD, MXN, COP)
   - Mix of active/inactive products

2. **Vendors** (3 demo vendors)
   - 1 admin + 2 sellers
   - All active by default
   - Profile photos

3. **Sales & Clients** (8 demo sales)
   - Mix of individual and group sales
   - Various statuses (pending, approved, denied)
   - Different payment methods and sources
   - Clients automatically created from sales data

### Idempotency

The seeding system is idempotent - you can run `pnpm seed` multiple times without creating duplicates. Documents use deterministic IDs based on email slugs, SKUs, and composite keys.

## Development

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── lib/
│   ├── firebase.ts     # Firebase configuration
│   ├── types.ts        # TypeScript interfaces
│   └── seed/           # Database seeding system
└── components/         # React components (to be created)

scripts/
└── seed.ts            # Seeding entry point
```

### Database Collections

- `vendors/{email-slug}` - Sales team profiles
- `products/{sku}` - Course/product catalog
- `clients/{email-slug}` - Customer information
- `sales/{email-date-product}` - Sales transactions with denormalized data

### Security Rules (Development)

For development, use permissive Firestore rules:

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

Remember to implement proper security rules before production deployment.

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm seed` - Populate database with demo data

## Contributing

1. Follow the established project structure
2. Use TypeScript for all new code
3. Follow the existing naming conventions
4. Test with the seeded data before implementing UI components

## License

This project is private and proprietary to Academia de IA.