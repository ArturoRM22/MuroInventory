# MuroInventory API

Backend API for tracking daily corn sack inventory at a tortillería.

## Stack

- **Runtime:** Node.js >= 18
- **Framework:** Express.js (plain JavaScript)
- **Database:** PostgreSQL, raw SQL via `pg`
- **Auth:** JWT + bcrypt
- **Validation:** manual (no Zod for now)

## Project layout

```
src/
  config.js                 # env vars
  db/
    pool.js                 # pg.Pool singleton
    query.js                # thin query helper
  middleware/
    auth.js                 # requireAuth, requireRole
    error.js                # central error handler
  controllers/              # route handlers (business logic)
    auth.controller.js
    tortillerias.controller.js
    movements.controller.js
    summary.controller.js
  routes/                   # Express routers wiring controllers
    auth.routes.js
    tortillerias.routes.js
    movements.routes.js
    summary.routes.js
  server.js                 # app bootstrap
init.sql                    # schema + seed, run manually with psql
scripts/
  smoke-test.sh             # curl smoke tests
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create the PostgreSQL database**
   ```bash
   createdb MuroInvetory
   ```

3. **Run the schema + seed**
   ```bash
   psql -d MuroInvetory -f init.sql
   ```
   This creates the tables and a seed user:
   - username: `admin`
   - password: `admin123`

   The `super` role (sole manager of tortillerías) is not seeded and cannot be assigned via the register endpoint. Create the single super user manually:
   ```bash
   # generate a bcrypt hash (rounds = 10)
   node -e "console.log(require('bcryptjs').hashSync('TU_PASSWORD', 10))"
   ```
   ```sql
   -- apply migration 002_super_role.sql first, then:
   INSERT INTO users (name, password, role)
   VALUES ('super', '<hash-de-arriba>', 'super');
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # edit .env with your DATABASE_URL and a strong JWT_SECRET
   ```

5. **Start the server**
   ```bash
   npm run dev     # auto-reload on file changes
   # or
   npm start
   ```

## Phase 1 endpoints

| Method | Path | Auth | Role |
|---|---|---|---|
| POST | `/api/auth/login` | no | - |
| GET | `/api/tortillerias` | yes | any |
| GET | `/api/tortillerias/:id` | yes | any |
| POST | `/api/tortillerias` | yes | super |
| PATCH | `/api/tortillerias/:id` | yes | super |
| DELETE | `/api/tortillerias/:id` | yes | super |
| GET | `/api/tortillerias/:id/users` | yes | super |
| POST | `/api/tortillerias/:id/users` | yes | super |
| DELETE | `/api/tortillerias/:id/users/:userId` | yes | super |
| GET | `/api/users` | yes | super |
| GET | `/api/movements` | yes | any |
| POST | `/api/movements` | yes | any |
| DELETE | `/api/movements/:id` | yes | any |
| GET | `/api/movements/summary` | yes | any |
| GET | `/api/movements/today` | yes | any |

## Smoke tests

```bash
./scripts/smoke-test.sh
```

Or run the curls manually after starting the server.
