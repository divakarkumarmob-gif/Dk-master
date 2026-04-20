# Security Spec: Study Talks System

## Data Invariants
1. `dailyMessageCount` cannot be modified by the user directly.
2. `message_requests` must link to an authenticated `userId`.
3. Admin status can only be checked via server-side lookup or trusted administrative documents, never client-side claims.

## The "Dirty Dozen" (Red Team Payloads)
1. User attempts to set `dailyMessageCount` to 999.
2. User attempts to create a request with a fake `userId`.
3. User attempts to approve their own message request.
4. Blocked user attempts to send message to blocker.
... (Will be validated in final testing)
