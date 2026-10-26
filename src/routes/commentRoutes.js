const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireTaskAccess } = require('../middleware/rbacMiddleware');

router.get('/tasks/:taskId/comments', authMiddleware, requireTaskAccess, commentController.listComments);
router.post('/tasks/:taskId/comments', authMiddleware, requireTaskAccess, commentController.createComment);
router.delete('/comments/:commentId', authMiddleware, commentController.deleteComment);

module.exports = router;
