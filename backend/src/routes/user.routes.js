const express = require('express');
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// Search users (for add member autocomplete)
router.get('/search', userController.searchUsers);

module.exports = router;
