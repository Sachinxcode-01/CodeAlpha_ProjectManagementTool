// TaskFlow Frontend Application Logic
let currentUser = null;
let currentProjectId = null;
let currentProjectData = null;
let currentTaskId = null;
let allProjectsCache = [];
let currentProjectTasks = [];

// ==========================================
// Toast Utility
// ==========================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// Modal Helpers
// ==========================================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  });
});

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-close');
    closeModal(targetId);
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  }
});

// ==========================================
// View Routing & Navigation
// ==========================================
function switchView(viewName, param = null) {
  document.getElementById('view-dashboard').style.display = 'none';
  document.getElementById('view-projects').style.display = 'none';
  document.getElementById('view-board').style.display = 'none';

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  const heading = document.getElementById('page-heading');

  if (viewName === 'dashboard') {
    heading.textContent = 'Dashboard';
    document.getElementById('view-dashboard').style.display = 'block';
    loadDashboard();
  } else if (viewName === 'projects') {
    heading.textContent = 'Projects';
    document.getElementById('view-projects').style.display = 'block';
    loadProjects();
  } else if (viewName === 'board') {
    heading.textContent = 'Project Board';
    document.getElementById('view-board').style.display = 'block';
    if (param) loadBoard(param);
  }
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const view = item.dataset.view;
    if (view) switchView(view);
  });
});

// ==========================================
// Initialization & Auth Guard
// ==========================================
async function initApp() {
  const token = API.getToken();
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const res = await API.get('/api/auth/me');
    currentUser = res.data.user;
    API.setUser(currentUser);

    // Update sidebar profile
    document.getElementById('sidebar-user-name').textContent = currentUser.name;
    document.getElementById('sidebar-user-email').textContent = currentUser.email;
    document.getElementById('sidebar-user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();

    // Default to Dashboard
    switchView('dashboard');
  } catch (err) {
    API.setToken(null);
    window.location.href = '/login.html';
  }
}

document.getElementById('logout-btn').addEventListener('click', () => {
  API.setToken(null);
  API.setUser(null);
  showToast('Logged out.', 'info');
  setTimeout(() => window.location.href = '/login.html', 400);
});

