# RKAC Finance - Reimbursement Claim Module BRD
*(Integrated reimbursement claim submission, approval, and cheque publication)*

Date: 2026-03-30
Status: Current-state aligned draft
Related document: `document/member_admin_requirement_analysis.md`

## 1. Executive Summary

This document replaces the earlier expense-claim draft with a version aligned to:

- the current RKAC Finance codebase
- the previously discussed member-admin direction
- the updated decision to build one integrated reimbursement claim module, not a separate OCR project

The reimbursement feature should be implemented as a new module inside RKAC Finance with:

- a member-facing claim submission experience
- an internal approval and cheque workflow
- secure receipt upload
- role-based claim review and approval
- full auditability
- future OCR support as an optional enhancement, not a prerequisite

The key architectural point is that the reimbursement module is a workflow-driven business feature. Receipt OCR is only a supporting subsystem.

## 2. Current-State Findings From The Existing Project

The current project is not a blank slate. The design must fit the code that already exists.

### 2.1 Existing application foundation

The project already uses:

- Next.js App Router
- Prisma with PostgreSQL
- server actions and route handlers
- JWT cookie sessions
- RBAC tables for internal admin users
- Vitest coverage for page guards and server action authorization

### 2.2 Internal authentication today

Current sign-in is internal-admin only:

- route: `/login`
- credential table: `Admin`
- session cookie: `session`
- current role codes in code: `super`, `treasurer`, `pastor`

This means the current authentication layer is ready for finance/admin users, but it does not yet support church-member claimant login.

### 2.3 Member data today

The existing `Member` model is currently donation/tax oriented and is used under the income workspace.

Current characteristics:

- `email` is optional
- there is no member password or portal credential
- there is no member login session
- there is no claim history relationship
- the current UI label is still `Member Tax Info`

This confirms the reimbursement claimant experience requires a new member-facing identity/access layer.

### 2.4 RBAC limitations today

The current project already has `Role`, `Permission`, and `AdminRoleAssignment`, but the running authorization helpers are still fairly coarse:

- finance access is effectively broad (`super` and `treasurer`)
- `/admin` is super-only
- there is no `department_director` role yet
- there is no department-scoped role assignment model
- there is no claim-specific permission model yet

The reimbursement module therefore cannot rely only on `canAccessFinance()` style checks.

### 2.5 Category and receipt limitations today

The current data structures are not yet suitable for claim expenses as-is:

- `Category` currently powers income type/method selectors, not expense taxonomy
- donation receipts are generated PDFs saved under `public/receipts/...`
- there is no generic secure upload subsystem for member-submitted claim receipts

This is important because reimbursement receipts should not be stored as publicly accessible files in the same way donation receipts are.

## 3. Key Refinements From The Previous Draft

This updated BRD makes the following design corrections:

- The module is now defined as one integrated reimbursement-claim workflow, not a receipt/OCR experiment.
- OCR is a future supporting feature only.
- Members do require a managed claimant access model if they are going to submit claims online.
- Claim completion in phase 1 happens when approved cheque details are recorded.
- Claimant cheque-receipt confirmation is not part of the core phase-1 workflow.
- Expense categories must be separate from the current income category structure.
- Approval must be department-aware and enforced in backend policy, not only in UI.
- Uploaded reimbursement receipts must use protected storage, not the current public receipt file pattern.

## 4. Business Goal

The goal of this module is to let authorized church members submit reimbursement claims online and let authorized internal users review, approve, and complete those claims through cheque issuance inside the existing RKAC Finance application.

The module should support:

- claimant submission of reimbursement claims
- multiple claim items per submission
- one or more receipts linked to each claim item
- internal review and approval
- prevention of self-approval
- optional cross-department approval based on policy
- cheque publication/recording
- claim completion once cheque details are saved
- full audit history

## 5. Scope

### 5.1 In Scope For Core Delivery

- Member claimant login or invitation-based first access
- Reimbursement claim draft, submit, return, approve, reject, and complete flows
- Department selection
- Expense category selection with up to two levels
- Multi-line claims
- Receipt upload and secure retrieval
- Internal approval workspace
- Cheque data recording
- Audit logging for all sensitive actions
- Integration with current RKAC Finance RBAC and member data

### 5.2 Explicitly Out Of Scope For Initial Delivery

- OCR-required submission
- automated accounting ledger posting
- budgeting
- bank reconciliation
- financial reporting dashboards for expenditures
- claimant cheque receipt confirmation
- bank payment confirmation workflow
- duplicate receipt detection
- push/email notification automation

Those may be added later, but they should not block the core claim workflow.

