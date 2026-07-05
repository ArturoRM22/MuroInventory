-- MuroInventory initial schema + seed
-- Run manually with psql, e.g.:
--   psql -U your_postgres_user -d MuroInventory -f init.sql

DROP TABLE IF EXISTS movements CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tortillerias CASCADE;

CREATE TABLE tortillerias (
  id SERIAL PRIMARY KEY,
  name text NOT NULL,
  is_main boolean NOT NULL DEFAULT false,
  main_tortilleria_id INT REFERENCES tortillerias(id) ON DELETE SET NULL,
  initial_stock INT NOT NULL DEFAULT 0,
  CONSTRAINT no_self_main CHECK (is_main OR main_tortilleria_id IS NOT NULL)
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('manager', 'user')),
  tortilleria_id INT NOT NULL REFERENCES tortillerias(id)
);

CREATE TABLE movements (
  id SERIAL PRIMARY KEY,
  day date NOT NULL,
  type text NOT NULL CHECK (type IN ('llegada', 'uso')),
  sacks int NOT NULL CHECK (sacks >= 0),
  tortilleria_id INT NOT NULL REFERENCES tortillerias(id),
  created_by INT NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_movements_tort_day ON movements(tortilleria_id, day);

-- Seed: one main tortillería (id=1) + manager user (id=1)
-- Password for manager is 'admin123'.
INSERT INTO tortillerias (name, is_main, main_tortilleria_id, initial_stock)
VALUES ('Torre', true, NULL, 50);

INSERT INTO users (name, password, role, tortilleria_id)
VALUES (
  'admin',
  '$2b$12$tSr41nO0cK7Gt.quS/XpFui/ZdUrvR3WqO2bsgvvML6VPm24gR9CS',
  'manager',
  1
);
