const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const summaryController = require('../controllers/summary.controller');

router.get('/summary', requireAuth, summaryController.getSummary);
router.get('/today', requireAuth, summaryController.getToday);

module.exports = router;
