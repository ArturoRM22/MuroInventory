-- 002_super_role: add 'super' role for tortilleria management
-- Run manually with psql, e.g.:
--   psql -U your_postgres_user -d MuroInventory -f migrations/002_super_role.sql

ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'user', 'super'));

-- Create the single super user manually (it is not assignable via the register endpoint):
-- 1. Generate a bcrypt hash for your password (backend default rounds = 10):
--      node -e "console.log(require('bcryptjs').hashSync('TU_PASSWORD', 10))"
-- 2. Insert the user, e.g.:
--      INSERT INTO users (name, password, role)
--      VALUES ('super', '<hash-de-arriba>', 'super');
--    Optionally link it to existing tortillerias:
--      INSERT INTO user_tortillerias (user_id, tortilleria_id)
--      SELECT id, t.id FROM users CROSS JOIN tortillerias t WHERE name = 'super';
