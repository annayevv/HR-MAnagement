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
import classNames from "classnames";
import docx from "../assets/dox.png";
import useTasks from "../utils/useTask.js";
import useEmployees from "../utils/useEmployees.js";
import InfiniteScroll from "react-infinite-scroll-component";
import moment from "moment";

const Board = () => {
  const {
    tasks,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    fetchMoreTasks,
    hasMore,
  } = useTasks();
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

  const columns = ["Open", "InProgress", "Testing", "completed"];

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const openModal = (task = null) => {
    if (task) {
      setNewTask({
        title: task.title || "",
        question: task.question || "",
        answer: task.answer || "",
        due_date: task.due_date || "",
        answer_user_id: task.answer_user || "",
      });
      setIsEdit(true);
      setCurrentTask(task);
    } else {
      resetNewTask();
      setIsEdit(false);
      setCurrentTask(null);
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
      answer_user_id: "",
      question_file: null,
    });
  };

  const handleSaveTask = async () => {
    if (isEdit) {
      await updateTask(currentTask.id, newTask, fileList);
    } else {
      await createTask(newTask, fileList);
    }
    closeModal();
  };

  const handleDeleteTask = async (id) => {
    await deleteTask(id);
  };

  const handleDragEnd = async (itemId, targetColumn) => {
    try {
      const task = Object.values(tasks)
        .flat()
        .find((t) => t.id === itemId);
      if (task && task.status.toLowerCase() === targetColumn.toLowerCase()) {
        return;
      }
      await updateTaskStatus(itemId, targetColumn);
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
          const columnTasks = tasks[column.toLowerCase()];

          return (
            <Col span={6} key={column}>
              <div
                className={classNames(styles.columnHeader, {
                  [styles.open]: column === "Open",
                  [styles.inProgress]: column === "InProgress",
                  [styles.testing]: column === "Testing",
                  [styles.completed]: column === "completed",
                })}
              >
                <div>
                  <h2>
                    <div></div>
                    {column}
                  </h2>
                  <span>{columnTasks.length}</span>
                </div>
                <div className={styles.columnHeaderRight}>
                  {column === "Open" && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined style={{ color: "#ffffff" }} />}
                      onClick={() => openModal()}
                      style={{
                        borderRadius: "99px",
                        backgroundColor: "rgba(193, 232, 65, 0.5)",
                      }}
                    />
                  )}
                </div>
              </div>
              <div
                className={classNames(styles.column, {
                  [styles.open]: column === "Open",
                  [styles.inProgress]: column === "InProgress",
                  [styles.testing]: column === "Testing",
                  [styles.completed]: column === "completed",
                })}
              >
                <div
                  id={`scrollable-${column.toLowerCase()}`}
                  className={styles.columnScrollContainer}
                  style={{ height: "680px", overflowY: "auto" }}
                >
                  <InfiniteScroll
                    className={styles.columnScrollContainer}
                    height={650}
                    dataLength={columnTasks.length}
                    next={() => fetchMoreTasks(column.toLowerCase())}
                    hasMore={hasMore[column.toLowerCase()]}
                    loader={<div className={styles.loader}></div>}
                    endMessage={
                      <p style={{ textAlign: "center", padding: "10px" }}>
                        No more tasks
                      </p>
                    }
                    scrollableTarget={`scrollable-${column.toLowerCase()}`}
                    scrollThreshold={0.8}
                    style={{ overflow: "visible" }} // This is important
                  >
                    <Column
                      tasks={columnTasks}
                      onEdit={(task) => openModal(task)}
                      onDelete={handleDeleteTask}
                      onDrop={handleDragEnd}
                      column={column}
                      className={classNames(styles.column, {
                        [styles.open]: column === "Open",
                        [styles.inProgress]: column === "InProgress",
                        [styles.testing]: column === "Testing",
                        [styles.completed]: column === "completed",
                      })}
                    />
                  </InfiniteScroll>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      <Modal
        title={isEdit ? "Edit Task" : ""}
        open={isModalVisible}
        onOk={handleSaveTask}
        onCancel={closeModal}
        footer={[
          <Button
            key="submit"
            type="primary"
            style={{ background: "#138565" }}
            onClick={handleSaveTask}
          >
            {isEdit ? "Save" : "Add"}
          </Button>,
        ]}
      >
        <Input
          name="title"
          placeholder="Task Title"
          value={newTask.title}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, title: e.target.value }))
          }
          className={styles.modalInputs}
          style={{ marginTop: "30px" }}
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
