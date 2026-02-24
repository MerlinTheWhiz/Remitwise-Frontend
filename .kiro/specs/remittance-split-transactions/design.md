# Design Document: Remittance Split Transaction Builder

## Overview

This feature implements a transaction building service for the RemitWise remittance split functionality. The system constructs unsigned Soroban transactions that the frontend can sign with user wallets and submit to the Stellar network. This architecture maintains user custody while providing a convenient transaction building service.

The implementation consists of two main components:
1. Core transaction building functions in `lib/contracts/remittance-split.ts`
2. Protected API endpoints at `/api/split/initialize` and `/api/split/update`

The design follows a non-custodial-first approach where users maintain control of their private keys, with optional custodial mode support for specific use cases.

## Architecture

### High-Level Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Frontend  │────────▶│   API Routes     │────────▶│  Transaction    │
│   (React)   │  POST   │  /api/split/*    │  calls  │  Builder Lib    │
│             │◀────────│  (Next.js)       │◀────────│  (Soroban SDK)  │
└─────────────┘  XDR    └──────────────────┘  XDR    └─────────────────┘
      │                         │                              │
      │                         │                              │
      │ sign & submit           │ auth check                   │ contract call
      │                         │                              │
      ▼                         ▼                              ▼
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   User      │         │   Session        │         │   Soroban       │
│   Wallet    │         │   Management     │         │   Contract      │
└─────────────┘         └──────────────────┘         └─────────────────┘
```

### Component Interaction Flow

1. User initiates split configuration from frontend
2. Frontend sends authenticated POST request to API route
3. API route validates authentication and extracts caller from session
4. API route validates percentage inputs sum to 100
5. API route calls transaction builder function
6. Transaction builder constructs Soroban contract invocation
7. Transaction builder returns unsigned XDR (or signed if custodial)
8. API route returns XDR to frontend
9. Frontend prompts user to sign with wallet
10. Frontend submits signed transaction to Stellar network

## Components and Interfaces

### 1. Transaction Builder Module (`lib/contracts/remittance-split.ts`)

This module provides core transaction building functionality using the Stellar SDK.

#### Interface: `SplitPercentages`

```typescript
interface SplitPercentages {
  spending: number;
  savings: number;
  bills: number;
  insurance: number;
}
```

#### Interface: `TransactionResult`

```typescript
interface TransactionResult {
  xdr: string;
  simulate?: {
    cost: string;
    results: any[];
  };
}
```

#### Function: `buildInitializeSplitTx`

```typescript
async function buildInitializeSplitTx(
  owner: string,
  percentages: SplitPercentages,
  options?: {
    networkPassphrase?: string;
    contractId?: string;
    simulate?: boolean;
  }
): Promise<TransactionResult>
```

**Purpose**: Constructs an unsigned transaction for initializing a new split configuration.

**Parameters**:
- `owner`: Stellar account address that will own the split configuration
- `percentages`: Object containing the four percentage allocations
- `options`: Optional configuration for network, contract ID, and simulation

**Returns**: Transaction XDR string and optional simulation results

**Behavior**:
- Loads the Soroban contract instance
- Constructs contract invocation for `initialize` function
- Builds transaction with appropriate fee and resource limits
- Returns unsigned transaction XDR
- Optionally simulates transaction to estimate costs

#### Function: `buildUpdateSplitTx`

```typescript
async function buildUpdateSplitTx(
  caller: string,
  percentages: SplitPercentages,
  options?: {
    networkPassphrase?: string;
    contractId?: string;
    simulate?: boolean;
  }
): Promise<TransactionResult>
```

**Purpose**: Constructs an unsigned transaction for updating an existing split configuration.

**Parameters**:
- `caller`: Stellar account address making the update
- `percentages`: Object containing the new percentage allocations
- `options`: Optional configuration for network, contract ID, and simulation

**Returns**: Transaction XDR string and optional simulation results

**Behavior**:
- Loads the Soroban contract instance
- Constructs contract invocation for `update` function
- Builds transaction with appropriate fee and resource limits
- Returns unsigned transaction XDR
- Optionally simulates transaction to estimate costs

#### Helper Function: `validatePercentages`

```typescript
function validatePercentages(percentages: SplitPercentages): void
```

**Purpose**: Validates that percentages are valid and sum to 100.

**Throws**: Error if validation fails

### 2. API Route: Initialize Split (`app/api/split/initialize/route.ts`)

#### Endpoint: `POST /api/split/initialize`

**Authentication**: Required (session-based)

**Request Body**:
```typescript
{
  spending: number;
  savings: number;
  bills: number;
  insurance: number;
}
```

**Response (Success - 200)**:
```typescript
{
  success: true;
  xdr: string;
  simulate?: {
    cost: string;
    results: any[];
  };
  message: string;
}
```

**Response (Error - 400)**:
```typescript
{
  success: false;
  error: string;
}
```

**Response (Error - 401)**:
```typescript
{
  success: false;
  error: "Unauthorized";
}
```

**Behavior**:
1. Verify user authentication from session
2. Extract caller address from session
3. Parse and validate request body
4. Validate percentages sum to 100
5. Call `buildInitializeSplitTx` with caller as owner
6. Return transaction XDR to frontend
7. Handle and format any errors

### 3. API Route: Update Split (`app/api/split/update/route.ts`)

#### Endpoint: `POST /api/split/update`

**Authentication**: Required (session-based)

**Request Body**:
```typescript
{
  spending: number;
  savings: number;
  bills: number;
  insurance: number;
}
```

**Response (Success - 200)**:
```typescript
{
  success: true;
  xdr: string;
  simulate?: {
    cost: string;
    results: any[];
  };
  message: string;
}
```

**Response (Error - 400)**:
```typescript
{
  success: false;
  error: string;
}
```

**Response (Error - 401)**:
```typescript
{
  success: false;
  error: "Unauthorized";
}
```

**Behavior**:
1. Verify user authentication from session
2. Extract caller address from session
3. Parse and validate request body
4. Validate percentages sum to 100
5. Call `buildUpdateSplitTx` with caller
6. Return transaction XDR to frontend
7. Handle and format any errors

### 4. Session Management Module

For this initial implementation, we'll use a simplified session approach. In production, this should be replaced with a robust authentication system.

#### Interface: `Session`

```typescript
interface Session {
  address: string;
  publicKey: string;
  authenticated: boolean;
}
```

#### Function: `getSession`

```typescript
async function getSession(request: Request): Promise<Session | null>
```

**Purpose**: Extracts and validates session from request headers or cookies.

## Data Models

### SplitPercentages

```typescript
interface SplitPercentages {
  spending: number;    // 0-100
  savings: number;     // 0-100
  bills: number;       // 0-100
  insurance: number;   // 0-100
}
```

**Constraints**:
- All values must be non-negative
- Sum must equal exactly 100
- Values can be integers or decimals

### TransactionResult

```typescript
interface TransactionResult {
  xdr: string;                    // Base64-encoded transaction XDR
  simulate?: {
    cost: string;                 // Estimated transaction cost in stroops
    results: any[];               // Simulation results from Soroban
  };
}
```

### APIResponse

```typescript
interface APIResponse {
  success: boolean;
  xdr?: string;
  simulate?: {
    cost: string;
    results: any[];
  };
  message?: string;
  error?: string;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 1.1 and 2.1 both test transaction building with correct contract invocations (initialize vs update)
- Properties 1.2 and 2.2 both test caller/owner parameter usage
- Properties 1.3 and 2.3 both test XDR return format
- Properties 1.5 and 2.5 are identical validation logic
- Properties 4.1 and 5.1 test the same authentication requirement
- Properties 4.3 and 5.3 test the same session extraction
- Properties 4.5 and 5.5 test the same response format

These will be combined into comprehensive properties that cover both initialize and update operations.

### Core Properties

**Property 1: Transaction builder returns valid XDR**
*For any* valid owner/caller address and valid percentage allocation (summing to 100), both buildInitializeSplitTx and buildUpdateSplitTx should return a string that can be parsed as valid Stellar transaction XDR.
**Validates: Requirements 1.1, 1.3, 2.1, 2.3, 3.3, 3.4**

**Property 2: Caller address is correctly embedded**
*For any* valid Stellar address and valid percentages, the transaction XDR returned by buildInitializeSplitTx should contain the provided address as the owner parameter, and buildUpdateSplitTx should contain it as the caller parameter.
**Validates: Requirements 1.2, 2.2**

**Property 3: Percentage validation rejects invalid sums**
*For any* set of four percentages that do not sum to exactly 100, the validation function should reject the input and throw an error indicating the actual sum.
**Validates: Requirements 1.5, 2.5, 6.1, 6.3, 6.4**

**Property 4: Percentage validation accepts valid sums**
*For any* set of four non-negative percentages that sum to exactly 100, the validation function should accept the input and allow transaction building to proceed.
**Validates: Requirements 6.1, 6.2**

**Property 5: API authentication enforcement**
*For any* request to /api/split/initialize or /api/split/update without valid authentication, the API should reject the request with a 401 status and authentication error message.
**Validates: Requirements 4.1, 4.2, 5.1, 5.2**

**Property 6: API extracts caller from session**
*For any* authenticated request with a valid session, the API routes should extract the caller address from the session and pass it to the transaction builder functions.
**Validates: Requirements 4.3, 4.4, 5.3, 5.4**

**Property 7: API response structure consistency**
*For any* successful transaction build, the API response should contain a success field set to true, an xdr field with the transaction XDR string, and optionally a simulate field with cost and results.
**Validates: Requirements 4.5, 5.5, 7.5**

**Property 8: Error messages are informative**
*For any* transaction building failure, the system should return an error object containing a descriptive message indicating the specific failure reason.
**Validates: Requirements 3.5, 6.4**

**Property 9: Custodial mode signing**
*For any* valid transaction build request when custodial mode is enabled, the returned transaction XDR should contain a valid signature from the server key.
**Validates: Requirements 1.4, 2.4**

## Error Handling

### Validation Errors

**Percentage Sum Validation**
- Error Type: `ValidationError`
- Trigger: Percentages don't sum to 100
- Response: `{ success: false, error: "Percentages must sum to 100. Current sum: {actual}" }`
- HTTP Status: 400

**Negative Percentage Validation**
- Error Type: `ValidationError`
- Trigger: Any percentage is negative
- Response: `{ success: false, error: "All percentages must be non-negative" }`
- HTTP Status: 400

**Missing Fields Validation**
- Error Type: `ValidationError`
- Trigger: Required percentage fields missing from request
- Response: `{ success: false, error: "Missing required fields: spending, savings, bills, insurance" }`
- HTTP Status: 400

### Authentication Errors

**Unauthenticated Request**
- Error Type: `AuthenticationError`
- Trigger: No valid session found
- Response: `{ success: false, error: "Unauthorized" }`
- HTTP Status: 401

**Invalid Session**
- Error Type: `AuthenticationError`
- Trigger: Session exists but is invalid or expired
- Response: `{ success: false, error: "Invalid or expired session" }`
- HTTP Status: 401

### Transaction Building Errors

**Contract Not Found**
- Error Type: `ContractError`
- Trigger: Soroban contract ID not configured or invalid
- Response: `{ success: false, error: "Contract configuration error" }`
- HTTP Status: 500

**Network Error**
- Error Type: `NetworkError`
- Trigger: Unable to connect to Stellar network
- Response: `{ success: false, error: "Network connection failed" }`
- HTTP Status: 503

**Invalid Address**
- Error Type: `ValidationError`
- Trigger: Provided address is not a valid Stellar address
- Response: `{ success: false, error: "Invalid Stellar address format" }`
- HTTP Status: 400

**Simulation Failure**
- Error Type: `SimulationError`
- Trigger: Transaction simulation fails
- Response: `{ success: false, error: "Transaction simulation failed: {reason}" }`
- HTTP Status: 400

### Error Handling Strategy

1. **Input Validation**: Validate all inputs at the API boundary before calling transaction builders
2. **Early Return**: Return errors immediately upon detection to avoid unnecessary processing
3. **Structured Errors**: Use consistent error response format across all endpoints
4. **Logging**: Log all errors with context for debugging (user ID, request parameters, stack trace)
5. **User-Friendly Messages**: Provide clear, actionable error messages to frontend
6. **Error Recovery**: For transient errors (network issues), suggest retry with exponential backoff

## Testing Strategy

This feature requires both unit testing and property-based testing to ensure correctness across all input combinations.

### Property-Based Testing

We will use **fast-check** as the property-based testing library for TypeScript/JavaScript. Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage.

**Test Configuration**:
```typescript
import fc from 'fast-check';

// Run each property test with 100 iterations
const testConfig = { numRuns: 100 };
```

**Property Test Tagging**:
Each property-based test must include a comment tag referencing the design document property:
```typescript
// Feature: remittance-split-transactions, Property 1: Transaction builder returns valid XDR
```

**Property Tests to Implement**:

1. **Property 1 Test**: Generate random valid addresses and percentage combinations, verify XDR validity
2. **Property 2 Test**: Generate random addresses, verify they appear correctly in transaction
3. **Property 3 Test**: Generate random invalid percentage combinations, verify rejection
4. **Property 4 Test**: Generate random valid percentage combinations, verify acceptance
5. **Property 5 Test**: Generate requests without auth tokens, verify rejection
6. **Property 6 Test**: Generate authenticated requests, verify caller extraction
7. **Property 7 Test**: Generate valid requests, verify response structure
8. **Property 8 Test**: Generate various error conditions, verify error messages
9. **Property 9 Test**: Generate requests in custodial mode, verify signatures

**Generators**:
- `validStellarAddress()`: Generates valid Stellar account addresses
- `validPercentages()`: Generates four numbers that sum to 100
- `invalidPercentages()`: Generates four numbers that don't sum to 100
- `negativePercentages()`: Generates at least one negative percentage
- `authToken()`: Generates valid authentication tokens
- `session()`: Generates valid session objects

### Unit Testing

Unit tests will cover specific examples and integration points:

**Transaction Builder Tests**:
- Test buildInitializeSplitTx with known inputs produces expected XDR structure
- Test buildUpdateSplitTx with known inputs produces expected XDR structure
- Test transaction includes correct contract ID
- Test transaction includes correct function name
- Test simulation mode returns cost estimates

**Validation Tests**:
- Test validatePercentages with [25, 25, 25, 25] passes
- Test validatePercentages with [50, 30, 15, 5] passes
- Test validatePercentages with [25, 25, 25, 26] fails
- Test validatePercentages with [-10, 40, 40, 30] fails
- Test validatePercentages with [0, 0, 0, 100] passes (edge case)

**API Route Tests**:
- Test /api/split/initialize with valid auth and data returns 200
- Test /api/split/initialize without auth returns 401
- Test /api/split/initialize with invalid percentages returns 400
- Test /api/split/update with valid auth and data returns 200
- Test /api/split/update without auth returns 401
- Test /api/split/update with invalid percentages returns 400

**Session Management Tests**:
- Test getSession extracts address from valid session
- Test getSession returns null for missing session
- Test getSession returns null for expired session

### Integration Testing

Integration tests will verify end-to-end flows:

1. **Initialize Flow**: Mock authenticated request → API route → transaction builder → XDR response
2. **Update Flow**: Mock authenticated request → API route → transaction builder → XDR response
3. **Error Flow**: Mock invalid request → validation → error response

## Configuration

### Environment Variables

```bash
# Stellar Network Configuration
STELLAR_NETWORK=testnet                    # or 'mainnet'
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# Contract Configuration
REMITTANCE_SPLIT_CONTRACT_ID=C...          # Deployed contract ID

# Server Configuration (for custodial mode)
SERVER_SECRET_KEY=S...                     # Optional: for custodial signing
CUSTODIAL_MODE=false                       # Enable/disable custodial signing

# Session Configuration
SESSION_SECRET=...                         # Secret for session encryption
SESSION_TIMEOUT=3600                       # Session timeout in seconds
```

### Contract Configuration

The system needs to know the deployed Soroban contract ID for the remittance split contract. This should be configured per environment:

```typescript
// lib/config/contracts.ts
export const CONTRACTS = {
  remittanceSplit: {
    testnet: 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    mainnet: 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  }
};
```

## Security Considerations

1. **Private Key Management**: Server secret key (if used for custodial mode) must be stored securely using environment variables or secret management service
2. **Session Security**: Sessions must be encrypted and have reasonable timeout periods
3. **Input Validation**: All user inputs must be validated before processing
4. **Rate Limiting**: API endpoints should implement rate limiting to prevent abuse
5. **CORS Configuration**: API routes should have appropriate CORS headers for frontend origin
6. **XDR Validation**: Validate that built XDR is well-formed before returning to client
7. **Address Validation**: Verify that provided addresses are valid Stellar addresses
8. **Audit Logging**: Log all transaction building requests for audit purposes

## Performance Considerations

1. **Transaction Simulation**: Simulation is optional and can be skipped for faster responses
2. **Caching**: Contract instances can be cached to avoid repeated loading
3. **Connection Pooling**: Reuse Stellar SDK connections where possible
4. **Async Operations**: All transaction building operations are async to avoid blocking
5. **Response Size**: XDR strings are relatively small (< 10KB typically)

## Deployment Notes

1. **Contract Deployment**: Remittance split contract must be deployed to Stellar network before this feature can be used
2. **Environment Configuration**: All environment variables must be set before deployment
3. **Network Selection**: Ensure correct network passphrase and Horizon URL for target environment
4. **Testing**: Test on testnet before deploying to mainnet
5. **Monitoring**: Set up monitoring for API endpoint response times and error rates

## Frontend Integration Guide

### Overview

The backend provides transaction building services only. The frontend is responsible for:
1. Signing transactions with the user's wallet
2. Submitting signed transactions to the Stellar network
3. Monitoring transaction status

### Initialize Split Flow

```typescript
// 1. Call API to build transaction
const response = await fetch('/api/split/initialize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    spending: 40,
    savings: 30,
    bills: 20,
    insurance: 10
  })
});

const { xdr, simulate } = await response.json();

// 2. Sign transaction with user's wallet (e.g., Freighter)
const signedXdr = await window.freighter.signTransaction(xdr, {
  network: 'TESTNET'
});

// 3. Submit to Stellar network
const result = await StellarSdk.Server
  .submitTransaction(signedXdr);

// 4. Handle result
if (result.successful) {
  console.log('Split initialized successfully');
} else {
  console.error('Transaction failed:', result);
}
```

### Update Split Flow

```typescript
// Same pattern as initialize, but use /api/split/update endpoint
const response = await fetch('/api/split/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    spending: 50,
    savings: 25,
    bills: 15,
    insurance: 10
  })
});

// Follow same signing and submission steps as initialize
```

### Error Handling

```typescript
const response = await fetch('/api/split/initialize', {
  method: 'POST',
  headers: { /* ... */ },
  body: JSON.stringify(percentages)
});

if (!response.ok) {
  const error = await response.json();
  
  switch (response.status) {
    case 400:
      // Validation error - show user the error message
      showError(error.error);
      break;
    case 401:
      // Authentication error - redirect to login
      redirectToLogin();
      break;
    case 500:
      // Server error - show generic error and retry
      showError('Server error. Please try again.');
      break;
  }
  return;
}

// Success - proceed with signing
const { xdr } = await response.json();
```

## Future Enhancements

1. **Batch Operations**: Support building multiple transactions in a single request
2. **Transaction Templates**: Pre-built transaction templates for common split configurations
3. **Fee Estimation**: More accurate fee estimation based on current network conditions
4. **Transaction Caching**: Cache built transactions for a short period to avoid rebuilding
5. **Webhook Support**: Notify frontend when transaction is confirmed on-chain
6. **Multi-Signature Support**: Support for transactions requiring multiple signatures
7. **Transaction History**: Store history of built transactions for audit purposes
8. **Advanced Validation**: Validate against user's current split configuration to prevent conflicts
