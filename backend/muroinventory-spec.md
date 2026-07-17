# MuroInventory — Project Spec

## Summary

MuroInventory is a web app for a tortillería (corn tortilla shop) to track daily corn sack inventory. It replaces a manual Excel/Sheets process. The business has one **main** tortillería and one or more **secondary** tortillerías; inventory is tracked only at the main location — sacks consumed at secondary locations are recorded as being drawn from the main location's stock.

## Data model

Use a normalized **movements** table instead of per-tortillería columns, so `inicio` (starting stock) and `quedó` (remaining stock) are calculated, not manually entered — this removes a whole class of manual-entry errors and scales cleanly if more secondary tortillerías are added later.

**Entities:**

- **tortillerias**
  - `id` (uuid, PK)
  - `name` (string)
  - `is_main` (boolean)
  - `main_tortilleria_id` (uuid, FK, nullable — links a secondary location to its main)

- **users**
  - `id` (uuid, PK)
  - `name` (string)
  - `role` (enum: `manager` | `user`)
  - `tortilleria_id` (uuid, FK)

- **movements**
  - `id` (uuid, PK)
  - `day` (date)
  - `type` (enum: `inicio` | `llegada` | `uso`)
  - `sacks` (int)
  - `tortilleria_id` (uuid, FK — always the main tortillería, even for secondary usage)
  - `created_by` (uuid, FK → users)

Daily stock is derived, not stored:
`quedó = inicio + SUM(llegada) − SUM(uso)`, grouped by day.

## Core features (v1)

1. **Corn sack registration** — daily entry of arrivals (`llegaron`) and usage (`se usaron`) per tortillería, with usage from secondary locations recorded against the main tortillería's stock.
2. **CRUD for tortillerías** — manager-only.
3. **Role-based access**
   - `manager`: full access, including tortillería CRUD and user management.
   - `user`: can only register daily sack usage and view/filter data.
4. **Filtering** — by day, month, or custom date range.

## Suggested v1.5+ features

- Consumption trend charts (daily/weekly average usage per tortillería)
- Days-of-stock-remaining estimate based on recent usage average
- Discrepancy flags when `inicio + llegaron − usado ≠ quedó`
- Main vs. secondary consumption breakdown
- Export to Excel/PDF
- Audit log of who entered what, when
- Optional cost tracking (peso value per sack)

## Tech stack

- **Database:** PostgreSQL
- **Backend:** Express.js (or consider Next.js/Remix for a combined frontend+backend if reducing glue code is a priority)
- **Frontend:** Vite + React
- **ORM:** Prisma or Drizzle (migrations, type-safe queries)
- **Auth:** JWT with role claims, enforced via middleware

## Design principle

Favor a transactional/event-based data model (movements table) over a wide/columnar one (spreadsheet-style). This keeps daily totals as derived values, supports historical reporting and filtering without schema changes, and scales to additional tortillerías without adding columns.
