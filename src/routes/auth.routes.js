const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');

router.post('/register', requireAuth, requireRole('manager'), authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;
