# RKAC Finance Member Admin Module Requirement Analysis

Date: 2026-03-24

## 1. Executive Summary

The requested change is not a small adjustment to the existing member screen. It is the beginning of a new member domain that must support:

- A dedicated member administration module
- A future claimant sign-in experience for reimbursement claims
- Member credentials stored securely
- Future member claim history views
- A more granular permission model than the current finance module

Based on the current codebase, the existing member area is still a sub-feature of the income module and is designed primarily for donation/tax information. The current implementation does not yet support member authentication, separate member-facing login, or the additional roles you listed.

Because of that, I recommend treating this as a new module with its own route, permission rules, and data responsibilities, while still reusing the existing `Member` entity as the starting point.

## 2. Current-State Findings From The Codebase

### 2.1 Member data today

The current Prisma `Member` model already stores donation/tax-related profile data:

- `mbr_id`
- `name_kFull`
- `name_eFirst`
- `name_eLast`
- `email`
- `address`
- `city`
- `province`
- `postal`
- `note`

Important current limitations:

- `email` is optional
- There is no member password field
- There is no member activation/authentication status
- There is no claim history relation
- There is no audit or lifecycle data for member login

### 2.2 Member UI today

The current member UI is inside the income module:

- List page: `/income/member`
- Create page: `/income/member/create`
- Edit action: modal from the member list

The navigation label is currently `Member Tax Info`, which confirms the current feature is positioned as part of the income/tax workflow, not as a dedicated member module.

### 2.3 Access control today

Current RBAC is narrower than your requested requirement.

Roles currently defined in code:

- `super`
- `treasurer`
- `pastor`

Important current limitations:

- `treasurer director` does not exist yet
- `department director` does not exist yet
- `/admin` is effectively super-only
- `/income/member` uses finance access, not dedicated member-module permissions

Today, finance access is effectively:

- `super`
- `treasurer`

This means the existing member screen does not currently match the role visibility/editing rules you requested.

### 2.4 Authentication today

Current login is admin-only:

- Sign-in page: `/login`
- Login API: `/api/auth/login`
- Credential store: `Admin.passwordHash`
- Session cookie: `session`

Important current limitations:

- Members cannot sign in
- There is no separate claimant login entry point
- There is no separate member session type
- Current login copy explicitly says `Admin Sign In`

### 2.5 Existing delete behavior today

There is already a `deleteMember` server action in the codebase. The delete button is hidden in the UI, but the server action exists and is currently tied to broad finance access.

This is important because your requested rule is:

- Only super admin may delete
- All other allowed roles may add/edit only

That means deletion rules must be tightened before this module is considered complete.

## 3. Requested Business Intent

From your message, the intended direction appears to be:

### Phase 1: Now

- Create a dedicated member admin module
- Do not treat member admin as just a link to the income member tax admin
- Extend the member data model to include:
  - member email
  - member password stored as hash
- Allow these roles to access the module:
  - super
  - treasurer
  - treasurer director
  - department director
  - pastor
- Permission rules:
  - `super`: full access including delete
  - all other listed roles: view, add, edit
  - all other listed roles: no deletion

### Phase 2: Later

- Separate sign-in location for members who submit reimbursement claims
- Each member has a page to list claim history
- Integration with the reimbursement claim module

## 4. Functional Scope Analysis

## 4.1 What should be included in the new module now

The current request supports the following scope for the current phase:

- Dedicated member admin entry point and navigation
- Member listing page
- Member creation
- Member editing
- Member deletion restricted to super admin only
- Member data model extended for future login capability
- RBAC updated for the new role set

## 4.2 What should explicitly remain out of scope for now

The following should be documented as future work, not current delivery:

- Member self-service login flow
- Password reset / forgot password user flow
- Reimbursement claim submission UI
- Claim approval workflow
- Claim history page implementation
- Receipt/document upload for claims

## 4.3 Why this should be a separate module

A separate module is justified because the new member domain is no longer only about donation receipt/tax information. It is becoming the identity source for future reimbursement claimants.

That means the module must support:

