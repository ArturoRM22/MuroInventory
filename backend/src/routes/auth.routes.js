const express = require('express');
const router = express.Router();
const { requireAuth, requireAnyRole } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');

router.post('/register', requireAuth, requireAnyRole('admin', 'super'), authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
