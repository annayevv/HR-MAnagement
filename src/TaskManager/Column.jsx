import React from "react";
import TaskCard from "./taskCard";
import { useDrop } from "react-dnd";
import styles from "./Board.module.scss";

const Column = ({ tasks, onEdit, onDelete, onDrop, column }) => {
  const [{ isOver }, drop] = useDrop({
    accept: "task",
    drop: (item) => {
      onDrop(item.id, column);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const columnColorsMap = {
    Open: "rgba(193, 232, 65, 0.3)",
    InProgress: "rgba(203, 93, 0, 0.3)",
    Testing: "rgba(66, 59, 245, 0.3)",
    completed: "rgba(19, 133, 101, 0.3)",
  };

  return (
    <div
      ref={drop}
      style={{
        minHeight: "100%",
        backgroundColor: isOver ? "rgba(0,0,0,0.05)" : "transparent",
        padding: "10px",
        borderRadius: "4px",
        transition: "background-color 0.2s",
      }}
    >
      <div className={styles.columnContent}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            backgroundColor={columnColorsMap[column] || "white"}
          />
        ))}
      </div>
    </div>
  );
};

export default Column;