// ==========================================
// Dashboard Logic
// ==========================================
async function loadDashboard() {
  try {
    const res = await API.get('/api/dashboard');
    const { metrics, upcoming_deadlines, recent_activity } = res.data;

    // Metrics
    document.getElementById('metric-total-projects').textContent = metrics.total_projects;
    document.getElementById('metric-active-projects').textContent = metrics.active_projects;
    document.getElementById('metric-total-tasks').textContent = metrics.total_tasks;
    document.getElementById('metric-assigned-me').textContent = metrics.assigned_to_me;
    document.getElementById('metric-completed-tasks').textContent = metrics.completed_tasks;
    document.getElementById('metric-overdue-tasks').textContent = metrics.overdue_tasks;

    // Upcoming Deadlines
    const deadlinesContainer = document.getElementById('upcoming-deadlines-container');
    if (!upcoming_deadlines || upcoming_deadlines.length === 0) {
      deadlinesContainer.innerHTML = `<p style="color: var(--text-dim); font-size: 13.5px;">No deadlines within the next 7 days.</p>`;
    } else {
      deadlinesContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${upcoming_deadlines.map(t => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bg-primary); border-radius: var(--radius-md); border: 1px solid var(--border-color); cursor: pointer;" onclick="openTaskDetail(${t.id})">
              <div>
                <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">${escapeHtml(t.title)}</div>
                <div style="font-size: 12px; color: var(--text-dim);">${escapeHtml(t.project_name)} • Assigned: ${escapeHtml(t.assignee_name || 'Unassigned')}</div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
                <span style="font-size: 12px; font-weight: 600; color: #f87171;">Due ${formatDate(t.due_date)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Recent Activity
    const activityContainer = document.getElementById('recent-activity-container');
    if (!recent_activity || recent_activity.length === 0) {
      activityContainer.innerHTML = `<p style="color: var(--text-dim); font-size: 13.5px;">No activity logged yet.</p>`;
    } else {
      activityContainer.innerHTML = recent_activity.map(a => `
        <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.04);">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary); margin-top: 6px;"></div>
          <div style="flex: 1;">
            <span style="font-weight: 600; color: #fff;">${escapeHtml(a.actor_name)}</span>: ${escapeHtml(a.details || a.action_type)}
            <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">${timeAgo(a.created_at)} • ${escapeHtml(a.project_name)}</div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    showToast('Failed to load dashboard metrics: ' + err.message, 'error');
  }
}

// ==========================================
// Projects List Logic
// ==========================================
async function loadProjects() {
  const container = document.getElementById('projects-grid-container');
  container.innerHTML = `<p style="color: var(--text-dim);">Loading projects...</p>`;

  try {
    const res = await API.get('/api/projects');
    allProjectsCache = res.data;
    renderProjectsGrid();
  } catch (err) {
    container.innerHTML = `<p style="color: var(--color-urgent);">Error: ${escapeHtml(err.message)}</p>`;
  }
}

function renderProjectsGrid() {
  const container = document.getElementById('projects-grid-container');
  const search = document.getElementById('project-search-input').value.toLowerCase().trim();
  const status = document.getElementById('project-status-filter').value;

  const filtered = allProjectsCache.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search) || (p.description && p.description.toLowerCase().includes(search));
    const matchesStatus = status === 'ALL' || p.status === status;
    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
        <p style="color: var(--text-muted); font-size: 15px; margin-bottom: 12px;">No projects found.</p>
        <button class="btn btn-primary btn-sm" onclick="openCreateProjectModal()">Create your first project</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const total = p.total_tasks || 0;
    const completed = p.completed_tasks || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return `
      <div class="project-card" onclick="switchView('board', ${p.id})">
        <div class="project-card-header">
          <h3 class="project-card-title">${escapeHtml(p.name)}</h3>
          <span class="badge badge-${p.status.toLowerCase()}">${p.status}</span>
        </div>
        <p class="project-card-desc">${escapeHtml(p.description || 'No description provided.')}</p>

        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
          <span style="color: var(--text-dim);">Progress</span>
          <span style="font-weight: 700; color: #fff;">${progress}% (${completed}/${total})</span>
        </div>
        <div class="project-progress-bar">
          <div class="project-progress-fill" style="width: ${progress}%;"></div>
        </div>

        <div class="project-card-footer">
          <span>Role: <strong style="color: #fff;">${p.user_role}</strong></span>
          <span>Updated ${timeAgo(p.updated_at)}</span>
        </div>
      </div>
    `;
  }).join('');
}

document.getElementById('project-search-input').addEventListener('input', renderProjectsGrid);
document.getElementById('project-status-filter').addEventListener('change', renderProjectsGrid);

// ==========================================
// Project Board & Kanban Logic
// ==========================================
async function loadBoard(projectId) {
  currentProjectId = projectId;
  const colTodo = document.getElementById('column-todo');
  const colProgress = document.getElementById('column-in_progress');
  const colCompleted = document.getElementById('column-completed');

  colTodo.innerHTML = `<p style="color: var(--text-dim); font-size: 13px;">Loading...</p>`;
  colProgress.innerHTML = '';
  colCompleted.innerHTML = '';

  try {
    const projRes = await API.get(`/api/projects/${projectId}`);
    currentProjectData = projRes.data;

    document.getElementById('board-project-title').textContent = currentProjectData.name;
    document.getElementById('board-project-desc').textContent = currentProjectData.description || 'No description';
    
    const statusBadge = document.getElementById('board-project-status');
    statusBadge.textContent = currentProjectData.status;
    statusBadge.className = `badge badge-${currentProjectData.status.toLowerCase()}`;

    const roleBadge = document.getElementById('board-user-role');
    roleBadge.textContent = currentProjectData.user_role;
    roleBadge.className = `badge ${currentProjectData.user_role === 'OWNER' ? 'badge-urgent' : 'badge-medium'}`;

    // Show delete project button only to owner
    const deleteBtn = document.getElementById('btn-delete-project');
    deleteBtn.style.display = currentProjectData.user_role === 'OWNER' ? 'inline-flex' : 'none';

    // Populate assignee filter options
    const assigneeFilter = document.getElementById('task-assignee-filter');
    assigneeFilter.innerHTML = '<option value="ALL">All Assignees</option><option value="unassigned">Unassigned</option>';
    currentProjectData.members.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.user_id;
      opt.textContent = m.name;
      assigneeFilter.appendChild(opt);
    });

    // Fetch tasks
    await refreshBoardTasks();
  } catch (err) {
    showToast('Failed to load project board: ' + err.message, 'error');
    switchView('projects');
  }
}

async function refreshBoardTasks() {
  try {
    const tasksRes = await API.get(`/api/projects/${currentProjectId}/tasks`);
    currentProjectTasks = tasksRes.data;
    renderKanbanTasks();
  } catch (err) {
    showToast('Error fetching tasks: ' + err.message, 'error');
  }
}

function renderKanbanTasks() {
  const searchTerm = document.getElementById('task-search-input').value.toLowerCase().trim();
  const priorityFilter = document.getElementById('task-priority-filter').value;
  const assigneeFilter = document.getElementById('task-assignee-filter').value;

  const filtered = currentProjectTasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm) || (t.description && t.description.toLowerCase().includes(searchTerm));
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    let matchesAssignee = true;
    if (assigneeFilter === 'unassigned') {
      matchesAssignee = !t.assignee_id;
    } else if (assigneeFilter !== 'ALL') {
      matchesAssignee = t.assignee_id === Number(assigneeFilter);
    }
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const todoTasks = filtered.filter(t => t.status === 'TODO');
  const progressTasks = filtered.filter(t => t.status === 'IN_PROGRESS');
  const completedTasks = filtered.filter(t => t.status === 'COMPLETED');

  document.getElementById('count-todo').textContent = todoTasks.length;
  document.getElementById('count-in_progress').textContent = progressTasks.length;
  document.getElementById('count-completed').textContent = completedTasks.length;

  document.getElementById('column-todo').innerHTML = renderTaskCardsList(todoTasks);
  document.getElementById('column-in_progress').innerHTML = renderTaskCardsList(progressTasks);
  document.getElementById('column-completed').innerHTML = renderTaskCardsList(completedTasks);
}

function renderTaskCardsList(tasks) {
  if (tasks.length === 0) {
    return `<div style="text-align: center; padding: 24px 0; color: var(--text-dim); font-size: 13px;">No tasks</div>`;
  }

  return tasks.map(t => {
    const isOverdue = t.status !== 'COMPLETED' && t.due_date && new Date(t.due_date) < new Date().setHours(0,0,0,0);

    return `
      <div class="task-card" onclick="openTaskDetail(${t.id})">
        <div class="task-card-header">
          <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
          ${isOverdue ? '<span class="badge badge-urgent" style="font-size: 10px;">Overdue</span>' : ''}
        </div>
        <h4 class="task-card-title">${escapeHtml(t.title)}</h4>
        ${t.description ? `<p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.4; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(t.description)}</p>` : ''}
        
        <div class="task-card-footer">
          <span>👤 ${escapeHtml(t.assignee_name || 'Unassigned')}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${t.comment_count > 0 ? `<span>💬 ${t.comment_count}</span>` : ''}
            <span>${t.due_date ? formatDate(t.due_date) : ''}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

document.getElementById('task-search-input').addEventListener('input', renderKanbanTasks);
document.getElementById('task-priority-filter').addEventListener('change', renderKanbanTasks);
document.getElementById('task-assignee-filter').addEventListener('change', renderKanbanTasks);

document.getElementById('btn-back-to-projects').addEventListener('click', () => {
  switchView('projects');
});

// ==========================================
// Project Creation & Editing
// ==========================================
function openCreateProjectModal() {
  document.getElementById('modal-project-title').textContent = 'Create New Project';
  document.getElementById('project-id-input').value = '';
  document.getElementById('project-name-input').value = '';
  document.getElementById('project-desc-input').value = '';
  document.getElementById('project-status-group').style.display = 'none';
  document.getElementById('btn-save-project').textContent = 'Create Project';
  openModal('modal-project');
}

document.getElementById('btn-create-project-global').addEventListener('click', openCreateProjectModal);
document.getElementById('btn-create-project-list').addEventListener('click', openCreateProjectModal);

document.getElementById('form-project').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('project-id-input').value;
  const name = document.getElementById('project-name-input').value;
  const description = document.getElementById('project-desc-input').value;

  try {
    if (id) {
      const status = document.getElementById('project-status-select').value;
      await API.patch(`/api/projects/${id}`, { name, description, status });
      showToast('Project updated.', 'success');
    } else {
      const res = await API.post('/api/projects', { name, description });
      showToast('Project created successfully!', 'success');
      currentProjectId = res.data.id;
    }

    closeModal('modal-project');
    if (currentProjectId && document.getElementById('view-board').style.display !== 'none') {
      loadBoard(currentProjectId);
    } else {
      switchView('projects');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.getElementById('btn-delete-project').addEventListener('click', async () => {
  if (!confirm(`Are you sure you want to delete "${currentProjectData.name}"? All tasks and comments will be permanently erased.`)) {
    return;
  }

  try {
    await API.delete(`/api/projects/${currentProjectId}`);
    showToast('Project deleted.', 'info');
    switchView('projects');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ==========================================
// Task Creation & Editing
// ==========================================
async function openCreateTaskModal(targetProjectId = null) {
  document.getElementById('modal-task-title').textContent = 'Create Task';
  document.getElementById('task-id-input').value = '';
  document.getElementById('task-title-input').value = '';
  document.getElementById('task-desc-input').value = '';
  document.getElementById('task-priority-select').value = 'MEDIUM';
  document.getElementById('task-status-select').value = 'TODO';
  document.getElementById('task-due-date-input').value = '';
  document.getElementById('btn-save-task').textContent = 'Create Task';

  const projSelect = document.getElementById('task-project-select');
  projSelect.innerHTML = '';

  // Load accessible projects into select
  if (allProjectsCache.length === 0) {
    const res = await API.get('/api/projects');
    allProjectsCache = res.data;
  }

  allProjectsCache.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    if (targetProjectId && p.id === targetProjectId) opt.selected = true;
    else if (!targetProjectId && currentProjectId && p.id === currentProjectId) opt.selected = true;
    projSelect.appendChild(opt);
  });

  await populateAssigneeDropdown(projSelect.value);

  projSelect.onchange = async () => {
    await populateAssigneeDropdown(projSelect.value);
  };

  openModal('modal-task');
}

async function populateAssigneeDropdown(projectId, selectedUserId = null) {
  const assigneeSelect = document.getElementById('task-assignee-select');
  assigneeSelect.innerHTML = '<option value="">Unassigned</option>';

  if (!projectId) return;

  try {
    const membersRes = await API.get(`/api/projects/${projectId}/members`);
    membersRes.data.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.user_id;
      opt.textContent = `${m.name} (${m.email})`;
      if (selectedUserId && m.user_id === selectedUserId) opt.selected = true;
      assigneeSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Error populating members:', err);
  }
}

document.getElementById('btn-create-task-global').addEventListener('click', () => openCreateTaskModal());
document.getElementById('btn-add-task-board').addEventListener('click', () => openCreateTaskModal(currentProjectId));

document.getElementById('form-task').addEventListener('submit', async (e) => {
  e.preventDefault();
  const taskId = document.getElementById('task-id-input').value;
  const projectId = document.getElementById('task-project-select').value;
  const title = document.getElementById('task-title-input').value;
  const description = document.getElementById('task-desc-input').value;
  const priority = document.getElementById('task-priority-select').value;
  const status = document.getElementById('task-status-select').value;
  const due_date = document.getElementById('task-due-date-input').value || null;
  const assignee_id = document.getElementById('task-assignee-select').value || null;

  try {
    if (taskId) {
      await API.patch(`/api/tasks/${taskId}`, {
        title, description, priority, status, due_date, assignee_id
      });
      showToast('Task updated successfully.', 'success');
    } else {
      await API.post(`/api/projects/${projectId}/tasks`, {
        title, description, priority, status, due_date, assignee_id
      });
      showToast('Task created successfully!', 'success');
    }

    closeModal('modal-task');

    // Refresh whichever view is open
    if (document.getElementById('view-board').style.display !== 'none' && currentProjectId == projectId) {
      refreshBoardTasks();
    } else if (document.getElementById('view-dashboard').style.display !== 'none') {
      loadDashboard();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ==========================================
// Task Details & Discussion Modal
// ==========================================
async function openTaskDetail(taskId) {
  currentTaskId = taskId;
  try {
    const res = await API.get(`/api/tasks/${taskId}`);
    const task = res.data;

    document.getElementById('detail-task-title').textContent = task.title;
    document.getElementById('detail-task-desc').textContent = task.description || 'No detailed description.';
    
    const prio = document.getElementById('detail-task-priority');
    prio.textContent = task.priority;
    prio.className = `badge badge-${task.priority.toLowerCase()}`;

    const st = document.getElementById('detail-task-status');
    st.textContent = task.status;
    st.className = `badge badge-${task.status.toLowerCase()}`;

    document.getElementById('detail-task-assignee').textContent = task.assignee_name || 'Unassigned';
    document.getElementById('detail-task-due').textContent = task.due_date ? formatDate(task.due_date) : 'No deadline';
    document.getElementById('detail-task-creator').textContent = task.creator_name;
    document.getElementById('detail-task-project').textContent = task.project_name;

    // Quick status buttons wiring
    document.getElementById('btn-move-todo').onclick = () => updateTaskStatus(taskId, 'TODO');
    document.getElementById('btn-move-progress').onclick = () => updateTaskStatus(taskId, 'IN_PROGRESS');
    document.getElementById('btn-move-completed').onclick = () => updateTaskStatus(taskId, 'COMPLETED');

    // Edit button wiring
    document.getElementById('detail-btn-edit-task').onclick = () => {
      closeModal('modal-task-detail');
      openEditTaskModal(task);
    };

    // Delete button wiring
    document.getElementById('detail-btn-delete-task').onclick = async () => {
      if (!confirm(`Delete task "${task.title}"?`)) return;
      try {
        await API.delete(`/api/tasks/${taskId}`);
        showToast('Task deleted.', 'info');
        closeModal('modal-task-detail');
        if (currentProjectId) refreshBoardTasks();
        else loadDashboard();
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    // Render comments
    renderComments(task.comments);

    openModal('modal-task-detail');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateTaskStatus(taskId, newStatus) {
  try {
    await API.patch(`/api/tasks/${taskId}`, { status: newStatus });
    showToast(`Task moved to ${newStatus}`, 'success');
    openTaskDetail(taskId);
    if (currentProjectId) refreshBoardTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openEditTaskModal(task) {
  document.getElementById('modal-task-title').textContent = 'Edit Task';
  document.getElementById('task-id-input').value = task.id;
  document.getElementById('task-title-input').value = task.title;
  document.getElementById('task-desc-input').value = task.description || '';
  document.getElementById('task-priority-select').value = task.priority;
  document.getElementById('task-status-select').value = task.status;
  document.getElementById('task-due-date-input').value = task.due_date || '';
  document.getElementById('btn-save-task').textContent = 'Update Task';

  const projSelect = document.getElementById('task-project-select');
  projSelect.innerHTML = `<option value="${task.project_id}">${escapeHtml(task.project_name)}</option>`;
  projSelect.disabled = true;

  populateAssigneeDropdown(task.project_id, task.assignee_id);
  openModal('modal-task');
}

// Comments
function renderComments(comments) {
  const container = document.getElementById('task-comments-list');
  if (!comments || comments.length === 0) {
    container.innerHTML = `<p style="color: var(--text-dim); font-size: 13px;">No comments yet. Start the conversation!</p>`;
    return;
  }

  container.innerHTML = comments.map(c => `
    <div class="comment-item">
      <div class="comment-header">
        <span class="comment-author">${escapeHtml(c.author_name)}</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="comment-time">${timeAgo(c.created_at)}</span>
          ${(currentUser && currentUser.id === c.author_id) ? `
            <button onclick="deleteCommentItem(${c.id})" style="background: none; border: none; color: #f87171; cursor: pointer; font-size: 11px;">Delete</button>
          ` : ''}
        </div>
      </div>
      <div class="comment-content">${escapeHtml(c.content)}</div>
    </div>
  `).join('');
}

document.getElementById('form-comment').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('comment-input');
  const content = input.value.trim();
  if (!content) return;

  try {
    await API.post(`/api/tasks/${currentTaskId}/comments`, { content });
    input.value = '';
    // Refresh modal comments
    const res = await API.get(`/api/tasks/${currentTaskId}`);
    renderComments(res.data.comments);
    showToast('Comment posted.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

async function deleteCommentItem(commentId) {
  try {
    await API.delete(`/api/comments/${commentId}`);
    showToast('Comment deleted.', 'info');
    const res = await API.get(`/api/tasks/${currentTaskId}`);
    renderComments(res.data.comments);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// Project Members Management
// ==========================================
document.getElementById('btn-manage-members').addEventListener('click', async () => {
  await loadMembersModal();
  openModal('modal-members');
});

async function loadMembersModal() {
  const container = document.getElementById('members-list-container');
  container.innerHTML = `<p style="color: var(--text-dim); font-size: 13px;">Loading members...</p>`;

  try {
    const res = await API.get(`/api/projects/${currentProjectId}/members`);
    const members = res.data;

    container.innerHTML = members.map(m => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-primary); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <div>
          <div style="font-weight: 600; font-size: 13.5px;">${escapeHtml(m.name)}</div>
          <div style="font-size: 12px; color: var(--text-dim);">${escapeHtml(m.email)}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="badge ${m.role === 'OWNER' ? 'badge-urgent' : 'badge-medium'}">${m.role}</span>
          ${currentProjectData.user_role === 'OWNER' && m.user_id !== currentProjectData.owner_id ? `
            <button class="btn btn-danger btn-sm" onclick="removeMemberItem(${m.user_id})">Remove</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="color: var(--color-urgent);">${escapeHtml(err.message)}</p>`;
  }
}

document.getElementById('form-add-member').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('add-member-email');
  const email = input.value.trim();

  try {
    await API.post(`/api/projects/${currentProjectId}/members`, { email, role: 'MEMBER' });
    showToast('Member added successfully!', 'success');
    input.value = '';
    await loadMembersModal();
    await loadBoard(currentProjectId);
  } catch (err) {
    showToast(err.message, 'error');
  }
});

async function removeMemberItem(userId) {
  if (!confirm('Remove this collaborator from the project?')) return;
  try {
    await API.delete(`/api/projects/${currentProjectId}/members/${userId}`);
    showToast('Member removed.', 'info');
    await loadMembersModal();
    await loadBoard(currentProjectId);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// Formatting & Sanitization Helpers
// ==========================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((new Date() - new Date(dateStr.replace(' ', 'T') + 'Z')) / 1000);
  if (isNaN(seconds) || seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Boot application
window.addEventListener('DOMContentLoaded', initApp);
