-- 001_salidas: add 'salida' movement type + transfer tracking
-- Run manually with psql, e.g.:
--   psql -U your_postgres_user -d MuroInventory -f migrations/001_salidas.sql

ALTER TABLE movements DROP CONSTRAINT movements_type_check;
ALTER TABLE movements ADD CONSTRAINT movements_type_check
  CHECK (type IN ('llegada', 'uso', 'salida'));

ALTER TABLE movements
  ADD COLUMN destination_tortilleria_id INT REFERENCES tortillerias(id),
  ADD COLUMN transfer_group UUID;

CREATE INDEX idx_movements_destination ON movements(destination_tortilleria_id);