## 6. Core Design Decisions

### 6.1 Integrated claim module, not a separate OCR project

The primary entity is the reimbursement claim submission.

Receipt upload and OCR are subordinate capabilities that support the claim items.

### 6.2 Reuse the existing member domain as the claimant identity source

The project should continue to treat `Member` as the business identity for church members.

The reimbursement module should not introduce a second unrelated claimant person table.

### 6.3 Keep internal admin login separate from claimant login

Based on the current codebase, the cleanest near-term approach is:

- keep internal finance/approver access on the existing admin login foundation
- add a separate member-facing claimant login surface for reimbursement users

Recommended member-facing routes:

- `/member/login`
- `/member/claims`
- `/member/claims/[id]`

Recommended internal routes:

- `/expenditure`
- `/expenditure/claims`
- `/expenditure/claims/[id]`
- `/expenditure/approvals`
- `/expenditure/cheques`

This fits the current app structure, where `Expenditure` is already planned as its own future workspace.

### 6.4 Do not create separate login tables per role

Treasurer, pastor, department director, and super admin should remain role assignments, not separate user/account types.

In other words:

- roles differ by authorization
- they do not require separate identity tables

This remains true even if the project keeps the current `Admin` table for internal users during the first implementation phase.

### 6.5 Move claim authorization toward permission-based policy checks

The current hard-coded role arrays are not enough for this workflow.

The reimbursement module needs permission-level rules such as:

- `claim.create`
- `claim.view.own`
- `claim.view.all`
- `claim.review`
- `claim.approve`
- `claim.approve.cross_department`
- `claim.publish_cheque`
- `claim.manage_master_data`

### 6.6 Store money as integer cents

The current project already stores financial values as integers in several places. The reimbursement module should follow the same rule for consistency and to avoid decimal precision issues.

## 7. User Types And Permission Direction

### 7.1 Claimant Member

Responsibilities:

- create claim drafts
- edit own draft or returned claims
- upload receipts
- submit claims
- view own claim history

Restrictions:

- cannot approve claims
- cannot publish cheque details

### 7.2 Department Director

Responsibilities:

- review claims
- approve, reject, or return claims if assigned that permission

Restrictions:

- cannot approve own claim
- cross-department approval allowed only if explicitly granted

### 7.3 Treasurer

Responsibilities:

- review claims
- approve, reject, or return claims
- publish cheque details

Restrictions:

- cannot approve own claim

### 7.4 Senior Pastor

Responsibilities:

- review claims
- approve, reject, or return claims

Restrictions:

- cannot approve own claim

### 7.5 Super Admin / Finance Admin

Responsibilities:

- manage master data
- manage role assignments
- perform administrative oversight
- optionally publish cheque details if granted

Restrictions:

- cannot approve own claim

### 7.6 Treasurer Director

If RKAC still intends to keep `treasurer director` as a distinct governance role, it should be implemented as another RBAC role with explicit permissions. It should not become a separate account type.

## 8. Approval Policy

### 8.1 Mandatory business rules

The module must enforce the following in backend logic:

- a claimant cannot approve their own claim
- only authorized internal roles may approve
- department scoping must be checked server-side
- every approval decision must be logged

### 8.2 Cross-department approval

Cross-department approval should not be globally implied by role name.

Recommended rule:

- use a dedicated permission such as `claim.approve.cross_department`

This is more flexible than assuming every director or treasurer can always approve any department claim.

### 8.3 Modification during review

The preferred workflow is:

- claimant edits own claim while in `DRAFT` or `RETURNED`
- approvers review, approve, reject, or return

If internal users are allowed to modify submitted claim data directly, every changed field must be audit-logged with previous and new values.

## 9. Claim Workflow

### 9.1 Core phase-1 workflow

1. Member signs in to claimant portal.
2. Member creates a reimbursement claim draft.
3. Member selects department, submission date, cheque receiver name, and adds claim items.
4. Member uploads one or more receipts for relevant claim items.
5. Member submits the claim.
6. Internal approver reviews the claim.
7. Approver approves, rejects, or returns the claim.
8. Treasurer or authorized finance user records cheque information.
9. Claim is marked complete when cheque information is saved.

### 9.2 Recommended status model

Use the following statuses:

- `DRAFT`
- `SUBMITTED`
- `UNDER_REVIEW`
- `RETURNED`
- `REJECTED`
- `APPROVED`
- `COMPLETED`

### 9.3 Status transition notes

- `RETURNED` allows claimant edits and resubmission
- `REJECTED` is terminal unless a future reopen flow is added
- `APPROVED` means ready for cheque issuance
- `COMPLETED` is reached when cheque details are recorded

