# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. A `PlotOverride` document at `/plot_overrides/{plotId}` MUST have a valid `plotId` (`^[A-N][0-9]{2}$`) matching the document path ID, a valid `houseNumber` starting with `9/` (max 32 chars), a positive numeric `price`, a `status` in `['available', 'showhouse', 'reserved', 'sold', 'not_open']`, a string `note` (max 300 chars), `updatedBy == request.auth.uid`, and `updatedAt == request.time`.
2. Terminal State Locking: Once a `PlotOverride` reaches `status == 'sold'`, non-admin users CANNOT modify or overwrite it. Only `isAdmin()` can modify or delete a sold plot document.
3. A `UserWorkspace` document at `/users/{userId}/preferences/{prefId}` MUST have `prefId == 'workspace'`, `ownerId == userId == request.auth.uid`, bounded `bookmarkedIds` (`size() <= 4`), boolean `soundEnabled`, valid `overlayMode` and `activeTab` enums, and `updatedAt == request.time`.
4. All writes require `isSignedIn() && request.auth.token.email_verified == true`.
5. No user can write to `/admins/{userId}` from the client SDK.
6. PII Isolation (Split Collection): Full customer PII (`customerName`, `customerPhone`, `customerIdCard`) MUST live strictly in `/loan_cases/{caseId}` where `get`, `list`, `update`, and `delete` are restricted to `isAdmin()` or `ownerId == request.auth.uid`.
7. Customer Search Projection: `/loan_public_status/{caseId}` stores NO raw full name, NO raw phone number, NO raw National ID number, and NO project selling price. It stores only `maskedName` (ending with `xxxx`, max 24 chars), `namePrefix3`, `maskedPhone`, `phoneLast4`, `phoneHash`, `idCardHash` (SHA-256 passcode digest), plot/house identifiers, and bank statuses. Only verified staff/owners can write or delete documents in `/loan_public_status/{caseId}`; unauthenticated customers have read-only lookup access and must verify their National ID passcode client-side against `idCardHash` before viewing full status details.

## 2. Dirty Dozen Attack Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated write to `/plot_overrides/A01` or `/loan_public_status/case_1`.
2. Unverified email user writing to `/plot_overrides/A01` or `/loan_cases/case_1`.
3. Shadow field injection (`isAdmin: true` or `price: 9999999`) in `/loan_public_status/case_1` or `/plot_overrides/A01`.
4. Path ID mismatch (`caseId: "case_2"` inside `/loan_public_status/case_1`).
5. Invalid house number not starting with `9/` (`houseNumber: "99/1"`).
6. Negative or zero `price` (`price: -500`).
7. Non-admin modifying a plot whose existing status is `'sold'`.
8. Client-forged `updatedAt` timestamp not equal to `request.time`.
9. Identity spoofing (`updatedBy` or `ownerId` spoofed on `/loan_cases/{caseId}` or `/loan_public_status/{caseId}`).
10. Unbounded array (`bookmarkedIds` with 5+ elements or `banks` with 11+ elements).
11. Cross-user read/list/write on `/users/{otherUid}/preferences/workspace` or `/loan_cases/{otherCaseId}` by non-owner non-admin.
12. Exposing unmasked `maskedName` (not ending with `xxxx`) inside `/loan_public_status/{caseId}` or writing to `/admins/{uid}`.