- profile data
- access credentials
- role-based administration
- future claim relationships

This is broader than the current `/income/member` purpose.

## 5. Recommended Requirement Direction

## 5.1 Route and module structure

I recommend **not** placing the new feature under the existing `/admin` area unless the super-only behavior is intentionally redesigned.

Reason:

- Current `/admin` routing is effectively reserved for super admin only
- Your requested member module must also be accessible by treasurer, treasurer director, department director, and pastor

Recommended options:

- Preferred: create a dedicated top-level module such as `/members`
- Acceptable: create another non-super-only workspace such as `/member-admin`

I do **not** recommend keeping this under `/income/member` if the goal is to separate it from income tax administration conceptually.

## 5.2 Data model recommendation

I recommend extending the existing `Member` model rather than creating a second parallel member table.

Recommended new fields for the current phase:

- `email`
- `passwordHash`
- `isActive`
- `portalEnabled`

Recommended future-support fields:

- `lastLoginAt`
- `passwordUpdatedAt`

Why `portalEnabled` matters:

- Not every donation member may need reimbursement-claim login immediately
- This avoids forcing passwords for members who only exist for donation/tax tracking
- It cleanly separates “member record exists” from “member can sign into claimant portal”

## 5.3 Authentication recommendation for the future claimant portal

For the future reimbursement claimant feature, I recommend a separate sign-in surface and separate member session model.

Recommended direction:

- Admin login remains `/login`
- Member claimant login becomes something like `/member/login` or `/claims/login`
- Use a separate session cookie such as `member_session`

Reason:

- Admin users and members are different actor types
- Access rules and redirects will differ
- Session separation reduces confusion and accidental privilege leakage

## 5.4 Permission model recommendation

The member module should have its own permission group instead of reusing `canAccessFinance()`.

Recommended permission matrix:

| Role | View Members | Add Members | Edit Members | Delete Members |
| --- | --- | --- | --- | --- |
| Super Admin | Yes | Yes | Yes | Yes |
| Treasurer | Yes | Yes | Yes | No |
| Treasurer Director | Yes | Yes | Yes | No |
| Department Director | Yes | Yes | Yes | No |
| Pastor | Yes | Yes | Yes | No |

This should be enforced in:

- route guards
- server actions
- UI action visibility
- API endpoints
- tests

## 6. Requirements That Are Still Vague Or Need Clarification

The following items should be clarified before implementation starts. These are the main areas where the current request is directionally strong but still not specific enough for safe development.

### 6.1 Canonical route/location of the new module

Still unclear:

- Should the dedicated member module live at `/members`, `/member-admin`, or somewhere else?
- Should the existing `/income/member` page be removed, redirected, or kept temporarily?

Why it matters:

- Routing and navigation structure affect middleware, breadcrumbs, redirects, and tests

### 6.2 Role naming and role codes

Still unclear:

- Is the intended role name exactly `treasurer director`?
- Is `tureasurer director` a typo for `treasurer director`?
- Is `pastor` the same as the existing `pastor` role, or should it be `senior pastor`?
- Is `department director` one shared role, or are there multiple department-specific director roles?

Why it matters:

- The codebase uses canonical role codes
- Seed data, RBAC constants, and access checks depend on exact values

### 6.3 Scope of department director access

Still unclear:

- Can department directors manage all members globally?
- Or should department directors only manage members related to their own department claims?

Why it matters:

- Full-member edit access is a major privilege decision
- Future reimbursement claim approval logic may need department scoping

### 6.4 Member email rules

Still unclear:

- Is member email required for every member?
- Must email be unique across all members?
- Should uniqueness be case-insensitive?
- How should existing members without email be handled?

Why it matters:

- Login requires a stable unique identifier
- Existing data may not satisfy new constraints

### 6.5 Password lifecycle requirements

Still unclear:

- Who sets the initial password?
- Can admins set/reset member passwords?
- Can members change their own password later?
- Is a password reset email required in the future?
- Should the system support temporary passwords?

Why it matters:

- Storing a hash alone is not enough to complete the credential lifecycle safely

### 6.6 Whether every member should be login-capable

Still unclear:

- Should every member record have email + password?
- Or only members who will submit reimbursement claims?

Why it matters:

- This impacts validation, migration complexity, and admin workflow

### 6.7 Whether member status fields are needed now

Still unclear:

- Do we need `isActive`?
- Do we need `portalEnabled`?
- Do we need soft deletion instead of hard deletion?

Why it matters:

- Deactivation is often safer than delete once claims and receipts exist

### 6.8 Deletion behavior for super admin

Still unclear:

- Should super admin be allowed to hard-delete a member who already has income, receipts, or future claims?
- Or should super admin only deactivate/archive such a member?

Why it matters:

- Referential integrity and historical financial records should not be broken

### 6.9 Relationship between member admin and claim history

Still unclear:

- Will future claim history be visible only to members themselves?
- Or also to admins inside the member admin module?
- Should there be both:
  - member self-service claim history
  - admin-facing claim history per member

Why it matters:

- Navigation, route design, and data exposure differ between those two use cases

### 6.10 Which fields belong to this module vs the income tax subdomain

Still unclear:

- Is this new member module the single source of truth for all member fields?
- Or should donation/tax-specific fields remain conceptually under the income domain while authentication fields move elsewhere?

Why it matters:

- This affects future module boundaries and code ownership

### 6.11 Audit logging expectations

Still unclear:

- Should member create/edit/delete/password reset events be audited?
- Is audit logging required before claim workflows are built?

Why it matters:

- Credential and identity changes are security-sensitive

### 6.12 Future claim history content definition

Still unclear:

- What exact claim history fields must appear later?
- Status only, or full reimbursement detail?
- Should members see approval trail, cheque info, and payment confirmation?

Why it matters:

- Future data model design should avoid rework

## 7. Recommended Clarified Requirement Statement

Below is the requirement statement I would recommend using as the implementation baseline after confirmation:

### 7.1 Phase 1 requirement statement

Build a dedicated member admin module, separate from the current income member tax admin concept, to serve as the central administrative area for managing church member profiles and preparing for the future reimbursement claim portal.

The module shall:

- provide a dedicated route and navigation entry outside the current income member tax screen
- allow authorized admin roles to list, create, and edit members
- allow only super admin to delete members
- store member email and securely hashed password for future claimant authentication
- preserve compatibility with current member, income, and receipt records
- be accessible by:
  - super
  - treasurer
  - treasurer director
  - department director
  - pastor

### 7.2 Phase 2 requirement statement

In a later phase, members who submit reimbursement claims shall sign in through a separate member-facing login location and shall be able to view their own reimbursement claim history on a dedicated page.

## 8. Engineering Impact Summary

Implementing this properly will require changes in at least these areas:

- Prisma schema and migration
- Seed data for new roles
- RBAC constants and access helpers
- Middleware / route protection
- Member server actions
- Member list/create/edit UI
- Navigation and landing page module links
- Authentication flow for future member login
- Automated tests for permissions and guards

## 9. Recommended Next Decisions Before Development

I recommend confirming the following decisions before implementation begins:

1. Confirm the canonical route for the dedicated member module.
2. Confirm exact role codes and display names for:
   - treasurer director
   - department director
   - pastor vs senior pastor
3. Confirm whether all members need login credentials or only reimbursement claimants.
4. Confirm whether member email must be unique and required.
5. Confirm whether super admin deletion is hard delete, soft delete, or deactivate-only once financial history exists.
6. Confirm whether department directors have global access or department-scoped access.
7. Confirm whether the current `/income/member` route should be retired or temporarily redirected.

## 10. Final Recommendation

The request is valid and technically aligned with the planned reimbursement claim direction, but it should be treated as a **new member identity and administration foundation**, not a simple extension of the current income member page.

The most important clarification items are:

- exact role definitions
- member email/password rules
- deletion strategy
- whether every member is login-capable
- final route/module placement

Once those are confirmed, implementation can proceed with much lower risk of rework.
