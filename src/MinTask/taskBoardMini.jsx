/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import styles from "./task.module.scss";
import api from "../api/apifor";
import { useNavigate } from "react-router-dom";
const TaskMini2 = () => {
const [taskStats, setTaskStats] = useState({
  total: 0,
  tasks: 0,
  testing: 0,
  inProgress: 0,
  completed: 0,
});

const [loading, setLoading] = useState(false); 
const [error, setError] = useState(null); 
const navigate = useNavigate();

  const transformApiDataToChartData = (data) => {
    let total = data.length;
    let tasks = data.filter((task) => task.status === "open").length;
    let testing = data.filter((task) => task.status === "testing").length;
    let inProgress = data.filter((task) => task.status === "inprogress").length;
    let completed = data.filter((task) => task.status === "completed").length;

    return { total, tasks, testing, inProgress, completed };
  };

  const fetchTask = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("v1/task");

      if (response.data.status) {
        const formattedData = transformApiDataToChartData(response.data.data);
        setTaskStats(formattedData);
      }
    } catch (error) {
      console.error("Error fetching task statistics:", error);
      setError("Failed to load task statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, []);

  const handleViewTask = (productId) => {
    navigate(`/oraz/TaskManager`);
  };

  return (
    <>
      <div className={styles.miniBoardContain}>
        <div
          className={styles.row}
          style={{ justifyContent: "space-between", marginBottom: "20px" }}
        >
          Total Tasks {taskStats.total}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            onClick={handleViewTask}
          >
            <path
              d="M2.83202 1.5C2.0036 1.5 1.33203 2.17157 1.33203 3V10C1.33203 10.8284 2.0036 11.5 2.83202 11.5H9.83199C10.6604 11.5 11.332 10.8284 11.332 10V7.76923C11.332 7.49309 11.5558 7.26923 11.832 7.26923C12.1081 7.26923 12.332 7.49309 12.332 7.76923V10C12.332 11.3807 11.2127 12.5 9.83199 12.5H2.83202C1.45131 12.5 0.332031 11.3807 0.332031 10V3C0.332031 1.61929 1.45132 0.5 2.83202 0.5H5.06278C5.33892 0.5 5.56278 0.723858 5.56278 1C5.56278 1.27614 5.33892 1.5 5.06278 1.5H2.83202ZM7.10129 1C7.10129 0.723858 7.32514 0.5 7.60128 0.5H11.832C12.1082 0.5 12.332 0.723858 12.332 1V5.23077C12.332 5.50691 12.1082 5.73077 11.832 5.73077C11.5559 5.73077 11.332 5.50691 11.332 5.23077V2.20711L7.95484 5.58433C7.75957 5.77959 7.44299 5.77959 7.24773 5.58433C7.05247 5.38906 7.05247 5.07248 7.24773 4.87722L10.6249 1.5H7.60128C7.32514 1.5 7.10129 1.27614 7.10129 1Z"
              fill="#8A8C98"
            />
          </svg>
        </div>
        <div className={styles.row}>
          <div
            className={styles.cart}
            style={{ backgroundColor: "rgba(193, 232, 65, 0.2)" }}
          >
            Tasks {taskStats.tasks}
          </div>
          <div
            className={styles.cart}
            style={{ backgroundColor: "rgba(66, 59, 245, 0.2)" }}
          >
            Testing {taskStats.testing}
          </div>
        </div>
        <div>
          <div className={styles.row}>
            <div
              className={styles.cart}
              style={{ backgroundColor: "rgba(203, 93, 0, 0.2)" }}
            >
              Inprogress {taskStats.inProgress}
            </div>
            <div
              className={styles.cart}
              style={{ backgroundColor: "rgba(19, 133, 101, 0.2)" }}
            >
              Completed {taskStats.completed}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskMini2;
