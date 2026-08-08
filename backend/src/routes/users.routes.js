const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const usersController = require('../controllers/users.controller');

router.get('/', requireAuth, requireRole('super'), usersController.listUsers);

module.exports = router;
