const db = require('../config/db');

// GET /api/dashboard
function getDashboard(req, res) {
  const userId = req.user.id;

  // 1. Projects stats
  const projectStats = db.prepare(`
    SELECT 
      COUNT(p.id) as total_projects,
      SUM(CASE WHEN p.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_projects,
      SUM(CASE WHEN p.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_projects
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = ?
  `).get(userId);

  // 2. Tasks stats across accessible projects
  const taskStats = db.prepare(`
    SELECT 
      COUNT(t.id) as total_tasks,
      SUM(CASE WHEN t.assignee_id = ? THEN 1 ELSE 0 END) as assigned_to_me,
      SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
      SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_tasks,
      SUM(CASE WHEN t.status = 'TODO' THEN 1 ELSE 0 END) as todo_tasks,
      SUM(CASE WHEN t.status != 'COMPLETED' AND t.due_date IS NOT NULL AND date(t.due_date) < date('now') THEN 1 ELSE 0 END) as overdue_tasks
    FROM tasks t
    JOIN project_members pm ON t.project_id = pm.project_id
    WHERE pm.user_id = ?
  `).get(userId, userId);

  // 3. Upcoming deadlines (due within next 7 days and not completed)
  const upcomingDeadlines = db.prepare(`
    SELECT 
      t.id, 
      t.title, 
      t.priority, 
      t.status, 
      t.due_date, 
      p.id as project_id, 
      p.name as project_name,
      u.name as assignee_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN project_members pm ON p.id = pm.project_id
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE pm.user_id = ? 
      AND t.status != 'COMPLETED'
      AND t.due_date IS NOT NULL 
      AND date(t.due_date) >= date('now') 
      AND date(t.due_date) <= date('now', '+7 days')
    ORDER BY t.due_date ASC
    LIMIT 6
  `).all(userId);

  // 4. Overdue tasks list
  const overdueTasksList = db.prepare(`
    SELECT 
      t.id, 
      t.title, 
      t.priority, 
      t.status, 
      t.due_date, 
      p.id as project_id, 
      p.name as project_name,
      u.name as assignee_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN project_members pm ON p.id = pm.project_id
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE pm.user_id = ? 
      AND t.status != 'COMPLETED'
      AND t.due_date IS NOT NULL 
      AND date(t.due_date) < date('now')
    ORDER BY t.due_date ASC
    LIMIT 6
  `).all(userId);

  // 5. Recent activity across user's projects
  const recentActivity = db.prepare(`
    SELECT 
      a.*, 
      p.name as project_name,
      u.name as actor_name, 
      u.email as actor_email,
      t.title as task_title
    FROM activity_logs a
    JOIN projects p ON a.project_id = p.id
    JOIN project_members pm ON p.id = pm.project_id
    JOIN users u ON a.actor_id = u.id
    LEFT JOIN tasks t ON a.task_id = t.id
    WHERE pm.user_id = ?
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all(userId);

  return res.json({
    success: true,
    data: {
      metrics: {
        total_projects: projectStats.total_projects || 0,
        active_projects: projectStats.active_projects || 0,
        completed_projects: projectStats.completed_projects || 0,
        total_tasks: taskStats.total_tasks || 0,
        assigned_to_me: taskStats.assigned_to_me || 0,
        completed_tasks: taskStats.completed_tasks || 0,
        in_progress_tasks: taskStats.in_progress_tasks || 0,
        todo_tasks: taskStats.todo_tasks || 0,
        overdue_tasks: taskStats.overdue_tasks || 0
      },
      upcoming_deadlines: upcomingDeadlines,
      overdue_tasks: overdueTasksList,
      recent_activity: recentActivity
    }
  });
}

module.exports = {
  getDashboard
};
