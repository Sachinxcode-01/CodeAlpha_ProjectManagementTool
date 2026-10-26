const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireProjectMember, requireTaskAccess } = require('../middleware/rbacMiddleware');

// Project-scoped task routes
router.get('/projects/:projectId/tasks', authMiddleware, requireProjectMember, taskController.listTasks);
router.post('/projects/:projectId/tasks', authMiddleware, requireProjectMember, taskController.createTask);

// Task-scoped routes
router.get('/tasks/:taskId', authMiddleware, requireTaskAccess, taskController.getTask);
router.patch('/tasks/:taskId', authMiddleware, requireTaskAccess, taskController.updateTask);
router.delete('/tasks/:taskId', authMiddleware, requireTaskAccess, taskController.deleteTask);

module.exports = router;
