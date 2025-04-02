/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Button,
  Modal,
  Input,
  Upload,
  Select,
  message,
  List,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  CloseOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import Column from "./Column";
import styles from "./Board.module.scss";
import api from "../api/apifor.js";
import classNames from "classnames";
import docx from "../assets/dox.png";
import useTasks from "../utils/useTask.js";
import useEmployees from "../utils/useEmployees.js";
import { useParams } from "react-router-dom";
import moment from "moment";

const Board = () => {
  const { createTask, updateTask, deleteTask, updateTaskStatus } = useTasks();
  const { employees, fetchEmployees } = useEmployees();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    question: "",
    answer: "",
    due_date: "",
    status: "open",
    answer_user_id: "",
    question_file: null,
  });
  const { id } = useParams();
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [employeeTasks, setEmployeeTasks] = useState({
    open: [],
    inprogress: [],
    testing: [],
    completed: [],
  });

  const columns = ["open", "inprogress", "testing", "completed"];

  useEffect(() => {
    fetchEmployees();

    // If id exists, fetch employee data
    if (id) {
      loadEmployeeData();
    }
  }, [id]);

  // Fetch employee data and organize tasks by status
  const loadEmployeeData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`v1/employee/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const employeeData = response.data.data;
      setCurrentEmployee(employeeData);

      // If employee has tasks, organize them by status
      if (
        employeeData &&
        employeeData.task &&
        Array.isArray(employeeData.task)
      ) {
        const tasksByStatus = {
          open: [],
          inprogress: [],
          testing: [],
          completed: [],
        };

        employeeData.task.forEach((task) => {
          const status = task.status?.toLowerCase() || "open";
          if (tasksByStatus[status]) {
            tasksByStatus[status].push(task);
          } else {
            tasksByStatus.open.push(task);
          }
        });

        setEmployeeTasks(tasksByStatus);
      }

      // Set default answer_user_id if available
      if (employeeData && employeeData.user_id) {
        setNewTask((prev) => ({
          ...prev,
          answer_user_id: employeeData.user_id,
        }));
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
      message.error("Failed to load employee data");
    }
  };

  const openModal = (task = null) => {
    if (task) {
      setNewTask({
        title: task.title || "",
        question: task.question || "",
        answer: task.answer || "",
        due_date: task.due_date || "",
        answer_user_id: task.answer_user_id || "",
      });
      setIsEdit(true);
      setCurrentTask(task);
    } else {
      resetNewTask();
      setIsEdit(false);
      setCurrentTask(null);

      if (currentEmployee && currentEmployee.user_id) {
        setNewTask((prev) => ({
          ...prev,
          answer_user_id: currentEmployee.user_id,
        }));
      }
    }
    setIsModalVisible(true);
  };

  const closeModal = () => setIsModalVisible(false);

  const resetNewTask = () => {
    setNewTask({
      title: "",
      question: "",
      answer: "",
      due_date: "",
      status: "open",
      answer_user_id: currentEmployee?.user_id || "",
      question_file: null,
    });
    setFileList([]);
  };

  const handleSaveTask = async () => {
    try {
      if (isEdit) {
        await updateTask(currentTask.id, newTask, fileList);
      } else {
        await createTask(newTask, fileList);
      }
      closeModal();
      // Refresh employee data to get updated tasks
      await loadEmployeeData();
    } catch (error) {
      console.error("Error saving task:", error);
      message.error("Failed to save task");
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteTask(id);
      // Refresh employee data to get updated tasks
      await loadEmployeeData();
    } catch (error) {
      console.error("Error deleting task:", error);
      message.error("Failed to delete task");
    }
  };

  const handleDragEnd = async (itemId, targetColumn) => {
    try {
      await updateTaskStatus(itemId, targetColumn);
      // Refresh employee data to get updated tasks
      await loadEmployeeData();
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleUpload = (file) => {
    const newFile = {
      uid: file.uid,
      name: file.name,
      type: file.type,
      thumbUrl: getIconForFile(file.type),
      originFileObj: file,
    };
    setFileList([newFile]);
    setNewTask((prev) => ({ ...prev, question_file: file }));
    return false;
  };

  const getIconForFile = (fileType) => {
    switch (fileType) {
      case "application/pdf":
        return "/icons/pdf-icon.png";
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return docx;
      case "image/png":
        return "/icons/png-icon.png";
      default:
        return "/icons/default-file-icon.png";
    }
  };

  const handleRemoveFile = (file) => {
    setFileList((prevList) => prevList.filter((item) => item.uid !== file.uid));
    setNewTask((prev) => ({ ...prev, question_file: null }));
  };

  return (
    <div className={styles.board}>
      <Row gutter={16}>
        {columns.map((column) => {
          const columnTasks = employeeTasks[column] || [];
          const taskCount = columnTasks.length;

          return (
            <Col span={6} key={column}>
              <div
                className={classNames(styles.columnHeader, {
                  [styles.open]: column === "open",
                  [styles.inProgress]: column === "inprogress",
                  [styles.testing]: column === "testing",
                  [styles.completed]: column === "completed",
                })}
              >
                <h2>
                  {column.charAt(0).toUpperCase() + column.slice(1)} /{" "}
                  <span>{taskCount}</span>
                </h2>
                <div className={styles.columnHeaderRight}>
                  {column === "open" && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined style={{ color: "#E84141" }} />}
                      onClick={() => openModal()}
                      style={{ borderRadius: "99px", backgroundColor: "#fff" }}
                    />
                  )}
                </div>
              </div>
              <div className={styles.columnScrollContainer}>
                <Column
                  tasks={columnTasks}
                  onEdit={(task) => openModal(task)}
                  onDelete={handleDeleteTask}
                  onDrop={handleDragEnd}
                  column={column}
                />
              </div>
            </Col>
          );
        })}
      </Row>

      <Modal
        title={isEdit ? "Edit Task" : "New Task"}
        open={isModalVisible}
        onOk={handleSaveTask}
        onCancel={closeModal}
      >
        <Input
          name="title"
          placeholder="Task Title"
          value={newTask.title}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, title: e.target.value }))
          }
          className={styles.modalInputs}
        />
        <Input.TextArea
          name="question"
          placeholder="Question"
          value={newTask.question}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, question: e.target.value }))
          }
          className={styles.modalInputs}
        />
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          {/* <Input
            name="due_date"
            type="date"
            format="YYYY-MM-DD"
            value={newTask.due_date}
            onChange={(e) =>
              setNewTask((prev) => ({ ...prev, due_date: e.target.value }))
            }
            className={styles.modalInputs}
            style={{ marginBottom: "0px" }}
          /> */}
          <DatePicker
            value={newTask.due_date ? moment(newTask.due_date) : null}
            onChange={(date, dateString) =>
              setNewTask((prev) => ({ ...prev, due_date: dateString }))
            }
            format="YYYY-MM-DD"
            suffixIcon={<CalendarOutlined />}
            style={{ width: "100%" }}
          />
          <Select
            dropdownClassName="custom-select-dropdown"
            placeholder="Select Assigned User"
            value={newTask.answer_user_id || undefined}
            onChange={(value) =>
              setNewTask((prev) => ({ ...prev, answer_user_id: value }))
            }
            style={{ width: "100%", height: "33px" }}
            options={employees.map((employee) => ({
              label: employee.first_name,
              value: employee.id,
            }))}
            disabled={
              !currentEmployee || !currentEmployee.user_id ? true : false
            }
          />
        </div>
        <Upload
          beforeUpload={(file) => handleUpload(file)}
          maxCount={1}
          listType="picture"
          fileList={fileList}
          showUploadList={{
            showRemoveIcon: true,
            removeIcon: (
              <CloseOutlined style={{ color: "#fff", width: "8px" }} />
            ),
          }}
          onRemove={handleRemoveFile}
        >
          <Button icon={<UploadOutlined />}>Upload Question File</Button>
        </Upload>
        {fileList.length > 0 && (
          <List
            style={{ marginTop: "20px", height: "36px" }}
            dataSource={fileList}
            renderItem={(file) => (
              <List.Item>
                {" "}
                <button></button>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};

export default Board;
