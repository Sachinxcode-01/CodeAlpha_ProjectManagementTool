const db = require('../config/db');
const logActivity = require('../utils/activityLogger');

// Valid constants
const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// GET /api/projects/:projectId/tasks
function listTasks(req, res) {
  const projectId = req.projectId;
  const { status, priority, assignee_id, search } = req.query;

  let sql = `
    SELECT 
      t.*,
      u_assignee.name as assignee_name,
      u_assignee.email as assignee_email,
      u_creator.name as creator_name,
      (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count
    FROM tasks t
    LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
    JOIN users u_creator ON t.creator_id = u_creator.id
    WHERE t.project_id = ?
  `;

  const params = [projectId];

  if (status && VALID_STATUSES.includes(status)) {
    sql += ` AND t.status = ?`;
    params.push(status);
  }

  if (priority && VALID_PRIORITIES.includes(priority)) {
    sql += ` AND t.priority = ?`;
    params.push(priority);
  }

  if (assignee_id) {
    if (assignee_id === 'unassigned') {
      sql += ` AND t.assignee_id IS NULL`;
    } else {
      sql += ` AND t.assignee_id = ?`;
      params.push(Number(assignee_id));
    }
  }

  if (search && search.trim()) {
    sql += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  sql += ` ORDER BY 
    CASE t.priority 
      WHEN 'URGENT' THEN 1 
      WHEN 'HIGH' THEN 2 
      WHEN 'MEDIUM' THEN 3 
      WHEN 'LOW' THEN 4 
    END ASC, 
    t.due_date ASC NULLS LAST, 
    t.created_at DESC`;

  const tasks = db.prepare(sql).all(...params);
  return res.json({ success: true, data: tasks });
}

// POST /api/projects/:projectId/tasks
function createTask(req, res) {
  const projectId = req.projectId;
  const { title, description = '', status = 'TODO', priority = 'MEDIUM', due_date, assignee_id } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Task title is required.' });
  }

  const trimmedTitle = title.trim();

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ success: false, error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  let finalAssigneeId = null;
  if (assignee_id) {
    // Validate that assignee is an active member of this project
    const memberCheck = db.prepare(`
      SELECT user_id FROM project_members 
      WHERE project_id = ? AND user_id = ?
    `).get(projectId, assignee_id);

    if (!memberCheck) {
      return res.status(400).json({ success: false, error: 'Assigned user is not a member of this project.' });
    }
    finalAssigneeId = Number(assignee_id);
  }

  const stmt = db.prepare(`
    INSERT INTO tasks (project_id, title, description, assignee_id, creator_id, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    projectId,
    trimmedTitle,
    description ? description.trim() : null,
    finalAssigneeId,
    req.user.id,
    status,
    priority,
    due_date || null
  );

  const taskId = result.lastInsertRowid;

  logActivity({
    projectId,
    actorId: req.user.id,
    taskId,
    actionType: 'TASK_CREATED',
    details: `Task "${trimmedTitle}" was created with priority ${priority}.`
  });

  const createdTask = db.prepare(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    JOIN users c ON t.creator_id = c.id
    WHERE t.id = ?
  `).get(taskId);

  return res.status(201).json({ success: true, message: 'Task created.', data: createdTask });
}

// GET /api/tasks/:taskId
function getTask(req, res) {
  const task = db.prepare(`
    SELECT 
      t.*,
      p.name as project_name,
      u_assignee.name as assignee_name,
      u_assignee.email as assignee_email,
      u_creator.name as creator_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
    JOIN users u_creator ON t.creator_id = u_creator.id
    WHERE t.id = ?
  `).get(req.task.id);

  // Fetch comments
  const comments = db.prepare(`
    SELECT c.*, u.name as author_name, u.email as author_email
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.task_id = ?
    ORDER BY c.created_at ASC
  `).all(req.task.id);

  return res.json({
    success: true,
    data: {
      ...task,
      comments
    }
  });
}

// PATCH /api/tasks/:taskId
function updateTask(req, res) {
  const task = req.task;
  const { title, description, status, priority, due_date, assignee_id } = req.body;

  const newTitle = title !== undefined ? title.trim() : task.title;
  const newDesc = description !== undefined ? (description ? description.trim() : null) : task.description;
  const newStatus = status !== undefined ? status : task.status;
  const newPriority = priority !== undefined ? priority : task.priority;
  const newDueDate = due_date !== undefined ? (due_date || null) : task.due_date;

  if (newTitle.length < 1) {
    return res.status(400).json({ success: false, error: 'Task title cannot be empty.' });
  }

  if (!VALID_STATUSES.includes(newStatus)) {
    return res.status(400).json({ success: false, error: 'Invalid task status.' });
  }

  if (!VALID_PRIORITIES.includes(newPriority)) {
    return res.status(400).json({ success: false, error: 'Invalid task priority.' });
  }

  let finalAssigneeId = task.assignee_id;
  if (assignee_id !== undefined) {
    if (assignee_id === null || assignee_id === '' || assignee_id === 0) {
      finalAssigneeId = null;
    } else {
      const memberCheck = db.prepare(`
        SELECT user_id FROM project_members 
        WHERE project_id = ? AND user_id = ?
      `).get(task.project_id, assignee_id);

      if (!memberCheck) {
        return res.status(400).json({ success: false, error: 'Assigned user is not a member of this project.' });
      }
      finalAssigneeId = Number(assignee_id);
    }
  }

  db.prepare(`
    UPDATE tasks
    SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, assignee_id = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(newTitle, newDesc, newStatus, newPriority, newDueDate, finalAssigneeId, task.id);

  // Log status change if modified
  if (newStatus !== task.status) {
    logActivity({
      projectId: task.project_id,
      actorId: req.user.id,
      taskId: task.id,
      actionType: 'TASK_STATUS_CHANGED',
      details: `Status changed from "${task.status}" to "${newStatus}" on "${newTitle}".`
    });
  }

  // Log assignment change if modified
  if (finalAssigneeId !== task.assignee_id) {
    const assigneeName = finalAssigneeId ? db.prepare('SELECT name FROM users WHERE id = ?').get(finalAssigneeId)?.name : 'Unassigned';
    logActivity({
      projectId: task.project_id,
      actorId: req.user.id,
      taskId: task.id,
      actionType: 'TASK_ASSIGNED',
      details: `Task assigned to ${assigneeName}.`
    });
  }

  const updatedTask = db.prepare(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    JOIN users c ON t.creator_id = c.id
    WHERE t.id = ?
  `).get(task.id);

  return res.json({ success: true, message: 'Task updated.', data: updatedTask });
}

// DELETE /api/tasks/:taskId
function deleteTask(req, res) {
  const task = req.task;

  // Authorization: Only Project Owner or the Task Creator can delete the task
  if (req.projectRole !== 'OWNER' && task.creator_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Only the project owner or task creator can delete this task.' });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);

  logActivity({
    projectId: task.project_id,
    actorId: req.user.id,
    actionType: 'TASK_DELETED',
    details: `Task "${task.title}" was deleted.`
  });

  return res.json({ success: true, message: 'Task deleted successfully.' });
}

module.exports = {
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask
};
