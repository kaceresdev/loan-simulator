# Security Specification - Loan Simulator

## Data Invariants
1. A simulation must have a valid `shortCode` matching a specific pattern (6 chars).
2. `amount` must be greater than zero.
3. `termMonths` must be greater than zero.
4. `createdAt` must be set by the server.

## Dirty Dozen Payloads
1. **Invalid ID**: simulationId is a 2KB junk string.
2. **Missing Fields**: creating simulation without `shortCode`.
3. **Negative Amount**: creating simulation with `amount: -100`.
4. **Zero Term**: creating simulation with `termMonths: 0`.
5. **Unauthorized Change**: trying to update an existing simulation.
6. **Fake Timestamp**: providing a client-side `createdAt` in the future.
7. **Invalid Type**: `openingFeeValue` as a string.
8. **Malicious Enum**: `openingFeeType` as 'malicious'.
9. **Id Spoofing**: setting `id` in data different from document ID.
10. **Resource Exhaustion**: `shortCode` is a 1MB string.
11. **Direct Delete**: someone trying to delete a simulation by ID.
12. **Broad Update**: trying to change `createdAt`.

## Test Runner (firestore.rules.test.ts)
```typescript
// Test file implementation would go here
```
