# Movements & Summary API

Base path: `/api/movements`

All endpoints require JWT auth via `muro_token` httpOnly cookie (set by `POST /api/auth/login`).

---

## `GET /api/movements` — List movements

List individual inventory movement records, filterable.

### Query parameters (all optional)

| Param | Type | Description |
|---|---|---|
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
| `type` | string | required, one of: `"llegada"`, `"uso"` |
| `sacks` | integer | required, >= 0 |
| `tortilleria_id` | integer | required, must reference a tortilleria with `is_main = true` |
| `employee_name` | string | required, non-empty (whitespace-trimmed on insert) |

### Business rules

- **Stock check on `uso`**: validates that the main tortilleria's current stock (`initial_stock + all prior llegada - all prior uso` up to and including `day`) is >= `sacks`. Returns `400` with `"insufficient stock: available X, requested Y"` if not.
- **Main tortilleria only**: movements always reference the main tortilleria.

### Response `201`

```json
{
  "data": {
    "id": 2,
    "day": "2025-06-15",
    "type": "llegada",
    "sacks": 50,
    "tortilleria_id": 1,
    "employee_name": "Juan",
    "created_by": 1,
    "created_at": "2025-06-15T12:00:00.000Z"
  }
}
```

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

**Role required**: `manager`

Removes a movement record. Stock is recalculated on the fly, so deleting a movement effectively reverses it.

| Response | Body |
|---|---|
| `204` | (empty) |
| `404` | `{ "error": "Movement not found" }` |

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
      "quedo": 120
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
| `quedo` | Stock remaining at end of day = `inicio + llegadas - usos` |

Sorted by `day DESC`.

### How stock is calculated

```
quedo = initial_stock
        + SUM(all llegada sacks before and on this day)
        - SUM(all uso sacks before and on this day)
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
| `type` | `text NOT NULL` | `CHECK (type IN ('llegada', 'uso'))` |
| `sacks` | `int NOT NULL` | `CHECK (sacks >= 0)` |
| `tortilleria_id` | `int NOT NULL` | `REFERENCES tortillerias(id)` |
| `employee_name` | `text NOT NULL` | |
| `created_by` | `int NOT NULL` | `REFERENCES users(id)` |
| `created_at` | `timestamptz NOT NULL` | `DEFAULT now()` |

Index: `idx_movements_tort_day ON movements(tortilleria_id, day)`

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
| `role` | `text NOT NULL CHECK (role IN ('manager', 'user'))` |

---

## Auth summary

| Endpoint | Auth | Role |
|---|---|---|
| `GET /api/movements` | required | any |
| `POST /api/movements` | required | any |
| `DELETE /api/movements/:id` | required | `manager` |
| `GET /api/movements/summary` | required | any |
| `GET /api/movements/today` | required | any |

---

## Edge cases & notes

- **No data in range**: `summary` returns an empty `data: []`, `today` returns `data: null`.
- **Dates**: always `YYYY-MM-DD` format. The server validates parseability via `new Date(value)`.
- **Integer params** (`tortilleria_id`, `sacks`): validated as positive/non-negative integers. String coercion is **not** done — `"5"` as `sacks` would fail `typeof value !== 'number'`.
- **Stock is fully derived**: there is no computed/cached stock column. Every `uso` checks real-time sufficiency by summing all movements up to that day.
- **Non-main tortillerias**: cannot have movements recorded against them (validated on create). The summary endpoints can query any tortilleria though.
- **Employee name** is trimmed on insert (`employee_name.trim()`) but not validated to be alphanumeric — any non-empty string is accepted.
