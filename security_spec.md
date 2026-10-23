# Firestore Zero-Trust Security Specification (`FC 27 UT App`)

## 1. Data Invariants
1. **Identity & Ownership**: A `/users/{userId}` document can only be read, created, or updated by a verified authenticated user whose `request.auth.uid == userId` and `data.ownerId == request.auth.uid`.
2. **Master Gate Relational Sync**: A `/users/{userId}/investments/{investmentId}` document cannot exist or be accessed unless its parent `/users/{userId}` document exists and its `ownerId == request.auth.uid`.
3. **Strict Schema & Volumetric Bounds**: All strings and integers enforce explicit min/max boundaries matching `firebase-blueprint.json` (`clubName <= 64`, `coins <= 100000000`, `dailySp <= 850`, `galleryLevel <= 100`).
4. **Temporal & Immortal Integrity**: `createdAt` and `ownerId` are immutable after creation; `createdAt` (on create) and `updatedAt` (on create/update) must strictly equal `request.time`.
5. **Terminal State Locking**: Once a `TrackedInvestment` reaches `status == 'sold'`, no further updates are permitted.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unverified Email Spoof**: Authenticated user with `email_verified: false` attempting `create` on `/users/uid1`. -> `PERMISSION_DENIED`
2. **Cross-User PII/Wallet Read**: User `uid2` attempting `get` on `/users/uid1`. -> `PERMISSION_DENIED`
3. **Shadow Field Injection**: Updating `/users/uid1` with an undeclared field `isAdmin: true`. -> `PERMISSION_DENIED`
4. **OwnerHijack Mutation**: Updating `/users/uid1` with `ownerId: 'attacker_uid'`. -> `PERMISSION_DENIED`
5. **Timestamp Forgery**: Creating `/users/uid1` with a past or future client `createdAt` timestamp != `request.time`. -> `PERMISSION_DENIED`
6. **SP Cap Overflow**: Updating `/users/uid1` with `dailySp: 99999` (exceeds 850 daily match cap). -> `PERMISSION_DENIED`
7. **ID Poisoning Attack**: Creating `/users/uid1/investments/invalid$id!@#` with non-alphanumeric path characters. -> `PERMISSION_DENIED`
8. **Orphaned Subcollection Write**: Creating `/users/uid1/investments/inv1` when `/users/uid1` does not exist. -> `PERMISSION_DENIED`
9. **Terminal State Re-Open**: Updating `/users/uid1/investments/inv1` when `resource.data.status == 'sold'`. -> `PERMISSION_DENIED`
10. **Value Poisoning on Update**: Updating `coins` with a string `'million'` instead of an `int`. -> `PERMISSION_DENIED`
11. **Blanket List Scraping**: Listing `/users/uid1/investments` as `uid2` or without matching `resource.data.ownerId == request.auth.uid`. -> `PERMISSION_DENIED`
12. **Denial-of-Wallet String Bomb**: Sending a 50KB `clubName` string to `/users/uid1`. -> `PERMISSION_DENIED`
