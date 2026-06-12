const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('./activity.service');

const createTask = async ({ title, description, project, column, assignee, priority, labels, dueDate, userId }) => {
  // Verify project exists and user is a member
  const proj = await Project.findById(project);
  if (!proj) {
    throw ApiError.notFound('Project not found');
  }

  const isMember = proj.members.some(
    (m) => m.user.toString() === userId.toString()
  );
  if (!isMember) {
    throw ApiError.forbidden('You are not a member of this project');
  }

  // Determine the column (default to first column)
  const targetColumn = column || (proj.columns.length > 0 ? proj.columns[0].id : 'todo');

  // Get the max order in the column to place at end
  const maxOrderTask = await Task.findOne({ project, column: targetColumn })
    .sort({ order: -1 })
    .select('order');
  const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

  const task = await Task.create({
    title,
    description: description || '',
    project,
    column: targetColumn,
    order,
    assignee: assignee || null,
    priority: priority || 'medium',
    labels: labels || [],
    dueDate: dueDate || null,
  });

  await task.populate('assignee', 'name email avatar');

  await logActivity({
    project,
    task: task._id,
    user: userId,
    action: 'task_created',
    details: { title: task.title, column: targetColumn },
  });

  return task;
};

const getProjectTasks = async (projectId, userId) => {
  // Verify membership
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  const isMember = project.members.some(
    (m) => m.user.toString() === userId.toString()
  );
  if (!isMember) {
    throw ApiError.forbidden('You are not a member of this project');
  }

  const tasks = await Task.find({ project: projectId })
    .populate('assignee', 'name email avatar')
    .populate('comments.user', 'name email avatar')
    .sort({ column: 1, order: 1 });

  return tasks;
};

const getTaskById = async (taskId) => {
  const task = await Task.findById(taskId)
    .populate('assignee', 'name email avatar')
    .populate('comments.user', 'name email avatar');

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  return task;
};

const updateTask = async (taskId, userId, updates) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  const allowedFields = ['title', 'description', 'assignee', 'priority', 'labels', 'dueDate'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      task[field] = updates[field];
    }
  }

  await task.save();
  await task.populate('assignee', 'name email avatar');
  await task.populate('comments.user', 'name email avatar');

  await logActivity({
    project: task.project,
    task: task._id,
    user: userId,
    action: 'task_updated',
    details: { fields: Object.keys(updates) },
  });

  return task;
};

const moveTask = async (taskId, userId, { toColumn, order }) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  const fromColumn = task.column;
  task.column = toColumn;
  task.order = order;

  await task.save();
  await task.populate('assignee', 'name email avatar');

  // Reorder remaining tasks in both columns
  if (fromColumn !== toColumn) {
    // Reorder tasks in the source column
    const sourceTasks = await Task.find({
      project: task.project,
      column: fromColumn,
      _id: { $ne: taskId },
    }).sort({ order: 1 });

    for (let i = 0; i < sourceTasks.length; i++) {
      sourceTasks[i].order = i;
      await sourceTasks[i].save();
    }
  }

  // Reorder tasks in the target column
  const targetTasks = await Task.find({
    project: task.project,
    column: toColumn,
    _id: { $ne: taskId },
  }).sort({ order: 1 });

  // Insert at the right position
  for (let i = 0; i < targetTasks.length; i++) {
    const newOrder = i >= order ? i + 1 : i;
    if (targetTasks[i].order !== newOrder) {
      targetTasks[i].order = newOrder;
      await targetTasks[i].save();
    }
  }

  await logActivity({
    project: task.project,
    task: task._id,
    user: userId,
    action: 'task_moved',
    details: { from: fromColumn, to: toColumn },
  });

  return { task, fromColumn, toColumn };
};

const deleteTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  const projectId = task.project;
  const taskTitle = task.title;

  await Task.findByIdAndDelete(taskId);

  await logActivity({
    project: projectId,
    task: taskId,
    user: userId,
    action: 'task_deleted',
    details: { title: taskTitle },
  });

  return { message: 'Task deleted successfully', taskId };
};

const addComment = async (taskId, userId, text) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  task.comments.push({ user: userId, text });
  await task.save();
  await task.populate('comments.user', 'name email avatar');

  const newComment = task.comments[task.comments.length - 1];

  await logActivity({
    project: task.project,
    task: task._id,
    user: userId,
    action: 'comment_added',
    details: { commentId: newComment._id },
  });

  return { task, comment: newComment };
};

module.exports = {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  moveTask,
  deleteTask,
  addComment,
};
