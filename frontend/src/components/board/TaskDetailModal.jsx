import { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { formatDate, LABEL_COLORS, PRIORITY_COLORS } from '../../utils/constants';

const TaskDetailModal = ({ task, isOpen, onClose, onUpdate, onDelete, onAddComment, projectMembers }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setAssignee(task.assignee?._id || '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    }
  }, [task]);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [task?.comments?.length]);

  if (!task) return null;

  const handleSave = () => {
    const changes = {};
    if (title !== task.title) changes.title = title;
    if (description !== task.description) changes.description = description;
    if (priority !== task.priority) changes.priority = priority;
    if (assignee !== (task.assignee?._id || '')) changes.assignee = assignee || null;
    if (dueDate !== (task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '')) {
      changes.dueDate = dueDate ? new Date(dueDate).toISOString() : null;
    }

    if (Object.keys(changes).length > 0) {
      onUpdate(task._id, changes);
    }
    setIsEditing(false);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(task._id, commentText.trim());
    setCommentText('');
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task._id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (isEditing) handleSave();
        onClose();
      }}
      title=""
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            🗑 Delete Task
          </button>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {isEditing && (
              <button className="btn btn-primary" onClick={handleSave}>
                Save Changes
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="task-detail">
        <div className="task-detail-main">
          {/* Title */}
          <input
            className="task-detail-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsEditing(true);
            }}
            placeholder="Task title"
          />

          {/* Description */}
          <div className="task-detail-field">
            <span className="task-detail-field-label">Description</span>
            <textarea
              className="task-detail-description input"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setIsEditing(true);
              }}
              placeholder="Add a description..."
              rows={4}
            />
          </div>

          {/* Comments */}
          <div className="comments-section">
            <h3 className="comments-title">
              💬 Comments ({task.comments?.length || 0})
            </h3>

            <div className="comments-list">
              {task.comments?.map((comment, index) => (
                <div key={comment._id || index} className="comment-item">
                  <Avatar name={comment.user?.name || 'User'} size="sm" />
                  <div className="comment-content">
                    <span className="comment-author">
                      {comment.user?.name || 'User'}
                    </span>
                    <span className="comment-time">
                      {formatDate(comment.createdAt)}
                    </span>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            <form className="comment-input-group" onSubmit={handleAddComment}>
              <input
                className="input"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!commentText.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="task-detail-sidebar">
          <div className="task-detail-field">
            <span className="task-detail-field-label">Priority</span>
            <select
              className="input"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setIsEditing(true);
              }}
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🟠 High</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>

          <div className="task-detail-field">
            <span className="task-detail-field-label">Assignee</span>
            <select
              className="input"
              value={assignee}
              onChange={(e) => {
                setAssignee(e.target.value);
                setIsEditing(true);
              }}
            >
              <option value="">Unassigned</option>
              {projectMembers?.map((member) => (
                <option key={member.user?._id} value={member.user?._id}>
                  {member.user?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="task-detail-field">
            <span className="task-detail-field-label">Due Date</span>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                setIsEditing(true);
              }}
            />
          </div>

          <div className="task-detail-field">
            <span className="task-detail-field-label">Created</span>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              {formatDate(task.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
