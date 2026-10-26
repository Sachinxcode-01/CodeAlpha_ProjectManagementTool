const db = require('../config/db');
const logActivity = require('../utils/activityLogger');

// GET /api/tasks/:taskId/comments
function listComments(req, res) {
  const comments = db.prepare(`
    SELECT c.*, u.name as author_name, u.email as author_email
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.task_id = ?
    ORDER BY c.created_at ASC
  `).all(req.task.id);

  return res.json({ success: true, data: comments });
}

// POST /api/tasks/:taskId/comments
function createComment(req, res) {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Comment cannot be empty.' });
  }

  const trimmedContent = content.trim();

  const stmt = db.prepare(`
    INSERT INTO comments (task_id, author_id, content)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(req.task.id, req.user.id, trimmedContent);
  const commentId = result.lastInsertRowid;

  logActivity({
    projectId: req.task.project_id,
    actorId: req.user.id,
    taskId: req.task.id,
    actionType: 'COMMENT_ADDED',
    details: `Added a comment on "${req.task.title}".`
  });

  const comment = db.prepare(`
    SELECT c.*, u.name as author_name, u.email as author_email
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.id = ?
  `).get(commentId);

  return res.status(201).json({ success: true, message: 'Comment added.', data: comment });
}

// DELETE /api/comments/:commentId
function deleteComment(req, res) {
  const commentId = Number(req.params.commentId);

  const comment = db.prepare(`
    SELECT c.*, t.project_id, pm.role as user_role
    FROM comments c
    JOIN tasks t ON c.task_id = t.id
    JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = ?
    WHERE c.id = ?
  `).get(req.user.id, commentId);

  if (!comment) {
    return res.status(404).json({ success: false, error: 'Comment not found or access denied.' });
  }

  // Only author or project owner can delete comment
  if (comment.author_id !== req.user.id && comment.user_role !== 'OWNER') {
    return res.status(403).json({ success: false, error: 'Only the author or project owner can delete this comment.' });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);

  return res.json({ success: true, message: 'Comment deleted successfully.' });
}

module.exports = {
  listComments,
  createComment,
  deleteComment
};
