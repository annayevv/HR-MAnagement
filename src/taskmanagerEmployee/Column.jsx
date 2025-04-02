import React from "react";
import { Card } from "antd";
import TaskCardEmp from "./taskCard";
import { useDrop } from "react-dnd";
import styles from "./EmployeeBoard.module.scss";

const Column = ({ tasks, onEdit, onDelete, onDrop, column }) => {
  const [, drop] = useDrop({
    accept: "task",
    drop: (item) => {
      onDrop(item.id, column);
    },
  });

  const columnColorsMap = {
    open: "#F53B3B1A",
    inprogress: "#CB5D001A",
    testing: "#423BF51A",
    completed: "#1385651A",
  };

  return (
    <Card className={styles.column} ref={drop}>
      {tasks.map((task) => (
        <TaskCardEmp
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          backgroundColor={columnColorsMap[column] || "white"}
        />
      ))}
    </Card>
  );
};

export default Column;
