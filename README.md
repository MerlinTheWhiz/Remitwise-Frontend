# RemitWise Frontend

Frontend application for the RemitWise remittance and financial planning platform.

## Overview

This is a Next.js-based frontend skeleton that provides the UI structure for all RemitWise features. The application is built with:

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

## Features (Placeholders)

The frontend includes placeholder pages and components for:

1. **Dashboard** - Overview of remittances, savings, bills, and insurance
2. **Send Money** - Remittance sending interface with automatic split preview
3. **Smart Money Split** - Configuration for automatic allocation
4. **Savings Goals** - Goal-based savings tracking and management
5. **Bill Payments** - Bill tracking, scheduling, and payment
6. **Micro-Insurance** - Policy management and premium payments
7. **Family Wallets** - Family member management with roles and spending limits

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
remitwise-frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   ├── dashboard/           # Dashboard page
│   ├── send/                # Send money page
│   ├── split/               # Money split configuration
│   ├── goals/               # Savings goals
│   ├── bills/               # Bill payments
│   ├── insurance/           # Insurance policies
│   └── family/              # Family wallets
├── components/              # Reusable components (to be added)
├── public/                  # Static assets
└── package.json
```

## Integration Requirements

### Stellar SDK Integration

1. **Wallet Connection**
   - Integrate Freighter wallet or similar
   - Connect to Stellar network (testnet/mainnet)
   - Handle account authentication

2. **Smart Contract Integration**
   - Connect to deployed Soroban contracts
   - Implement contract function calls
   - Handle transaction signing and submission

3. **Anchor Platform Integration**
   - Integrate with anchor platform APIs for fiat on/off-ramps
   - Handle deposit/withdrawal flows
   - Process exchange rate quotes

4. **Transaction Tracking**
   - Display on-chain transaction history
   - Show transaction status and confirmations
   - Implement real-time updates

### Key Integration Points

- **Send Money Page**: Connect to Stellar SDK for transaction creation and signing
- **Split Configuration**: Call `remittance_split` contract to initialize/update split
- **Savings Goals**: Integrate with `savings_goals` contract for goal management
- **Bills**: Connect to `bill_payments` contract for bill tracking
- **Insurance**: Integrate with `insurance` contract for policy management
- **Family Wallets**: Connect to `family_wallet` contract for member management

## Backend / API

### Overview

This Next.js application uses API routes to handle backend functionality. API routes are located in the `app/api/` directory and follow Next.js 14 App Router conventions.

**Key API Routes:**
- `/api/auth/*` - Authentication endpoints (wallet connect, nonce generation, signature verification)
- `/api/transactions/*` - Transaction history and status
- `/api/contracts/*` - Soroban smart contract interactions
- `/api/health` - Health check endpoint

All API routes are serverless functions deployed alongside the frontend.

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Stellar Network Configuration
NEXT_PUBLIC_STELLAR_NETWORK=testnet  # or 'mainnet'
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Contract IDs (deployed Soroban contracts)
NEXT_PUBLIC_REMITTANCE_SPLIT_CONTRACT_ID=
NEXT_PUBLIC_SAVINGS_GOALS_CONTRACT_ID=
NEXT_PUBLIC_BILL_PAYMENTS_CONTRACT_ID=
NEXT_PUBLIC_INSURANCE_CONTRACT_ID=
NEXT_PUBLIC_FAMILY_WALLET_CONTRACT_ID=

# Authentication
AUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32
SESSION_COOKIE_NAME=remitwise-session
SESSION_MAX_AGE=86400  # 24 hours in seconds

# API Configuration
API_RATE_LIMIT=100  # requests per minute
API_TIMEOUT=30000  # milliseconds

# Optional: Anchor Platform
ANCHOR_PLATFORM_URL=
ANCHOR_PLATFORM_API_KEY=
```

See `.env.example` for a complete list of configuration options.

### Running the Backend

The backend API routes run automatically with the Next.js development server:

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

The API will be available at `http://localhost:3000/api/*`

### Authentication Flow

RemitWise uses wallet-based authentication with the following flow:

1. **Wallet Connect**: User connects their Stellar wallet (Freighter, Albedo, etc.)
   - Frontend detects wallet extension
   - User authorizes connection
   - Public key is retrieved

2. **Nonce Generation**: 
   - Client requests nonce from `/api/auth/nonce`
   - Server generates unique nonce and stores temporarily
   - Nonce returned to client

3. **Signature Verification**:
   - Client signs nonce with wallet private key
   - Signed message sent to `/api/auth/verify`
   - Server verifies signature matches public key
   - If valid, session token is created

4. **Session Management**:
   - JWT token stored in HTTP-only cookie
   - Token includes user's public key and expiration
   - Subsequent requests include token for authentication
   - Token validated on protected API routes

**Protected Routes**: All `/api/transactions/*`, `/api/contracts/*` endpoints require valid session.

### Contract IDs and Deployment

The application interacts with the following Soroban smart contracts on Stellar:

| Contract | Purpose | Environment Variable |
|----------|---------|---------------------|
| Remittance Split | Automatic money allocation | `NEXT_PUBLIC_REMITTANCE_SPLIT_CONTRACT_ID` |
| Savings Goals | Goal-based savings management | `NEXT_PUBLIC_SAVINGS_GOALS_CONTRACT_ID` |
| Bill Payments | Bill tracking and payments | `NEXT_PUBLIC_BILL_PAYMENTS_CONTRACT_ID` |
| Insurance | Micro-insurance policies | `NEXT_PUBLIC_INSURANCE_CONTRACT_ID` |
| Family Wallet | Family member management | `NEXT_PUBLIC_FAMILY_WALLET_CONTRACT_ID` |

**Deployment Notes:**
- Contracts must be deployed to Stellar testnet/mainnet before use
- Update contract IDs in `.env.local` after deployment
- Verify contract addresses match network (testnet vs mainnet)
- Contract ABIs are included in `lib/contracts/` directory

### Health and Monitoring

**Health Check Endpoint**: `GET /api/health`

Returns system status and connectivity:

```json
{
  "status": "healthy",
  "timestamp": "2024-02-24T10:30:00Z",
  "services": {
    "stellar": "connected",
    "contracts": "available",
    "database": "connected"
  },
  "version": "0.1.0"
}
```

**Monitoring Recommendations:**
- Set up uptime monitoring for `/api/health`
- Monitor API response times and error rates
- Track Stellar network connectivity
- Log contract interaction failures
- Set alerts for authentication failures

### Testing

**Unit Tests**

Test individual API route handlers and utility functions:

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

Unit tests are located alongside source files with `.test.ts` extension.

**Integration Tests**

Test complete API flows including authentication and contract interactions:

```bash
# Run integration tests
npm run test:integration

# Test specific API route
npm run test:integration -- auth
```

Integration tests are in the `__tests__/integration/` directory.

**Testing Checklist:**
- ✓ Authentication flow (nonce → sign → verify)
- ✓ Contract interactions (all 5 contracts)
- ✓ Error handling and validation
- ✓ Rate limiting
- ✓ Session management

### API Documentation

For detailed API specifications:

- **OpenAPI Spec**: See `openapi.yaml` for complete API documentation
- **Interactive Docs**: Run `npm run docs` to view Swagger UI at `http://localhost:3000/api-docs`
- **Postman Collection**: Import `postman_collection.json` for testing

**Quick API Reference:**

```bash
# Authentication
POST /api/auth/nonce          # Get nonce for signing
POST /api/auth/verify         # Verify signature and create session
POST /api/auth/logout         # End session

# Transactions
GET  /api/transactions        # List user transactions
GET  /api/transactions/:id    # Get transaction details

# Contracts
POST /api/contracts/split     # Initialize/update split configuration
POST /api/contracts/goals     # Create/manage savings goals
POST /api/contracts/bills     # Manage bill payments
POST /api/contracts/insurance # Manage insurance policies
POST /api/contracts/family    # Manage family wallet

# System
GET  /api/health              # Health check
```

## Design Notes

- All forms are currently disabled (placeholders)
- UI uses a blue/indigo color scheme
- Responsive design with mobile-first approach
- Components are structured for easy integration

## Future Enhancements

- Real-time transaction updates
- Push notifications for bill reminders
- Charts and graphs for financial insights
- Multi-language support
- Dark mode
- Mobile app (React Native)

## License

MIT

