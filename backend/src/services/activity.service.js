const Activity = require('../models/Activity');

const logActivity = async ({ project, task, user, action, details }) => {
  try {
    await Activity.create({
      project,
      task: task || null,
      user,
      action,
      details: details || {},
    });
  } catch (error) {
    // Don't throw - activity logging is non-critical
    console.error('Failed to log activity:', error.message);
  }
};

const getProjectActivity = async (projectId, limit = 50, page = 1) => {
  const skip = (page - 1) * limit;

  const activities = await Activity.find({ project: projectId })
    .populate('user', 'name email avatar')
    .populate('task', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Activity.countDocuments({ project: projectId });

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  logActivity,
  getProjectActivity,
};
