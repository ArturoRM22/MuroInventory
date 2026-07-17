const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const movementsController = require('../controllers/movements.controller');

router.get('/', requireAuth, movementsController.listMovements);
router.post('/', requireAuth, movementsController.createMovement);
router.delete('/:id', requireAuth, requireRole('manager'), movementsController.deleteMovement);

module.exports = router;
