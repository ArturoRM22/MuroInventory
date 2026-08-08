# Movements & Summary API

Base path: `/api/movements`

All endpoints require JWT auth via `muro_token` httpOnly cookie (set by `POST /api/auth/login`).

---

## `GET /api/movements` — List movements

List individual inventory movement records, filterable.

### Query parameters (all optional)

| Param | Type | Description |
|---|---|---|
| `day` | `YYYY-MM-DD` | Exact match on `day` (e.g. a single day's registrations) |
| `from` | `YYYY-MM-DD` | Lower bound on `day` |
| `to` | `YYYY-MM-DD` | Upper bound on `day` |
| `tortilleria_id` | positive int | Filter by tortilleria |

### Response `200`

```json
{
  "data": [
    {
      "id": 1,
      "day": "2025-06-15",
      "type": "llegada",
      "sacks": 100,
      "tortilleria_id": 1,
      "employee_name": "Juan",
      "created_by": 1,
      "created_at": "2025-06-15T10:00:00.000Z"
    }
  ]
}
```

Sorted by `day DESC, created_at DESC`.

---

## `POST /api/movements` — Create movement

Record a sack arrival (`llegada`) or usage (`uso`).

### Request body

| Field | Type | Constraints |
|---|---|---|
| `day` | `YYYY-MM-DD` | required |
| `type` | string | required, one of: `"llegada"`, `"uso"`, `"salida"` |
| `sacks` | integer | required, >= 0 |
| `tortilleria_id` | integer | required, must reference a tortilleria the user has access to |
| `employee_name` | string | required, non-empty (whitespace-trimmed on insert) |
| `destination_tortilleria_id` | integer | required for `type = "salida"` only; a secondary tortilleria linked to `tortilleria_id` |

### Business rules

- **Main vs secondary tortilleria**:
  - `llegada` — only on the **main** tortilleria (new stock arrives).
  - `salida` — only on the **main** tortilleria; sacks are sent to a secondary (`destination_tortilleria_id` must reference a secondary whose `main_tortilleria_id` equals `tortilleria_id`).
  - `uso` — allowed on both main and secondary.
- **Salidas are two-sided**: recording a `salida` atomically creates the `salida` row on the main **and** a matching `llegada` row on the destination secondary (same day, employee, creator; both share a `transfer_group` UUID).
- **Stock check on `uso` and `salida`**: validates that the tortilleria's current stock (`initial_stock + all prior llegada - all prior uso - all prior salida` up to and including `day`) is >= `sacks`. Returns `400` with `"insufficient stock: available X, requested Y"` if not.
- **Deleting a transfer**: `DELETE /api/movements/:id` removes the linked pair (both rows sharing the `transfer_group`).

### Response `201`

```json
{
  "data": {
    "id": 2,
    "day": "2025-06-15",
    "type": "llegada",
    "sacks": 50,
    "tortilleria_id": 1,
    "destination_tortilleria_id": null,
    "employee_name": "Juan",
    "created_by": 1,
    "created_at": "2025-06-15T12:00:00.000Z"
  }
}
```

A `salida` response additionally includes `destination_tortilleria_id`.

### Error `400`

```json
{
  "error": "Validation failed",
  "details": {
    "day": "must be a valid date string (YYYY-MM-DD)",
    "type": "must be one of: llegada, uso"
  }
}
```

---

## `DELETE /api/movements/:id` — Delete movement

**Auth required**: authenticated user with access to the movement's tortilleria (403 otherwise).

Removes a movement record. Stock is recalculated on the fly, so deleting a movement effectively reverses it.

| Response | Body |
|---|---|
| `204` | (empty) |
| `404` | `{ "error": "Movement not found" }` |
| `403` | `{ "error": "You do not have access to this tortilleria" }` |

---

## `GET /api/movements/summary` — Summary report

Daily summary with running stock balance for a given tortilleria.

### Query parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `tortilleria_id` | positive int | **required** | Target tortilleria |
| `from` | `YYYY-MM-DD` | `1900-01-01` | Start date |
| `to` | `YYYY-MM-DD` | `9999-12-31` | End date |

### Response `200`

```json
{
  "data": [
    {
      "day": "2025-06-15",
      "inicio": 50,
      "llegadas": 100,
      "usos": 30,
      "salidas": 10,
      "quedo": 110
    }
  ]
}
```

Each row represents one day:

| Field | Meaning |
|---|---|
| `day` | The date |
| `inicio` | Stock at the start of the day = `initial_stock` + net movements before this day |
| `llegadas` | Total sacks arrived that day |
| `usos` | Total sacks used that day |
| `salidas` | Total sacks sent to a secondary tortilleria that day (only non-zero on a main) |
| `quedo` | Stock remaining at end of day = `inicio + llegadas - usos - salidas` |

Sorted by `day DESC`.

### How stock is calculated

```
quedo = initial_stock
        + SUM(all llegada sacks before and on this day)
        - SUM(all uso sacks before and on this day)
        - SUM(all salida sacks before and on this day)
```

Done via PostgreSQL window functions — no cached balance fields.

---

## `GET /api/movements/today` — Today's summary

Single-row summary for the current date.

### Query parameters

| Param | Type | Description |
|---|---|---|
| `tortilleria_id` | positive int | **required** |

### Response `200` (data exists)

```json
{
  "data": {
    "day": "2025-06-15",
    "inicio": 50,
    "llegadas": 100,
    "usos": 30,
    "quedo": 120
  }
}
```

### Response `200` (no data today)

```json
{
  "data": null
}
```

---

## Data model (PostgreSQL)

### `movements`

| Column | Type | Notes |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | |
| `day` | `date NOT NULL` | |
| `type` | `text NOT NULL` | `CHECK (type IN ('llegada', 'uso', 'salida'))` |
| `sacks` | `int NOT NULL` | `CHECK (sacks >= 0)` |
| `tortilleria_id` | `int NOT NULL` | `REFERENCES tortillerias(id)` |
| `destination_tortilleria_id` | `int` | `REFERENCES tortillerias(id)`; set on `salida` rows |
| `transfer_group` | `uuid` | links a `salida` to its auto-created `llegada` on the destination |
| `employee_name` | `text NOT NULL` | |
| `created_by` | `int NOT NULL` | `REFERENCES users(id)` |
| `created_at` | `timestamptz NOT NULL` | `DEFAULT now()` |

Index: `idx_movements_tort_day ON movements(tortilleria_id, day)`, `idx_movements_destination ON movements(destination_tortilleria_id)`

### `tortillerias` (relevant fields)

| Column | Type | Notes |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | |
| `name` | `text NOT NULL` | |
| `is_main` | `boolean NOT NULL DEFAULT false` | Only one should be main |
| `main_tortilleria_id` | `int` | `REFERENCES tortillerias(id)` for non-main |
| `initial_stock` | `int NOT NULL DEFAULT 0` | Base stock before any movements |

### `users` (relevant fields)

| Column | Type |
|---|---|
| `id` | `SERIAL PRIMARY KEY` |
| `name` | `text NOT NULL UNIQUE` |
| `role` | `text NOT NULL CHECK (role IN ('admin', 'user'))` |

---

## Auth summary

| Endpoint | Auth | Role |
|---|---|---|
| `GET /api/movements` | required | any |
| `POST /api/movements` | required | any |
| `DELETE /api/movements/:id` | required | any |
| `GET /api/movements/summary` | required | any |
| `GET /api/movements/today` | required | any |

---

## Edge cases & notes

- **No data in range**: `summary` returns an empty `data: []`, `today` returns `data: null`.
- **Dates**: always `YYYY-MM-DD` format. The server validates parseability via `new Date(value)`.
- **Integer params** (`tortilleria_id`, `sacks`, `destination_tortilleria_id`): validated as positive/non-negative integers. String coercion is **not** done — `"5"` as `sacks` would fail `typeof value !== 'number'`.
- **Stock is fully derived**: there is no computed/cached stock column. Every `uso`/`salida` checks real-time sufficiency by summing all movements up to that day.
- **Non-main tortillerias**: cannot have `llegada` or `salida` recorded against them (validated on create); their `llegadas` come automatically from their main's `salidas`. `uso` is allowed. The summary endpoints can query any tortilleria though.
- **Employee name** is trimmed on insert (`employee_name.trim()`) but not validated to be alphanumeric — any non-empty string is accepted.
