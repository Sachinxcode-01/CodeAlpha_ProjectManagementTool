const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireProjectMember, requireProjectOwner } = require('../middleware/rbacMiddleware');

// All project routes require authentication
router.use(authMiddleware);

// Project list & creation
router.get('/', projectController.listProjects);
router.post('/', projectController.createProject);

// Scoped to specific project
router.get('/:projectId', requireProjectMember, projectController.getProject);
router.patch('/:projectId', requireProjectOwner, projectController.updateProject);
router.delete('/:projectId', requireProjectOwner, projectController.deleteProject);

// Member management
router.get('/:projectId/members', requireProjectMember, projectController.listMembers);
router.post('/:projectId/members', requireProjectOwner, projectController.addMember);
router.delete('/:projectId/members/:userId', requireProjectOwner, projectController.removeMember);

// Activity logs
router.get('/:projectId/activity', requireProjectMember, projectController.getActivity);

module.exports = router;
