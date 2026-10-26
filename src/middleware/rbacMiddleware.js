const db = require('../config/db');

// Verify user is at least a member or owner of the project
function requireProjectMember(req, res, next) {
  const projectId = req.params.projectId || req.body.project_id || req.query.projectId;

  if (!projectId) {
    return res.status(400).json({ success: false, error: 'Project ID is required.' });
  }

  const membership = db.prepare(`
    SELECT role FROM project_members 
    WHERE project_id = ? AND user_id = ?
  `).get(projectId, req.user.id);

  if (!membership) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. You are not a member of this project.'
    });
  }

  req.projectRole = membership.role;
  req.projectId = Number(projectId);
  next();
}

// Verify user is specifically the project owner
function requireProjectOwner(req, res, next) {
  const projectId = req.params.projectId || req.body.project_id || req.query.projectId;

  if (!projectId) {
    return res.status(400).json({ success: false, error: 'Project ID is required.' });
  }

  const membership = db.prepare(`
    SELECT role FROM project_members 
    WHERE project_id = ? AND user_id = ?
  `).get(projectId, req.user.id);

  if (!membership || membership.role !== 'OWNER') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Only the project owner can perform this action.'
    });
  }

  req.projectRole = 'OWNER';
  req.projectId = Number(projectId);
  next();
}

// Verify user has access to the project owning the specified task
function requireTaskAccess(req, res, next) {
  const taskId = req.params.taskId || req.body.task_id;

  if (!taskId) {
    return res.status(400).json({ success: false, error: 'Task ID is required.' });
  }

  const task = db.prepare(`
    SELECT t.*, pm.role as user_role 
    FROM tasks t
    JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = ?
    WHERE t.id = ?
  `).get(req.user.id, taskId);

  if (!task) {
    return res.status(403).json({
      success: false,
      error: 'Access denied or task does not exist in an accessible project.'
    });
  }

  req.task = task;
  req.projectRole = task.user_role;
  req.projectId = task.project_id;
  next();
}

module.exports = {
  requireProjectMember,
  requireProjectOwner,
  requireTaskAccess
};
