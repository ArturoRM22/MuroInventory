const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const tortilleriasController = require('../controllers/tortillerias.controller');

router.get('/', requireAuth, tortilleriasController.listTortillerias);
router.get('/:id', requireAuth, tortilleriasController.getTortilleriaById);
router.post('/', requireAuth, requireRole('super'), tortilleriasController.createTortilleria);
router.patch('/:id', requireAuth, requireRole('super'), tortilleriasController.updateTortilleria);
router.delete('/:id', requireAuth, requireRole('super'), tortilleriasController.deleteTortilleria);
router.get('/:id/users', requireAuth, requireRole('super'), tortilleriasController.listTortilleriaUsers);
router.post('/:id/users', requireAuth, requireRole('super'), tortilleriasController.addTortilleriaUser);
router.delete('/:id/users/:userId', requireAuth, requireRole('super'), tortilleriasController.removeTortilleriaUser);

module.exports = router;
2