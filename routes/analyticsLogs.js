import express from 'express';
import { createCrudController } from '../utils/crudController.js';

const router = express.Router();
const controller = createCrudController('analytics_logs');

router.get('/', controller.index);
router.post('/', controller.store);
router.get('/:id', controller.show);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

export default router;
