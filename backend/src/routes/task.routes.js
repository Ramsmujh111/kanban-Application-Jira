const express = require('express');
const taskController = require('../controllers/task.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// Project-scoped task routes
router.post('/projects/:projectId/tasks', taskController.create);
router.get('/projects/:projectId/tasks', taskController.getAll);

// Task-specific routes
router.get('/tasks/:id', taskController.getOne);
router.put('/tasks/:id', taskController.update);
router.put('/tasks/:id/move', taskController.move);
router.delete('/tasks/:id', taskController.remove);
router.post('/tasks/:id/comments', taskController.addComment);

module.exports = router;