If the team later wants a separate operational state for cheque publication, timestamps can be stored for both `chequePublishedAt` and `completedAt`, even if they are set together in phase 1.

## 10. Functional Requirements

### 10.1 Claim submission

The claimant must be able to:

- create a new claim
- save a draft
- edit a draft
- submit a claim
- view current and past claims

Required claim-level data:

- claimant member reference
- department
- submission date
- cheque receiver name
- optional overall note
- total amount in cents

### 10.2 Claim items

A claim may contain multiple line items.

Each item should capture:

- expense category
- amount in cents
- optional note
- sort order

Recommended rule:

- departments should be selected at claim header level unless RKAC explicitly needs mixed-department claims

This keeps approval routing simpler and better matches the current requirement set.

### 10.3 Receipt handling

Each claim item may have one or more receipts.

Initial requirements:

- image and PDF upload support
- mobile-friendly upload experience
- file metadata capture
- secure preview/download for authorized users

Important implementation note:

- uploaded reimbursement receipts must not be stored under `public/receipts`

Instead, use protected storage plus:

- signed URLs with expiry, or
- authenticated download endpoints

### 10.4 Review workspace

Authorized internal users must be able to:

- view submitted claims
- inspect line items and receipts
- see claimant, department, totals, and notes
- approve, reject, or return claims
- view prior approval actions

### 10.5 Cheque publication

Only authorized finance users should be able to record cheque details after approval.

Required cheque data:

- cheque serial/number
- cheque amount in cents
- cheque receiver name
- cheque issue/publication timestamp
- publishing user

### 10.6 Claim completion

For the initial version of this module, a claim becomes complete when cheque details are saved.

This replaces the older draft assumption that claimant cheque-receipt confirmation is required before completion.

## 11. Recommended Technical Shape For This Codebase

### 11.1 Route structure

Recommended internal workspace:

```text
/expenditure
  /claims
  /claims/[id]
  /approvals
  /cheques
```

Recommended member portal:

```text
/member/login
/member/claims
/member/claims/new
/member/claims/[id]
```

This avoids mixing reimbursement workflows into the current `/income` area and matches the existing landing-page direction.

### 11.2 Authorization implementation

The current app already has route guards and server-action guard tests. The reimbursement module should follow the same pattern, but with claim-specific policy helpers instead of broad finance checks.

Recommended additions:

- claim policy helper functions
- page guard tests for expenditure routes
- server action tests for submission, approval, and cheque actions

### 11.3 Member portal authentication

The claimant portal should not reuse the current admin `/login` session directly.

Recommended direction:

- separate member-facing login route
- separate member session/cookie
- invitation or first-login password setup flow

Recommended security practice:

- do not email reusable passwords
- send a one-time setup link or token

### 11.4 Internal role model

The current `AdminRoleAssignment` structure is not sufficient for department-aware approval on its own because it has no department scope or effective dates.

The reimbursement module needs one of the following:

- an expanded scoped role-assignment model, or
- a new department-aware assignment table

Minimum needed fields for scoped assignment:

- internal user id
- role id
- department id nullable
- effective from
- effective to nullable
- active flag

### 11.5 Expense master data

Do not reuse the current `Category` table for reimbursement expense categories.

Recommended new master data:

- `Department`
- `ExpenseCategory`

`ExpenseCategory` should support two levels through self-reference.

## 12. Recommended Domain Model

This section describes the target logical model. Exact Prisma naming can be finalized during implementation.

### 12.1 Existing entities to reuse

- `Member`
- `Admin`
- `Role`
- `Permission`

### 12.2 Member access entities

#### `MemberPortalAccount`

Purpose:

- claimant authentication tied 1:1 to `Member`

Suggested fields:

- `id`
- `memberId`
- `email`
- `passwordHash`
- `isActive`
- `portalEnabled`
- `passwordSetAt`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

This can also be implemented by extending `Member` directly, but a dedicated 1:1 account table is a cleaner fit for the current codebase because `Member` is still a donation-focused master record today.

#### `MemberPortalToken`

Purpose:

- first-login setup
- password reset

Suggested fields:

- `id`
- `memberPortalAccountId`
- `tokenHash`
- `type`
- `expiresAt`
- `usedAt`
- `createdAt`

### 12.3 Department and category entities

#### `Department`

Suggested fields:

- `id`
- `code`
- `name`
- `isActive`
- `createdAt`
- `updatedAt`

#### `ExpenseCategory`

Suggested fields:

