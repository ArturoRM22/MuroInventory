-- MuroInventory initial schema + seed
-- Run manually with psql, e.g.:
--   psql -U your_postgres_user -d MuroInventory -f init.sql

DROP TABLE IF EXISTS movements CASCADE;
DROP TABLE IF EXISTS user_tortillerias CASCADE;
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
  role text NOT NULL CHECK (role IN ('admin', 'user', 'super'))
);

CREATE TABLE user_tortillerias (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tortilleria_id INT NOT NULL REFERENCES tortillerias(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, tortilleria_id)
);

CREATE INDEX idx_user_tortillerias_tortilleria ON user_tortillerias(tortilleria_id);

CREATE TABLE movements (
  id SERIAL PRIMARY KEY,
  day date NOT NULL,
  type text NOT NULL CHECK (type IN ('llegada', 'uso', 'salida')),
  sacks int NOT NULL CHECK (sacks >= 0),
  tortilleria_id INT NOT NULL REFERENCES tortillerias(id),
  destination_tortilleria_id INT REFERENCES tortillerias(id),
  transfer_group UUID,
  employee_name text NOT NULL,
  created_by INT NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_movements_tort_day ON movements(tortilleria_id, day);
CREATE INDEX idx_movements_destination ON movements(destination_tortilleria_id);

-- Seed: one main tortillería (id=1) + admin user (id=1)
-- Password for admin is 'admin123'.
INSERT INTO tortillerias (name, is_main, main_tortilleria_id, initial_stock)
VALUES ('Torre', true, NULL, 50);

INSERT INTO users (name, password, role)
VALUES (
  'admin',
  '$2b$12$tSr41nO0cK7Gt.quS/XpFui/ZdUrvR3WqO2bsgvvML6VPm24gR9CS',
  'admin'
);

-- Seed: link the admin user to every tortilleria
INSERT INTO user_tortillerias (user_id, tortilleria_id)
SELECT 1, id FROM tortillerias;
