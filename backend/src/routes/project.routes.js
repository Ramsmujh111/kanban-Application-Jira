const express = require('express');
const projectController = require('../controllers/project.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

router.post('/', projectController.create);
router.get('/', projectController.getAll);
router.get('/:id', projectController.getOne);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.remove);

// Member management
router.post('/:id/members', projectController.addMember);
router.delete('/:id/members/:userId', projectController.removeMember);

// Activity
router.get('/:id/activity', projectController.getActivity);

module.exports = router;
