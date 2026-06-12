const Project = require('../../models/Project');
const logger = require('../../utils/logger');

module.exports = (io, socket) => {
  // Join a project room
  socket.on('project:join', async ({ projectId }) => {
    try {
      // Verify user is a member of the project
      const project = await Project.findById(projectId);
      if (!project) {
        return socket.emit('error', { message: 'Project not found' });
      }

      const isMember = project.members.some(
        (m) => m.user.toString() === socket.userId
      );
      if (!isMember) {
        return socket.emit('error', { message: 'Not a member of this project' });
      }

      // Join the room
      const room = `project:${projectId}`;
      socket.join(room);

      // Track this socket's current project
      socket.currentProject = projectId;

      logger.debug(`${socket.user.name} joined project room: ${projectId}`);

      // Notify other users in the room
      socket.to(room).emit('member:joined', {
        user: socket.user,
      });

      // Get list of all users in the room
      const sockets = await io.in(room).fetchSockets();
      const onlineUsers = [];
      const seen = new Set();
      for (const s of sockets) {
        if (!seen.has(s.userId)) {
          seen.add(s.userId);
          onlineUsers.push(s.user);
        }
      }

      // Send presence update to all in room
      io.to(room).emit('presence:update', { users: onlineUsers });
    } catch (error) {
      logger.error('Error joining project room:', error);
      socket.emit('error', { message: 'Failed to join project' });
    }
  });

  // Leave a project room
  socket.on('project:leave', async ({ projectId }) => {
    const room = `project:${projectId}`;
    socket.leave(room);
    socket.currentProject = null;

    logger.debug(`${socket.user.name} left project room: ${projectId}`);

    // Notify others
    socket.to(room).emit('member:left', {
      userId: socket.userId,
    });

    // Update presence
    const sockets = await io.in(room).fetchSockets();
    const onlineUsers = [];
    const seen = new Set();
    for (const s of sockets) {
      if (!seen.has(s.userId)) {
        seen.add(s.userId);
        onlineUsers.push(s.user);
      }
    }
    io.to(room).emit('presence:update', { users: onlineUsers });
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    if (socket.currentProject) {
      const room = `project:${socket.currentProject}`;

      socket.to(room).emit('member:left', {
        userId: socket.userId,
      });

      // Update presence
      const sockets = await io.in(room).fetchSockets();
      const onlineUsers = [];
      const seen = new Set();
      for (const s of sockets) {
        if (!seen.has(s.userId)) {
          seen.add(s.userId);
          onlineUsers.push(s.user);
        }
      }
      io.to(room).emit('presence:update', { users: onlineUsers });
    }
    logger.debug(`${socket.user.name} disconnected (${socket.id})`);
  });
};
