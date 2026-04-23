# Firestore Security Specification

## Data Invariants
1. **Users**: A user can only manage their own profile. Presence fields (`isOnline`, `lastSeen`, `activeChatId`) can be updated at any time by the owner.
2. **Sub-collections**: `notes`, `results`, `starred`, `mistakes`, and `chat` are private to the user.
3. **Community Chat**: Messages are readable by all authenticated users. Only the sender can edit or delete.
4. **Private Chat**: Strictly restricted to participants.
5. **Leaderboard**: Publicly readable (list restricted to points > 0), but only owners can update their own entry.

## The "Dirty Dozen" Payloads (Target: /users/{userId})
1. **Identity Spoofing**: `update /users/victim-id` as `attacker-id`. (Expected: DENIED)
2. **Privilege Escalation**: `update /users/my-id` with `isAdmin: true`. (Expected: DENIED)
3. **Resource Poisoning**: `update /users/my-id` with `lastSeen` as a 1MB string. (Expected: DENIED)
4. **Sub-collection Access**: `get /users/victim-id/notes/note-1` as `other-user`. (Expected: DENIED)
5. **Community Spoofing**: `create /community_chat/msg-1` with `senderId: victim-id`. (Expected: DENIED)
6. **Private Chat Eavesdropping**: `get /private_chats/victim1_victim2` as `outsider`. (Expected: DENIED)
7. **Leaderboard Theft**: `update /leaderboard/victim-id` as `other-user`. (Expected: DENIED)
8. **Malicious ID**: `create /users/very-long-id-over-128-chars-...` (Expected: DENIED)
9. **State Shortcutting**: `update /duels/duel-1` to `status: finished` without being a player. (Expected: DENIED)
10. **Timestamp Fraud**: `create /users/my-id` with `createdAt` in the future (client-provided). (Expected: DENIED)
11. **PII Leak**: `list /users` seeking `email` field. (Expected: DENIED - list restricted to Admin)
12. **Orphaned Message**: `create /private_chats/non-existent/messages/msg-1`. (Expected: DENIED - check for parent existence)

## Rule Design
- **Master Gate**: All sub-resources under `/users/{userId}` inherit the `isOwner(userId)` check.
- **Validation Blueprints**: `isValidUser`, `isValidMessage`, etc.
- **Temporal Integrity**: Enforce server timestamps where applicable.
