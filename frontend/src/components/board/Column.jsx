import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { COLUMN_COLORS } from '../../utils/constants';

const Column = ({ column, tasks, colIndex, onTaskClick, onAddTask }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(column.id, newTaskTitle.trim());
    setNewTaskTitle('');
    setShowAddForm(false);
  };

  const dotColor = COLUMN_COLORS[colIndex % Object.keys(COLUMN_COLORS).length];

  return (
    <div className="board-column">
      <div className="column-header">
        <div className="column-title-group">
          <span className="column-dot" style={{ backgroundColor: dotColor }} />
          <span className="column-title">{column.title}</span>
          <span className="column-count">{tasks.length}</span>
        </div>
        <button
          className="column-add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          title="Add task"
        >
          +
        </button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="add-task-form">
          <form onSubmit={handleAddTask}>
            <input
              className="input"
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              autoFocus
            />
            <div className="add-task-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewTaskTitle('');
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!newTaskTitle.trim()}
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Droppable Task List */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`column-tasks ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task._id}
                task={task}
                index={index}
                onClick={onTaskClick}
              />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !showAddForm && (
              <div style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: 'var(--text-tertiary)',
                fontSize: 'var(--font-size-sm)',
              }}>
                No tasks yet
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Column;
