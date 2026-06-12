import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getSocket, connectSocket } from '../socket/socket';
import {
  addTask,
  updateTaskInStore,
  removeTaskFromStore,
  addCommentToStore,
  setOnlineUsers,
  fetchTasks,
} from '../store/taskSlice';

const useSocket = (projectId) => {
  const socketRef = useRef(null);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token || !projectId) return;

    // Connect socket if not connected
    const socket = connectSocket(token);
    socketRef.current = socket;

    // Join project room
    socket.emit('project:join', { projectId });

    // Listen for real-time events
    socket.on('task:created', ({ task }) => {
      dispatch(addTask(task));
    });

    socket.on('task:updated', ({ task }) => {
      dispatch(updateTaskInStore(task));
    });

    socket.on('task:moved', () => {
      // Refresh all tasks to get correct ordering
      dispatch(fetchTasks(projectId));
    });

    socket.on('task:deleted', ({ taskId }) => {
      dispatch(removeTaskFromStore(taskId));
    });

    socket.on('comment:added', ({ taskId, comment }) => {
      dispatch(addCommentToStore({ taskId, comment }));
    });

    socket.on('presence:update', ({ users }) => {
      dispatch(setOnlineUsers(users));
    });

    socket.on('member:joined', ({ user }) => {
      console.log(`${user.name} joined the project`);
    });

    socket.on('member:left', ({ userId }) => {
      console.log(`User ${userId} left the project`);
    });

    // Cleanup
    return () => {
      socket.emit('project:leave', { projectId });
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:moved');
      socket.off('task:deleted');
      socket.off('comment:added');
      socket.off('presence:update');
      socket.off('member:joined');
      socket.off('member:left');
    };
  }, [token, projectId, dispatch]);

  const emitTaskCreate = useCallback((data) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('task:create', { projectId, ...data });
    }
  }, [projectId]);

  const emitTaskUpdate = useCallback((taskId, changes) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('task:update', { taskId, changes });
    }
  }, []);

  const emitTaskMove = useCallback((taskId, toColumn, order) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('task:move', { taskId, toColumn, order });
    }
  }, []);

  const emitTaskDelete = useCallback((taskId) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('task:delete', { taskId, projectId });
    }
  }, [projectId]);

  const emitCommentAdd = useCallback((taskId, text) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('comment:add', { taskId, text });
    }
  }, []);

  return {
    emitTaskCreate,
    emitTaskUpdate,
    emitTaskMove,
    emitTaskDelete,
    emitCommentAdd,
  };
};

export default useSocket;
