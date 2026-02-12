# RKAC Finance

RKAC Finance is a web app built for **Regina Korean Alliance Church** to help the treasurer record church income (offering, gifts, etc.) and generate **donation receipts for Canadian income tax purposes (CRA)**.

This repository contains an MVP version and will be improved over time.

---

## Features (features will be added/updated/fixed iteratively in the future)

- **Income recording**
  - Create and manage income entries (offering, gift, etc.)
  - Filter/search by year and other criteria

- **Member management**
  - Member admin page
  - Search members and manage member profiles

- **Donation receipts**
  - Generate donation receipts (PDF) for a selected year and selected donations
  - Manage receipts list (open PDF, delete receipt record + file)
  - Bulk generation (generate receipts for all eligible members for a tax year)

---

## Tech Stack

- **Next.js (App Router)** + **React**
- **TypeScript**
- **Prisma** ORM
- **PostgreSQL**
- **shadcn/ui** + Tailwind CSS
- **@react-pdf/renderer** for PDF receipts

---

## Getting Started (Local Development)

### 1) Install dependencies

```bash
pnpm install
````

### 2) Start PostgreSQL with Docker (PostgreSQL 16+)

If you have Docker installed:

```bash
docker run --name rkac-postgres \
  -e POSTGRES_USER=rkac \
  -e POSTGRES_PASSWORD=rkac_password \
  -e POSTGRES_DB=rkac_finance \
  -p 5432:5432 \
  -d postgres:16
```

> You can change the username/password/db name as you like. Just keep your `.env` in sync.

### 3) Configure environment variables

Create a `.env` file at the project root:

```env
DATABASE_URL="postgresql://rkac:rkac_password@localhost:5432/rkac_finance?schema=public"
```

### 4) Run Prisma migration + generate client

If this repo contains migrations:

```bash
pnpm prisma migrate dev
```

If you are using an existing database schema and do not have migrations:

```bash
pnpm prisma db pull
pnpm prisma generate
```

### 5) Run the dev server

```bash
pnpm dev
```

Open:

* [http://localhost:3000/income](http://localhost:3000/income)

---

## Scripts

Common commands:

```bash
pnpm dev             # start dev server
pnpm build           # build for production
pnpm start           # run production build
pnpm lint            # run lint
pnpm prisma studio   # open Prisma Studio (DB viewer)
```

---

## Receipt PDFs (Local)

When generating receipts, PDF files are saved under:

```
/public/receipts/<taxYear>/
```

and the database stores a URL like:

```
/receipts/<taxYear>/receipt-<taxYear>-00001.pdf
```

> Note: If you deploy to a serverless environment with a read-only filesystem, you’ll need to store PDFs in object storage (S3/R2/etc.) instead of writing to `/public`.

---

## Database Notes

This project uses PostgreSQL 16+.

Schema and models live in:

* `prisma/schema.prisma`

Prisma client is generated automatically via:

* `postinstall`: `prisma generate`

---

## Security / Privacy

* This project stores member and donation information.
* Do **not** commit real member data or secrets.
* Keep `.env` private (already included in `.gitignore`).

---

## Contributing

This is currently a church internal project MVP. Suggestions and improvements are welcome:

1. Fork the repo
2. Create a feature branch
3. Submit a pull request

---

## License

Choose a license before publishing publicly (recommended: MIT).
If you haven’t decided yet, you can add one later.

---

## Disclaimer

This app helps generate donation receipts based on stored records.
Please verify receipt formatting and requirements against CRA guidance and your church’s policies.

```
```
