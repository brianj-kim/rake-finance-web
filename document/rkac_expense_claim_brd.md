
# RKAC Finance – Expense Claim Module
*(지출결의서 시스템)*

## 1. Project Overview

The **RKAC Finance Expense Claim Module** is a web-based system designed to manage reimbursement claims for church-related expenditures.

This system replaces the current manual paper-based process and provides:

- Online reimbursement claim submission
- Receipt upload and storage
- Approval workflow by church leadership
- Cheque issuance tracking
- Payment confirmation by claimant and treasurer
- Role-based access control
- Claim history tracking

The system will integrate with the existing **RKAC Finance codebase**, including RBAC, income, donation receipt, and member domains.

---

# 2. Business Requirements Document (BRD)

## 2.1 Current Problems

The church currently processes reimbursement claims manually. This creates several operational issues:

- Members must print claim forms.
- Claims are often submitted only during Sunday gatherings.
- Tracking claim status is difficult.
- Physical receipts must be stored manually.
- Cheque tracking is inconsistent.
- Payment reconciliation requires manual checking.
- Financial history is difficult to search.

---

## 2.2 Project Objectives

The system must:

- Allow church members to submit reimbursement claims online
- Allow receipt uploads (PDF/images)
- Support claims with multiple expenditure categories
- Provide an approval workflow for leadership
- Prevent conflict-of-interest approvals
- Allow treasurers to record cheque issuance
- Allow claimants to confirm cheque receipt
- Track payment confirmation for future accounting integration
- Maintain records for **5 years** in compliance with CRA requirements

---

## 2.3 Scope

### In Scope

The module will include:

- Reimbursement claim submission
- Receipt upload
- Claim review and approval
- Claim modification by authorized approvers
- Cheque issuance tracking
- Claimant confirmation of cheque receipt
- Optional treasurer confirmation of bank payment
- Role-based approval workflow
- Claim status tracking
- Audit logging
- Integration with existing RKAC Finance authentication and RBAC

### Out of Scope

The following features are not included in this module:

- Accounting ledger
- Expenditure financial reporting
- Budget management
- Automated bank reconciliation
- Financial statements

However, **payment confirmation flags** will be included for future integration with an expenditure module.

---

# 3. User Roles

## Super Admin
Responsibilities:

- Manage system configuration
- Appoint department directors
- Manage roles and permissions
- Manage expenditure categories
- Administrative oversight

---

## Treasurer Director
Responsibilities:

- Approve reimbursement claims
- Oversee financial approval processes

Restrictions:

- Cannot approve their own claims

---

## Treasurer

Responsibilities:

- Approve reimbursement claims
- Issue cheques
- Record cheque details
- Mark payment completion based on bank statements

Restrictions:

- Cannot approve their own claims

---

## Senior Pastor

Responsibilities:

- Approve reimbursement claims

Restrictions:

- Cannot approve their own claims

---

## Department Directors

Responsibilities:

- Approve claims for church expenditures
- May approve claims across departments

Restrictions:

- Cannot approve their own claims

Directors are appointed annually by congregation decision.

---

## Church Members

Responsibilities:

- Submit reimbursement claims
- Upload receipts
- Confirm receipt of cheque payments

Members do not require a fully managed system account.
They may authenticate using **email and simple password verification**.

---

# 4. Functional Requirements (FRS)

## 4.1 Claim Creation

Members must be able to:

- Create a claim
- Enter claim details
- Upload receipts
- Submit claim for approval

Required information:

- Claimant name
- Email address
- Claim date
- Description
- Line items
- Category
- Department
- Amount
- Receipt attachment

---

## 4.2 Multi-Category Claims

A claim may contain multiple line items.

Each line item contains:

- Department
- Expenditure category
- Description
- Amount

Structure:

Claim
 └─ Claim Items
       ├─ Department
       ├─ Category
       └─ Amount

---

## 4.3 Claim Review

Authorized approvers may:

- View submitted claims
- Edit claim information
- Modify categories
- Adjust amounts
- Approve claims
- Reject claims

---

## 4.4 Conflict of Interest Prevention

The system must enforce:

- Approvers cannot approve their own claims

Cross-department approval is allowed.

Example:
A Youth Director may approve a Worship Department claim.

---

## 4.5 Cheque Issuance

Only **Treasurers** may record cheque information.

Cheque data includes:

- Cheque number
- Issue date
- Amount
- Notes

---

## 4.6 Claim Completion

A claim process is completed when:

1. Treasurer records cheque issuance
2. Claimant confirms receipt of cheque

Optional:

- Treasurer confirms payment completion on bank statement

---

## 4.7 Receipt Upload

Members may upload:

- PDF files
- Image files

Requirements:

- Mobile friendly upload
- Minimal PDF size encouraged

Devices supported:

- Desktop
- Tablet
- Smartphone

---

# 5. Claim Workflow

Claim lifecycle:

1. Draft
2. Submitted
3. Under Review
4. Approved
5. Cheque Issued
6. Claimant Confirmed
7. Payment Confirmed (optional)

---

# 6. Role Permission Matrix

| Action | Member | Director | Pastor | Treasurer | Treasurer Director | Super Admin |
|------|------|------|------|------|------|------|
Create Claim | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
Edit Own Draft | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
Approve Claim | ✖ | ✔ | ✔ | ✔ | ✔ | ✔ |
Approve Own Claim | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
Modify Claim | ✖ | ✔ | ✔ | ✔ | ✔ | ✔ |
Issue Cheque | ✖ | ✖ | ✖ | ✔ | ✔ | ✔ |
Confirm Cheque Received | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
Mark Bank Payment | ✖ | ✖ | ✖ | ✔ | ✔ | ✔ |
Manage Roles | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ |

---

# 7. Data Retention Policy

To comply with CRA requirements:

- Financial records are retained for **5 years**
- Records older than 5 years will be archived or hidden from active queries

---

# 8. Domain Model

Core entities:

- User
- Role
- Department
- ExpenseCategory
- ExpenseClaim
- ExpenseClaimItem
- ExpenseClaimAttachment
- ExpenseClaimApproval
- ChequePayment
- PaymentConfirmation

Relationships:

User → ExpenseClaim (1:N)

ExpenseClaim → ExpenseClaimItem (1:N)

ExpenseClaim → Attachment (1:N)

ExpenseClaim → ApprovalHistory (1:N)

ExpenseClaim → ChequePayment (1:1)

---

# 9. Reporting Requirements

The module must support:

- Claim status tracking
- Claim history by member
- Cheque issuance tracking
- Payment confirmation tracking

Future integration:

- Expenditure accounting module
- Financial reporting dashboards

---

# 10. Technical Design (High Level)

The system must align with the existing **RKAC Finance platform**, including:

- Role-Based Access Control (RBAC)
- Member domain
- Income module
- Donation receipt module

Technology stack:

- Next.js
- PostgreSQL
- Prisma ORM
- RBAC middleware
- Server actions or API routes

Example route structure:

/expense-claims
    /create
    /list
    /review
    /payment

/admin
    /categories
    /departments
    /directors

---

# 11. Security Requirements

- Role-based access control
- Server-side permission validation
- Prevention of self-approval
- Audit logging of financial changes
- Secure receipt file upload

---

# 12. Audit Logging

The system must log:

- Claim creation
- Claim edits
- Approval decisions
- Cheque issuance
- Payment confirmations

Each log record contains:

- User
- Action
- Timestamp
- Previous values
- Updated values

---

# 13. Data Retention Enforcement

System rule:

if record_age > 5 years:
    archive or hide

Archived records must not appear in standard system searches.
