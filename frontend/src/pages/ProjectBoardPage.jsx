import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProject, addMember } from '../store/projectSlice';
import { fetchTasks, setSelectedTask, clearTasks } from '../store/taskSlice';
import useSocket from '../hooks/useSocket';
import Header from '../components/layout/Header';
import Board from '../components/board/Board';
import TaskDetailModal from '../components/board/TaskDetailModal';
import OnlineUsers from '../components/presence/OnlineUsers';
import AddMemberModal from '../components/project/AddMemberModal';
import Spinner from '../components/common/Spinner';
import '../styles/board.css';

const ProjectBoardPage = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentProject } = useSelector((state) => state.projects);
  const { tasks, selectedTask, onlineUsers, loading } = useSelector((state) => state.tasks);
  const { emitTaskCreate, emitTaskUpdate, emitTaskMove, emitTaskDelete, emitCommentAdd } = useSocket(projectId);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const initialLoad = useRef(true);

  useEffect(() => {
    if (projectId) {
      initialLoad.current = true;
      dispatch(fetchProject(projectId)).unwrap().catch(() => navigate('/dashboard'));
      dispatch(fetchTasks(projectId)).finally(() => {
        initialLoad.current = false;
      });
    }
    return () => {
      dispatch(clearTasks());
    };
  }, [projectId, dispatch]);

  const handleAddTask = (columnId, title) => {
    emitTaskCreate({ title, column: columnId });
  };

  const handleTaskClick = (task) => {
    dispatch(setSelectedTask(task));
  };

  const handleTaskUpdate = (taskId, changes) => {
    emitTaskUpdate(taskId, changes);
  };

  const handleTaskDelete = (taskId) => {
    emitTaskDelete(taskId);
  };

  const handleCommentAdd = (taskId, text) => {
    emitCommentAdd(taskId, text);
  };

  const handleAddMember = async (memberData) => {
    await dispatch(addMember({ projectId, memberData })).unwrap();
  };

  // Get existing member IDs to filter them from search results
  const existingMemberIds = currentProject?.members?.map(
    (m) => m.user?._id || m.user
  ) || [];

  // Only block render on the very first load — not on background re-fetches during DnD
  if (!currentProject || (loading && initialLoad.current)) {
    return (
      <>
        <Header title="Loading..." />
        <Spinner />
      </>
    );
  }

  return (
    <>
      <Header title={currentProject.name} subtitle={currentProject.description}>
        <OnlineUsers users={onlineUsers} />
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
          {tasks.length} tasks · {currentProject.members?.length || 1} members
        </span>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowMemberModal(true)}
        >
          👥 Add Member
        </button>
      </Header>

      <div className="page-content">
        <Board
          project={currentProject}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
          emitTaskMove={emitTaskMove}
        />
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => dispatch(setSelectedTask(null))}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
        onAddComment={handleCommentAdd}
        projectMembers={currentProject.members}
      />

      {/* Add Member Modal with Autocomplete */}
      <AddMemberModal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        onAddMember={handleAddMember}
        existingMemberIds={existingMemberIds}
      />
    </>
  );
};

export default ProjectBoardPage;
