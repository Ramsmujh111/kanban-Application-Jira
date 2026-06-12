import { Draggable } from '@hello-pangea/dnd';
import Avatar from '../common/Avatar';
import { formatDueDate, isDueDateOverdue, LABEL_COLORS } from '../../utils/constants';

const TaskCard = ({ task, index, onClick }) => {
  const isOverdue = isDueDateOverdue(task.dueDate);

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
          onClick={() => onClick(task)}
        >
          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="task-card-labels">
              {task.labels.map((label, i) => {
                const labelConfig = LABEL_COLORS.find((l) => l.name === label) || LABEL_COLORS[i % LABEL_COLORS.length];
                return (
                  <span
                    key={label}
                    className="task-label"
                    style={{
                      background: labelConfig.bg,
                      color: labelConfig.color,
                    }}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Title */}
          <div className="task-card-title">{task.title}</div>

          {/* Description */}
          {task.description && (
            <div className="task-card-description">{task.description}</div>
          )}

          {/* Footer */}
          <div className="task-card-footer">
            <div className="task-card-meta">
              {/* Priority */}
              <span className={`task-card-priority ${task.priority}`}>
                {task.priority}
              </span>

              {/* Due Date */}
              {task.dueDate && (
                <span className={`task-card-due ${isOverdue ? 'overdue' : ''}`}>
                  📅 {formatDueDate(task.dueDate)}
                </span>
              )}

              {/* Comments Count */}
              {task.comments && task.comments.length > 0 && (
                <span className="task-card-comments">
                  💬 {task.comments.length}
                </span>
              )}
            </div>

            {/* Assignee */}
            {task.assignee && (
              <Avatar name={task.assignee.name} size="sm" />
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
