const db = require('../config/db');
const logActivity = require('../utils/activityLogger');

// GET /api/projects
function listProjects(req, res) {
  const statusFilter = req.query.status;
  let sql = `
    SELECT 
      p.id, 
      p.name, 
      p.description, 
      p.status, 
      p.owner_id,
      u.name as owner_name,
      pm.role as user_role,
      p.created_at,
      p.updated_at,
      COUNT(t.id) as total_tasks,
      SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
    JOIN users u ON p.owner_id = u.id
    LEFT JOIN tasks t ON p.id = t.project_id
  `;

  const params = [req.user.id];

  if (statusFilter && ['ACTIVE', 'COMPLETED', 'ARCHIVED'].includes(statusFilter)) {
    sql += ` WHERE p.status = ?`;
    params.push(statusFilter);
  }

  sql += ` GROUP BY p.id ORDER BY p.updated_at DESC`;

  const projects = db.prepare(sql).all(...params);
  return res.json({ success: true, data: projects });
}

// POST /api/projects
function createProject(req, res) {
  const { name, description } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Project name must be at least 2 characters.' });
  }

  const trimmedName = name.trim();
  const trimmedDesc = description ? description.trim() : '';

  // Atomic transaction for project creation + owner membership
  const createTx = db.transaction(() => {
    const insertProj = db.prepare(`
      INSERT INTO projects (name, description, owner_id, status)
      VALUES (?, ?, ?, 'ACTIVE')
    `);
    const projResult = insertProj.run(trimmedName, trimmedDesc, req.user.id);
    const projectId = projResult.lastInsertRowid;

    const insertMember = db.prepare(`
      INSERT INTO project_members (project_id, user_id, role)
      VALUES (?, ?, 'OWNER')
    `);
    insertMember.run(projectId, req.user.id);

    return projectId;
  });

  try {
    const projectId = createTx();

    logActivity({
      projectId,
      actorId: req.user.id,
      actionType: 'PROJECT_CREATED',
      details: `Project "${trimmedName}" was created.`
    });

    const newProject = db.prepare(`
      SELECT p.*, 'OWNER' as user_role, u.name as owner_name
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `).get(projectId);

    return res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: newProject
    });
  } catch (err) {
    console.error('Project creation error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create project.' });
  }
}

// GET /api/projects/:projectId
function getProject(req, res) {
  const projectId = req.projectId;

  const project = db.prepare(`
    SELECT 
      p.*, 
      u.name as owner_name,
      pm.role as user_role,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'COMPLETED') as completed_tasks
    FROM projects p
    JOIN users u ON p.owner_id = u.id
    JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
    WHERE p.id = ?
  `).get(req.user.id, projectId);

  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found.' });
  }

  // Fetch member roster
  const members = db.prepare(`
    SELECT pm.id as membership_id, pm.role, pm.joined_at, u.id as user_id, u.name, u.email
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
    ORDER BY pm.role DESC, u.name ASC
  `).all(projectId);

  return res.json({
    success: true,
    data: {
      ...project,
      members
    }
  });
}

// PATCH /api/projects/:projectId
function updateProject(req, res) {
  const projectId = req.projectId;
  const { name, description, status } = req.body;

  const current = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!current) {
    return res.status(404).json({ success: false, error: 'Project not found.' });
  }

  const newName = name !== undefined ? name.trim() : current.name;
  const newDesc = description !== undefined ? description.trim() : current.description;
  const newStatus = status !== undefined ? status : current.status;

  if (newName.length < 2) {
    return res.status(400).json({ success: false, error: 'Project name must be at least 2 characters.' });
  }

  if (!['ACTIVE', 'COMPLETED', 'ARCHIVED'].includes(newStatus)) {
    return res.status(400).json({ success: false, error: 'Invalid project status.' });
  }

  db.prepare(`
    UPDATE projects 
    SET name = ?, description = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(newName, newDesc, newStatus, projectId);

  logActivity({
    projectId,
    actorId: req.user.id,
    actionType: 'PROJECT_UPDATED',
    details: `Project updated: status="${newStatus}", name="${newName}"`
  });

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  return res.json({ success: true, message: 'Project updated.', data: updated });
}

// DELETE /api/projects/:projectId
function deleteProject(req, res) {
  const projectId = req.projectId;

  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);

  return res.json({ success: true, message: 'Project deleted successfully.' });
}

// GET /api/projects/:projectId/members
function listMembers(req, res) {
  const members = db.prepare(`
    SELECT pm.id as membership_id, pm.role, pm.joined_at, u.id as user_id, u.name, u.email
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
    ORDER BY pm.role DESC, u.name ASC
  `).all(req.projectId);

  return res.json({ success: true, data: members });
}

// POST /api/projects/:projectId/members
function addMember(req, res) {
  const { email, role = 'MEMBER' } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'User email is required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const targetUser = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(normalizedEmail);

  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'No user registered with that email address.' });
  }

  const existingMember = db.prepare(`
    SELECT id FROM project_members 
    WHERE project_id = ? AND user_id = ?
  `).get(req.projectId, targetUser.id);

  if (existingMember) {
    return res.status(400).json({ success: false, error: 'User is already a member of this project.' });
  }

  const validatedRole = role === 'OWNER' ? 'OWNER' : 'MEMBER';

  db.prepare(`
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (?, ?, ?)
  `).run(req.projectId, targetUser.id, validatedRole);

  logActivity({
    projectId: req.projectId,
    actorId: req.user.id,
    actionType: 'MEMBER_ADDED',
    details: `Added ${targetUser.name} (${targetUser.email}) as ${validatedRole}.`
  });

  return res.status(201).json({
    success: true,
    message: `${targetUser.name} added to the project.`,
    data: {
      user_id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: validatedRole
    }
  });
}

// DELETE /api/projects/:projectId/members/:userId
function removeMember(req, res) {
  const targetUserId = Number(req.params.userId);

  // Prevent removing the primary owner
  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(req.projectId);
  if (project.owner_id === targetUserId) {
    return res.status(400).json({ success: false, error: 'Cannot remove the primary project owner.' });
  }

  const result = db.prepare(`
    DELETE FROM project_members 
    WHERE project_id = ? AND user_id = ?
  `).run(req.projectId, targetUserId);

  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: 'Member not found in this project.' });
  }

  // Unassign tasks assigned to removed member
  db.prepare(`
    UPDATE tasks SET assignee_id = NULL 
    WHERE project_id = ? AND assignee_id = ?
  `).run(req.projectId, targetUserId);

  logActivity({
    projectId: req.projectId,
    actorId: req.user.id,
    actionType: 'MEMBER_REMOVED',
    details: `Removed member ID ${targetUserId} from project.`
  });

  return res.json({ success: true, message: 'Member removed from project.' });
}

// GET /api/projects/:projectId/activity
function getActivity(req, res) {
  const activities = db.prepare(`
    SELECT a.*, u.name as actor_name, u.email as actor_email, t.title as task_title
    FROM activity_logs a
    JOIN users u ON a.actor_id = u.id
    LEFT JOIN tasks t ON a.task_id = t.id
    WHERE a.project_id = ?
    ORDER BY a.created_at DESC
    LIMIT 50
  `).all(req.projectId);

  return res.json({ success: true, data: activities });
}

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  listMembers,
  addMember,
  removeMember,
  getActivity
};
