const db = require('../config/db');

function logActivity({ projectId, actorId, taskId = null, actionType, details = '' }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO activity_logs (project_id, actor_id, task_id, action_type, details)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(projectId, actorId, taskId, actionType, details);
  } catch (err) {
    console.error('Failed to record activity log:', err.message);
  }
}

module.exports = logActivity;