- `id`
- `parentId` nullable
- `code`
- `name`
- `level`
- `isActive`
- `createdAt`
- `updatedAt`

### 12.4 Claim entities

#### `ExpenseClaim`

Suggested fields:

- `id`
- `claimNumber`
- `claimantMemberId`
- `claimantPortalAccountId`
- `departmentId`
- `submissionDate`
- `chequeReceiverName`
- `status`
- `note` nullable
- `totalAmountCents`
- `submittedAt` nullable
- `approvedAt` nullable
- `completedAt` nullable
- `createdAt`
- `updatedAt`

#### `ExpenseClaimItem`

Suggested fields:

- `id`
- `claimId`
- `categoryId`
- `amountCents`
- `note` nullable
- `sortOrder`
- `createdAt`
- `updatedAt`

#### `ExpenseReceiptUpload`

Suggested fields:

- `id`
- `uploadedByMemberId` nullable
- `uploadedByAdminId` nullable
- `storageKey`
- `originalFilename`
- `mimeType`
- `fileSize`
- `sha256Hash`
- `uploadedAt`
- `deletedAt` nullable

#### `ExpenseClaimItemReceipt`

Purpose:

- link receipts to claim items

Suggested fields:

- `id`
- `claimItemId`
- `receiptUploadId`

### 12.5 Approval and completion entities

#### `ExpenseClaimApproval`

Suggested fields:

- `id`
- `claimId`
- `approverAdminId`
- `approverRoleCode`
- `decision`
- `comment` nullable
- `actedAt`

Decisions should support:

- `APPROVED`
- `REJECTED`
- `RETURNED`

#### `ExpenseClaimCheque`

Suggested fields:

- `id`
- `claimId`
- `chequeNumber`
- `amountCents`
- `receiverName`
- `publishedByAdminId`
- `publishedAt`
- `note` nullable

#### `ExpenseClaimAuditLog`

Purpose:

- immutable activity trail for sensitive actions

Suggested fields:

- `id`
- `claimId`
- `actorType`
- `actorId`
- `action`
- `beforeJson` nullable
- `afterJson` nullable
- `createdAt`

### 12.6 Future OCR entities

OCR should be modeled as optional support tables, not core claim tables.

Suggested future tables:

- `ExpenseReceiptOcrRaw`
- `ExpenseReceiptOcrNormalized`

These should be introduced only after the manual upload and approval workflow is stable.

## 13. Security Requirements

The module must enforce:

- authenticated access for every claimant and internal reviewer
- server-side authorization for all state changes
- no self-approval
- protected file access for uploaded receipts
- password hashes only, never plain-text passwords
- first-login/password-reset tokens instead of emailed passwords
- immutable approval and cheque audit history

Additional recommendation:

- do not expose uploaded receipt file paths directly if they can be guessed

## 14. Reporting And Search Requirements

Initial reporting/search should support:

- claim list by status
- claim list by claimant
- claim list by department
- claim list by approval/completion date
- cheque tracking by number and receiver

Future reporting may add:

- expense summaries by department
- expense summaries by category
- reimbursement trends by month/year

## 15. Retention And Archiving

The earlier draft referenced a 5-year retention period. That requirement should be treated as a project policy input and confirmed separately with RKAC accounting/legal guidance before implementation is finalized.

System design recommendation:

- support archived/hidden status for older records
- keep audit history intact even when records are archived from normal views

## 16. Recommended Delivery Phases

### Phase 0: Foundation

- finalize member-admin direction
- ensure claimant members have unique/usable email addresses
- add claimant portal account model
- add missing role codes and permissions
- introduce department master data

### Phase 1: Core reimbursement workflow

- member claimant login
- claim header and line items
- secure receipt upload
- approval workflow
- cheque publication
- audit logging

### Phase 2: Operational hardening

- notifications
- advanced filtering/search
- department-scoped role management UI
- duplicate receipt detection

### Phase 3: OCR assistance

- OCR worker integration
- normalized receipt extraction
- reviewer confirmation UI
- amount prefill from OCR with user confirmation

The module must work correctly before OCR exists.

## 17. Final Recommendation

The reimbursement feature should be built as a dedicated expenditure workflow inside RKAC Finance, with a member claimant portal and an internal approval workspace.

The design should:

- reuse `Member` as the claimant identity source
- extend the existing RBAC foundation rather than invent a second internal permission system
- add claim-specific authorization rules
- keep reimbursement receipts in protected storage
- treat OCR as a later enhancement

Most importantly, this should be implemented as one coherent reimbursement claim module with member access, approval, cheque issuance, and auditability as the core workflow.
