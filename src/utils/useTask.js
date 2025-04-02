import { useState } from "react";
import { message } from "antd";
import api from "../api/apifor";

const useTasks = () => {
  const [tasks, setTasks] = useState({
    open: [],
    inprogress: [],
    testing: [],
    completed: [],
  });
  const [hasMore, setHasMore] = useState({
    open: true,
    inprogress: true,
    testing: true,
    completed: true,
  });
  const [page, setPage] = useState({
    open: 0,
    inprogress: 0,
    testing: 0,
    completed: 0,
  });
  const itemsPerPage = 7;

  const fetchTasks = async () => {
    try {
      const response = await api.get("v1/task");
      const tasksByStatus = response.data.data.reduce((acc, task) => {
        const status = task.status.toLowerCase();
        if (!acc[status]) acc[status] = [];
        acc[status].push(task);
        return acc;
      }, {});

      setTasks((prevTasks) => ({
        ...prevTasks,
        ...tasksByStatus,
      }));
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchMoreTasks = async (status) => {
    try {
      const nextPage = page[status] + 1;
      const response = await api.get(
        `v1/task?status=${status}&page=${nextPage}&limit=${itemsPerPage}`
      );
      const newTasks = response.data.data;

      if (!Array.isArray(newTasks)) {
        throw new Error("Fetched tasks are not in array format");
      }

      setTasks((prevTasks) => ({
        ...prevTasks,
        [status]: [...prevTasks[status], ...newTasks],
      }));
      setPage((prevPage) => ({ ...prevPage, [status]: nextPage }));
      setHasMore((prevHasMore) => ({
        ...prevHasMore,
        [status]: newTasks.length === itemsPerPage,
      }));
    } catch (error) {
      console.error("Error fetching more tasks:", error);
    }
  };

  const createTask = async (task, fileList) => {
    if (!validateTask(task)) return;

    try {
      const formData = new FormData();
      appendTaskData(formData, task, fileList);

      const response = await api.post("v1/task", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.status === true) {
        // Make sure we get the newly created task from the response
        const newTask = response.data.data;
        // Extract the status from the newly created task
        const status = newTask.status ? newTask.status.toLowerCase() : "open";

        // Update the tasks state with the new task in the appropriate status column
        setTasks((prevTasks) => ({
          ...prevTasks,
          [status]: [...(prevTasks[status] || []), newTask],
        }));

        message.success("Task created successfully!");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Error creating task:", error.response?.data || error);
      message.error(
        error.response?.data?.message ||
          error.message ||
          "Error creating the task."
      );
    }
  };

  const updateTask = async (taskId, task, fileList) => {
    try {
      const formData = new FormData();
      appendTaskData(formData, task, fileList);

      const response = await api.patch(`v1/task/${taskId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Get the updated task from the response
      const updatedTask = response.data.data || response.data;
      // Get the status from the updated task
      const status = updatedTask.status
        ? updatedTask.status.toLowerCase()
        : "open";

      setTasks((prevTasks) => {
        // Find which status column currently contains the task
        const currentStatus = Object.keys(prevTasks).find((key) =>
          prevTasks[key].some((t) => t.id === taskId)
        );

        if (currentStatus === status) {
          // If the status hasn't changed, just update the task in its current column
          return {
            ...prevTasks,
            [status]: prevTasks[status].map((t) =>
              t.id === taskId ? { ...t, ...updatedTask } : t
            ),
          };
        } else {
          // If the status has changed, remove from old column and add to new column
          return {
            ...prevTasks,
            [currentStatus]: prevTasks[currentStatus].filter(
              (t) => t.id !== taskId
            ),
            [status]: [...(prevTasks[status] || []), updatedTask],
          };
        }
      });

      message.success("Task updated successfully!");
    } catch (error) {
      console.error(
        "Error updating task:",
        error.response ? error.response.data : error
      );
      message.error("Error updating the task.");
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`v1/task/${id}`);
      setTasks((prevTasks) => {
        const status = Object.keys(prevTasks).find((key) =>
          prevTasks[key].some((task) => task.id === id)
        );
        return {
          ...prevTasks,
          [status]: prevTasks[status].filter((task) => task.id !== id),
        };
      });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const updateTaskStatus = async (itemId, targetColumn) => {
    try {
      const sourceStatus = Object.keys(tasks).find((status) =>
        tasks[status].some((task) => task.id === itemId)
      );

      if (!sourceStatus) {
        throw new Error("Task not found");
      }

      const taskToMove = tasks[sourceStatus].find((task) => task.id === itemId);
      if (!taskToMove) {
        throw new Error("Task not found");
      }

      // Optimistically update the UI
      setTasks((prevTasks) => ({
        ...prevTasks,
        [sourceStatus]: prevTasks[sourceStatus].filter(
          (task) => task.id !== itemId
        ),
        [targetColumn.toLowerCase()]: [
          ...prevTasks[targetColumn.toLowerCase()],
          {
            ...taskToMove,
            status: targetColumn.toLowerCase(),
          },
        ],
      }));

      const updatedData = {
        status: targetColumn.toLowerCase(),
        completed_at:
          targetColumn === "Completed" ? new Date().toISOString() : null,
      };

      const response = await api.patch(`v1/task/${itemId}`, updatedData);

      if (!response.data.status) {
        // If the API call fails, revert the changes
        setTasks((prevTasks) => ({
          ...prevTasks,
          [sourceStatus]: [...prevTasks[sourceStatus], taskToMove],
          [targetColumn.toLowerCase()]: prevTasks[
            targetColumn.toLowerCase()
          ].filter((task) => task.id !== itemId),
        }));
        throw new Error("Failed to update task status");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      message.error("Failed to move task");
    }
  };

  const validateTask = (task) => {
    const { title, question, answer_user_id, due_date, question_file } = task;

    if (!title.trim() || !question.trim()) {
      message.error("Title and question cannot be empty or only spaces.");
      return false;
    }
    if (!answer_user_id || !due_date) {
      message.error("Please select an assigned user and due date.");
      return false;
    }
    if (question_file) {
      const validFileTypes = [
        "doc",
        "docx",
        "ppt",
        "pptx",
        "png",
        "jpg",
        "jpeg",
      ];
      const fileExtension = question_file.name.split(".").pop().toLowerCase();
      if (!validFileTypes.includes(fileExtension)) {
        message.error(
          "Invalid file type. Only doc, docx, ppt, pptx, png, jpg, jpeg are allowed."
        );
        return false;
      }
      if (question_file.size > 5 * 1024 * 1024) {
        message.error("File size exceeds 5 MB.");
        return false;
      }
    }
    return true;
  };

  const appendTaskData = (formData, task, fileList) => {
    for (const key in task) {
      if (task[key]) {
        formData.append(key, task[key]);
      }
    }
    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("question_file", fileList[0].originFileObj);
    }
  };

  return {
    tasks,
    setTasks,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    fetchMoreTasks,
    hasMore,
  };
};

export default useTasks;
