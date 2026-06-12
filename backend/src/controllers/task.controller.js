const taskService = require('../services/task.service');

const create = async (req, res, next) => {
  try {
    const task = await taskService.createTask({
      ...req.body,
      project: req.params.projectId,
      userId: req.userId,
    });
    res.status(201).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const tasks = await taskService.getProjectTasks(
      req.params.projectId,
      req.userId
    );
    res.status(200).json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(
      req.params.id,
      req.userId,
      req.body
    );
    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

const move = async (req, res, next) => {
  try {
    const result = await taskService.moveTask(
      req.params.id,
      req.userId,
      req.body
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.params.id, req.userId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const result = await taskService.addComment(
      req.params.id,
      req.userId,
      req.body.text
    );
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  update,
  move,
  remove,
  addComment,
};
