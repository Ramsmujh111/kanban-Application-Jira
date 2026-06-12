import { DragDropContext } from '@hello-pangea/dnd';
import { useSelector, useDispatch } from 'react-redux';
import Column from './Column';
import { setTasks } from '../../store/taskSlice';

const Board = ({ project, onTaskClick, onAddTask, emitTaskMove }) => {
  const { tasks } = useSelector((state) => state.tasks);
  const dispatch = useDispatch();

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // No destination = dropped outside
    if (!destination) return;

    // No change
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Optimistic update: move the task in local state immediately
    const task = tasks.find((t) => t._id === draggableId);
    if (task) {
      const updatedTasks = tasks.map((t) => {
        if (t._id === draggableId) {
          return { ...t, column: destination.droppableId, order: destination.index };
        }
        return t;
      });

      // Reorder tasks in destination column
      const destColumnTasks = updatedTasks
        .filter((t) => t.column === destination.droppableId && t._id !== draggableId)
        .sort((a, b) => a.order - b.order);

      destColumnTasks.splice(destination.index, 0, {
        ...task,
        column: destination.droppableId,
        order: destination.index,
      });

      const reorderedDest = destColumnTasks.map((t, i) => ({ ...t, order: i }));

      let reorderedSource = [];
      if (source.droppableId !== destination.droppableId) {
        const srcColumnTasks = updatedTasks
          .filter((t) => t.column === source.droppableId && t._id !== draggableId)
          .sort((a, b) => a.order - b.order);
        reorderedSource = srcColumnTasks.map((t, i) => ({ ...t, order: i }));
      }

      const affectedColumnIds = new Set([source.droppableId, destination.droppableId]);
      const unaffectedTasks = tasks.filter(
        (t) => !affectedColumnIds.has(t.column) && t._id !== draggableId
      );
      const finalTasks = [...unaffectedTasks, ...reorderedDest, ...reorderedSource];

      // Dispatch optimistic update to Redux store
      dispatch(setTasks(finalTasks));
    }

    // Emit via socket for server persistence + broadcasting
    emitTaskMove(draggableId, destination.droppableId, destination.index);
  };

  if (!project?.columns) return null;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="board-container">
        {[...project.columns]
          .sort((a, b) => a.order - b.order)
          .map((column, index) => {
            const columnTasks = tasks
              .filter((t) => t.column === column.id)
              .sort((a, b) => a.order - b.order);

            return (
              <Column
                key={column.id}
                column={column}
                tasks={columnTasks}
                colIndex={index}
                onTaskClick={onTaskClick}
                onAddTask={onAddTask}
              />
            );
          })}
      </div>
    </DragDropContext>
  );
};

export default Board;
