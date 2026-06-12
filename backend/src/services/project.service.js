const Project = require('../models/Project');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('./activity.service');

const createProject = async ({ name, description, owner }) => {
  const project = await Project.create({
    name,
    description,
    owner,
  });

  await project.populate('members.user', 'name email avatar');

  await logActivity({
    project: project._id,
    user: owner,
    action: 'project_created',
    details: { name: project.name },
  });

  return project;
};

const getUserProjects = async (userId) => {
  const projects = await Project.find({
    'members.user': userId,
  })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .sort({ updatedAt: -1 });

  return projects;
};

const getProjectById = async (projectId, userId) => {
  const project = await Project.findById(projectId)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar');

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  // Check membership
  const isMember = project.members.some(
    (m) => m.user._id.toString() === userId.toString()
  );
  if (!isMember) {
    throw ApiError.forbidden('You are not a member of this project');
  }

  return project;
};

const updateProject = async (projectId, userId, updates) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  // Only owner can update project
  if (project.owner.toString() !== userId.toString()) {
    throw ApiError.forbidden('Only the project owner can update the project');
  }

  const allowedFields = ['name', 'description', 'columns'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      project[field] = updates[field];
    }
  }

  await project.save();
  await project.populate('owner', 'name email avatar');
  await project.populate('members.user', 'name email avatar');

  await logActivity({
    project: project._id,
    user: userId,
    action: 'project_updated',
    details: { fields: Object.keys(updates) },
  });

  return project;
};

const deleteProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  if (project.owner.toString() !== userId.toString()) {
    throw ApiError.forbidden('Only the project owner can delete the project');
  }

  // Delete all tasks in the project
  await Task.deleteMany({ project: projectId });

  await Project.findByIdAndDelete(projectId);

  return { message: 'Project deleted successfully' };
};

const addMember = async (projectId, userId, { email, role }) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  if (project.owner.toString() !== userId.toString()) {
    throw ApiError.forbidden('Only the project owner can add members');
  }

  const User = require('../models/User');
  const userToAdd = await User.findOne({ email });

  if (!userToAdd) {
    throw ApiError.notFound('User with that email not found');
  }

  // Check if already a member
  const existingMember = project.members.find(
    (m) => m.user.toString() === userToAdd._id.toString()
  );
  if (existingMember) {
    throw ApiError.conflict('User is already a member of this project');
  }

  project.members.push({
    user: userToAdd._id,
    role: role || 'editor',
  });

  await project.save();
  await project.populate('members.user', 'name email avatar');

  await logActivity({
    project: project._id,
    user: userId,
    action: 'member_added',
    details: { memberEmail: email, role: role || 'editor' },
  });

  return project;
};

const removeMember = async (projectId, userId, memberUserId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  if (project.owner.toString() !== userId.toString()) {
    throw ApiError.forbidden('Only the project owner can remove members');
  }

  if (memberUserId === project.owner.toString()) {
    throw ApiError.badRequest('Cannot remove the project owner');
  }

  project.members = project.members.filter(
    (m) => m.user.toString() !== memberUserId
  );

  await project.save();
  await project.populate('members.user', 'name email avatar');

  await logActivity({
    project: project._id,
    user: userId,
    action: 'member_removed',
    details: { removedUserId: memberUserId },
  });

  return project;
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
