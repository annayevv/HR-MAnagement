import React, { useState } from "react";
import { Card} from "antd";
import { useDrag } from "react-dnd";
import TaskDetailModal from "../taskDetail/index";
import styles from "./TaskCardEmpl.module.scss";

const TaskCard = ({ task, onDelete, onEdit, backgroundColor }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [{ isDragging }, drag] = useDrag({
    type: "task",
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const truncatedTitle =
    task.title.length > 25 ? `${task.title.slice(0, 25)}...` : task.title;

  const isPastDue =
    new Date(task.due_date) < new Date() && task.status !== "completed";

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <Card className={styles.taskCard} style={{ backgroundColor }}>
        <div className={styles.container}>
          <div className={styles.content}>
            <h3 onClick={handleOpenModal}>{truncatedTitle}</h3>
            <p className={styles.answer}> {task.answer_user_name}</p>
            <div className={styles.down}>
              <p
                style={{
                  color: isPastDue ? "#dd2b0e" : "#C9C9C9",
                  fontWeight: "normal",
                }}
              >
                <svg
                  width="10"
                  height="11"
                  viewBox="0 0 10 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 5C2 4.72386 2.22386 4.5 2.5 4.5C2.77614 4.5 3 4.72386 3 5C3 5.27614 2.77614 5.5 2.5 5.5C2.22386 5.5 2 5.27614 2 5ZM2.5 6.5C2.22386 6.5 2 6.72386 2 7C2 7.27614 2.22386 7.5 2.5 7.5C2.77614 7.5 3 7.27614 3 7C3 6.72386 2.77614 6.5 2.5 6.5ZM4 5C4 4.72386 4.22386 4.5 4.5 4.5C4.77614 4.5 5 4.72386 5 5C5 5.27614 4.77614 5.5 4.5 5.5C4.22386 5.5 4 5.27614 4 5ZM4.5 6.5C4.22386 6.5 4 6.72386 4 7C4 7.27614 4.22386 7.5 4.5 7.5C4.77614 7.5 5 7.27614 5 7C5 6.72386 4.77614 6.5 4.5 6.5ZM6 5C6 4.72386 6.22386 4.5 6.5 4.5C6.77614 4.5 7 4.72386 7 5C7 5.27614 6.77614 5.5 6.5 5.5C6.22386 5.5 6 5.27614 6 5ZM0 3C0 1.61929 1.11929 0.5 2.5 0.5H7.5C8.88071 0.5 10 1.61929 10 3V8C10 9.38071 8.88071 10.5 7.5 10.5H2.5C1.11929 10.5 0 9.38071 0 8V3ZM2.5 1.5C1.84689 1.5 1.29127 1.9174 1.08535 2.5H8.91465C8.70873 1.9174 8.15311 1.5 7.5 1.5H2.5ZM9 3.5H1V8C1 8.82843 1.67157 9.5 2.5 9.5H7.5C8.32843 9.5 9 8.82843 9 8V3.5Z"
                    fill="#C9C9C9"
                  />
                </svg>

                {task.due_date}
              </p>
            </div>
          </div>
        </div>
      </Card>
      <TaskDetailModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        taskId={task.id}
      />
    </div>
  );
};

export default TaskCard;
