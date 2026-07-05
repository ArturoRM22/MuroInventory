const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const tortilleriasController = require('../controllers/tortillerias.controller');

router.get('/', requireAuth, tortilleriasController.listTortillerias);
router.get('/:id', requireAuth, tortilleriasController.getTortilleriaById);
router.post('/', requireAuth, requireRole('manager'), tortilleriasController.createTortilleria);
router.patch('/:id', requireAuth, requireRole('manager'), tortilleriasController.updateTortilleria);
router.delete('/:id', requireAuth, requireRole('manager'), tortilleriasController.deleteTortilleria);

module.exports = router;
