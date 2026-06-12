const projectService = require('../services/project.service');
const { getProjectActivity } = require('../services/activity.service');

const create = async (req, res, next) => {
  try {
    const project = await projectService.createProject({
      ...req.body,
      owner: req.userId,
    });
    res.status(201).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const projects = await projectService.getUserProjects(req.userId);
    res.status(200).json({
      success: true,
      data: { projects },
    });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(
      req.params.id,
      req.userId
    );
    res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(
      req.params.id,
      req.userId,
      req.body
    );
    res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(
      req.params.id,
      req.userId
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const project = await projectService.addMember(
      req.params.id,
      req.userId,
      req.body
    );
    res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const project = await projectService.removeMember(
      req.params.id,
      req.userId,
      req.params.userId
    );
    res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

const getActivity = async (req, res, next) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const result = await getProjectActivity(
      req.params.id,
      parseInt(limit),
      parseInt(page)
    );
    res.status(200).json({
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
  remove,
  addMember,
  removeMember,
  getActivity,
};
