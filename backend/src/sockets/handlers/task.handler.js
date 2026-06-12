const taskService = require('../../services/task.service');
const logger = require('../../utils/logger');

module.exports = (io, socket) => {
  // Create task
  socket.on('task:create', async (data) => {
    try {
      const { projectId, title, description, column, assignee, priority, labels, dueDate } = data;
      const room = `project:${projectId}`;

      const task = await taskService.createTask({
        title,
        description,
        project: projectId,
        column,
        assignee,
        priority,
        labels,
        dueDate,
        userId: socket.userId,
      });

      // Broadcast to all users in the project room (including sender)
      io.to(room).emit('task:created', { task });

      logger.debug(`Task created by ${socket.user.name}: ${task.title}`);
    } catch (error) {
      logger.error('Error creating task via socket:', error);
      socket.emit('error', { message: error.message || 'Failed to create task' });
    }
  });

  // Update task
  socket.on('task:update', async (data) => {
    try {
      const { taskId, changes } = data;

      const task = await taskService.updateTask(taskId, socket.userId, changes);
      const room = `project:${task.project}`;

      io.to(room).emit('task:updated', { task });

      logger.debug(`Task updated by ${socket.user.name}: ${task.title}`);
    } catch (error) {
      logger.error('Error updating task via socket:', error);
      socket.emit('error', { message: error.message || 'Failed to update task' });
    }
  });

  // Move task between columns
  socket.on('task:move', async (data) => {
    try {
      const { taskId, toColumn, order } = data;

      const { task, fromColumn, toColumn: newColumn } = await taskService.moveTask(
        taskId,
        socket.userId,
        { toColumn, order }
      );
      const room = `project:${task.project}`;

      io.to(room).emit('task:moved', {
        task,
        fromColumn,
        toColumn: newColumn,
      });

      logger.debug(`Task moved by ${socket.user.name}: ${fromColumn} → ${newColumn}`);
    } catch (error) {
      logger.error('Error moving task via socket:', error);
      socket.emit('error', { message: error.message || 'Failed to move task' });
    }
  });

  // Delete task
  socket.on('task:delete', async (data) => {
    try {
      const { taskId, projectId } = data;

      await taskService.deleteTask(taskId, socket.userId);
      const room = `project:${projectId}`;

      io.to(room).emit('task:deleted', { taskId });

      logger.debug(`Task deleted by ${socket.user.name}`);
    } catch (error) {
      logger.error('Error deleting task via socket:', error);
      socket.emit('error', { message: error.message || 'Failed to delete task' });
    }
  });

  // Add comment
  socket.on('comment:add', async (data) => {
    try {
      const { taskId, text } = data;

      const { task, comment } = await taskService.addComment(
        taskId,
        socket.userId,
        text
      );
      const room = `project:${task.project}`;

      io.to(room).emit('comment:added', {
        taskId: task._id,
        comment,
      });

      logger.debug(`Comment added by ${socket.user.name}`);
    } catch (error) {
      logger.error('Error adding comment via socket:', error);
      socket.emit('error', { message: error.message || 'Failed to add comment' });
    }
  });
};
