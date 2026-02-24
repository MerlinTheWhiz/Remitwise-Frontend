# Requirements Document

## Introduction

This feature enables the RemitWise application to build unsigned Soroban transactions for initializing and updating remittance split configurations. The backend will construct transaction XDR that the frontend can sign with the user's wallet and submit to the Stellar network. This approach maintains user custody of their funds while providing a seamless transaction building service.

## Glossary

- **Soroban**: Smart contract platform on the Stellar network
- **Transaction XDR**: External Data Representation format for Stellar transactions, a serialized transaction ready for signing
- **RemitWise System**: The RemitWise remittance and financial planning application
- **Split Configuration**: User-defined percentage allocation across spending, savings, bills, and insurance categories
- **Custodial Mode**: Optional mode where the server signs transactions on behalf of users
- **Non-Custodial Mode**: Default mode where users sign their own transactions
- **Caller**: The authenticated user making the API request
- **Owner**: The account that owns and controls the split configuration
- **Session**: Authenticated user session containing caller identity
- **Contract Function**: A callable method on a deployed Soroban smart contract
- **Simulation Result**: Pre-execution result showing estimated fees and resource usage

## Requirements

### Requirement 1

**User Story:** As a RemitWise user, I want to initialize my remittance split configuration, so that I can automatically allocate incoming funds across my financial priorities.

#### Acceptance Criteria

1. WHEN a user requests split initialization THEN the RemitWise System SHALL build a Soroban transaction that invokes the initialize function with the provided percentages
2. WHEN building the initialization transaction THEN the RemitWise System SHALL use the authenticated caller from the session as the owner parameter
3. WHEN the initialization transaction is built THEN the RemitWise System SHALL return the transaction XDR to the frontend for user signing
4. WHERE the system operates in custodial mode THEN the RemitWise System SHALL sign the transaction with the server key before returning it
5. WHEN percentages are provided for initialization THEN the RemitWise System SHALL validate that spending, savings, bills, and insurance percentages sum to exactly 100

### Requirement 2

**User Story:** As a RemitWise user, I want to update my existing remittance split configuration, so that I can adjust my financial allocation as my priorities change.

#### Acceptance Criteria

1. WHEN a user requests split update THEN the RemitWise System SHALL build a Soroban transaction that invokes the update function with the new percentages
2. WHEN building the update transaction THEN the RemitWise System SHALL use the authenticated caller from the session as the caller parameter
3. WHEN the update transaction is built THEN the RemitWise System SHALL return the transaction XDR to the frontend for user signing
4. WHERE the system operates in custodial mode THEN the RemitWise System SHALL sign the transaction with the server key before returning it
5. WHEN percentages are provided for update THEN the RemitWise System SHALL validate that spending, savings, bills, and insurance percentages sum to exactly 100

### Requirement 3

**User Story:** As a RemitWise developer, I want reusable transaction building functions, so that I can maintain consistent Soroban transaction construction across the application.

#### Acceptance Criteria

1. WHEN the system needs to build an initialization transaction THEN the RemitWise System SHALL invoke buildInitializeSplitTx with owner, spending, savings, bills, and insurance parameters
2. WHEN the system needs to build an update transaction THEN the RemitWise System SHALL invoke buildUpdateSplitTx with caller, spending, savings, bills, and insurance parameters
3. WHEN either build function is invoked THEN the RemitWise System SHALL return either transaction XDR or a simulation result object containing both simulate data and XDR
4. WHEN building transactions THEN the RemitWise System SHALL construct valid Soroban contract invocations that can be submitted to the Stellar network
5. WHEN transaction building fails THEN the RemitWise System SHALL provide clear error messages indicating the failure reason

### Requirement 4

**User Story:** As a RemitWise user, I want to initialize my split through a protected API endpoint, so that only authenticated users can create split configurations.

#### Acceptance Criteria

1. WHEN a POST request is made to /api/split/initialize THEN the RemitWise System SHALL require valid authentication
2. WHEN an unauthenticated request is made to /api/split/initialize THEN the RemitWise System SHALL reject the request with an authentication error
3. WHEN an authenticated request is made to /api/split/initialize THEN the RemitWise System SHALL extract the caller identity from the session
4. WHEN the request body contains valid percentages THEN the RemitWise System SHALL invoke buildInitializeSplitTx with the session caller as owner
5. WHEN the transaction is successfully built THEN the RemitWise System SHALL return the transaction XDR or simulation result in the response body

### Requirement 5

**User Story:** As a RemitWise user, I want to update my split through a protected API endpoint, so that only authenticated users can modify their split configurations.

#### Acceptance Criteria

1. WHEN a POST request is made to /api/split/update THEN the RemitWise System SHALL require valid authentication
2. WHEN an unauthenticated request is made to /api/split/update THEN the RemitWise System SHALL reject the request with an authentication error
3. WHEN an authenticated request is made to /api/split/update THEN the RemitWise System SHALL extract the caller identity from the session
4. WHEN the request body contains valid percentages THEN the RemitWise System SHALL invoke buildUpdateSplitTx with the session caller
5. WHEN the transaction is successfully built THEN the RemitWise System SHALL return the transaction XDR or simulation result in the response body

### Requirement 6

**User Story:** As a RemitWise user, I want my percentage inputs validated, so that I cannot create invalid split configurations that don't total 100%.

#### Acceptance Criteria

1. WHEN percentages are provided in any API request THEN the RemitWise System SHALL calculate the sum of spending, savings, bills, and insurance percentages
2. WHEN the percentage sum equals 100 THEN the RemitWise System SHALL proceed with transaction building
3. WHEN the percentage sum does not equal 100 THEN the RemitWise System SHALL reject the request with a validation error
4. WHEN validation fails THEN the RemitWise System SHALL return an error message indicating the actual sum and expected sum
5. WHEN any percentage is negative THEN the RemitWise System SHALL reject the request with a validation error

### Requirement 7

**User Story:** As a frontend developer, I want clear documentation on transaction submission, so that I understand my responsibility to sign and submit transactions.

#### Acceptance Criteria

1. WHEN the API returns a transaction THEN the RemitWise System SHALL include documentation indicating frontend signing responsibility
2. WHEN documentation is provided THEN the RemitWise System SHALL specify that the backend only builds transactions
3. WHEN documentation is provided THEN the RemitWise System SHALL specify that the frontend must sign transactions with the user's wallet
4. WHEN documentation is provided THEN the RemitWise System SHALL specify that the frontend must submit signed transactions to the Stellar network
5. WHEN the response includes XDR THEN the RemitWise System SHALL provide clear field names indicating the transaction data
