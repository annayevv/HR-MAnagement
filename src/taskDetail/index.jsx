/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  Button,
  message,
  Upload,
  Row,
  Col,
  Modal,
  Popconfirm,
} from "antd";
import {
  UploadOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import api from "../api/apifor";
import moment from "moment";
import docx from "../assets/dox.png";
import styles from "./taskDetail.module.scss"; // Import your styles here

const TaskDetailModal = ({ visible, onClose, taskId }) => {
  const [form] = Form.useForm();
  const [task, setTask] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [isAnswerChanged, setIsAnswerChanged] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchTask(taskId);
    }
  }, [taskId]);

  const fetchTask = async (taskId) => {
    try {
      setLoading(true);
      const response = await api.get(`v1/task/${taskId}/`);
      const taskData = response.data.data;
      setTask(taskData);
      form.setFieldsValue({
        ...taskData,
        due_date: taskData.due_date ? moment(taskData.due_date) : undefined,
        completed_at: taskData.completed_at
          ? moment(taskData.completed_at).format("YYYY-MM-DD")
          : "",
      });
    } catch (error) {
      message.error("Failed to load task data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();

      Object.keys(task).forEach((key) => {
        const value = values[key] !== undefined ? values[key] : task[key];
        if (value !== null && value !== undefined) {
          if (key === "due_date" && moment.isMoment(value)) {
            formData.append(key, value.format("YYYY-MM-DD"));
          } else if (key === "answer_file" && value.file) {
            formData.append(key, value.file);
          } else if (key !== "question_file") {
            formData.append(key, value);
          }
        } else {
          formData.append(key, "");
        }
      });

      const response = await api.patch(`v1/task/${taskId}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        message.success("Task updated successfully.");
        setTask(response.data.data);
        setEditMode(false);
        setIsAnswerChanged(false);
      }
    } catch (error) {
      message.error("Failed to update task.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveQuestionFile = () => {
    form.setFieldsValue({ question_file: null });
    setTask((prevTask) => ({ ...prevTask, question_file: null }));
  };

  const handleQuestionUpload = (file) => {
    const allowedTypes = [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    const allowedExtensions = [
      "doc",
      "docx",
      "png",
      "jpg",
      "jpeg",
      "pdf",
      "ppt",
      "pptx",
    ];

    const isAllowedType =
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(fileExtension);

    const isSizeValid = file.size / 1024 / 1024 < 5;

    if (!isAllowedType) {
      message.error(
        "Invalid file type. Only .doc, .docx, .png, .jpg, .jpeg, .pdf, .ppt, .pptx are allowed."
      );
      return false;
    }

    form.setFieldsValue({ question_file: { file } });
    setTask((prevTask) => ({
      ...prevTask,
      question_file: URL.createObjectURL(file),
    }));
    setIsAnswerChanged(true);

    return false;
  };

  const handleUpload = (file) => {
    const allowedTypes = [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    const allowedExtensions = [
      "doc",
      "docx",
      "png",
      "jpg",
      "jpeg",
      "pdf",
      "ppt",
      "pptx",
    ];

    const isAllowedType =
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(fileExtension);

    // eslint-disable-next-line no-unused-vars
    const isSizeValid = file.size / 1024 / 1024 < 5;

    if (!isAllowedType) {
      message.error(
        "Invalid file type. Only .doc, .docx, .png, .jpg, .jpeg, .pdf, .ppt, .pptx are allowed."
      );
      return false;
    }

    setFileList([
      {
        uid: file.uid,
        name: file.name,
        type: file.type,
        thumbUrl: getIconForAnswerFile(file.type),
      },
    ]);
    form.setFieldsValue({ answer_file: { file } });
    setIsAnswerChanged(true);

    return false;
  };

  const handleRemoveFile = (file) => {
    setFileList((prevList) => prevList.filter((item) => item.uid !== file.uid));
    form.setFieldsValue({ answer_file: null });
    setIsAnswerChanged(true);
  };

  const getIconForFile = (fileExtension) => {
    switch (fileExtension) {
      case "pdf":
        return "/icons/pdf-icon.png";
      case "doc":
      case "docx":
        return docx;
      case "png":
        return "/icons/png-icon.png";
      case "jpg":
      case "jpeg":
        return "/icons/jpg-icon.png";
      default:
        return "/icons/default-file-icon.png";
    }
  };

  const getIconForAnswerFile = (fileType) => {
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

  const handleDelete = async () => {
    try {
      await api.delete(`v1/task/${taskId}/`);
      message.success("Task deleted successfully.");
      onClose();
      console.log(taskId);
    } catch (error) {
      message.error("Failed to delete task.");
      console.error(error);
    }
  };

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      className={styles.taskEditorContainer}
    >
      {task && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={task}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "20px",
          }}
          onValuesChange={() => setIsAnswerChanged(true)}
        >
          <div className={styles.formContainerLeft}>
            <Form.Item label="Title" name="title">
              <Input readOnly={!editMode} />
            </Form.Item>

            <Form.Item label="Question" name="question">
              <Input.TextArea readOnly={!editMode} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Assigned To (Answer User)"
                  name="answer_user_name"
                >
                  <Input readOnly={!editMode} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Due Date" name="due_date">
                  <DatePicker
                    disabled={!editMode}
                    style={{ width: "100%", color: "#fff" }}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Question File" name="question_file">
              {task?.question_file ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Button
                    style={{
                      width: editMode ? "calc(100% - 34px)" : "100%",
                      backgroundColor: "#2A2A2A",
                      color: "#8A8C98",
                      padding: "0px 10px",
                      boxSizing: "border-box",
                      display: "flex",
                      justifyContent: "flex-start",
                    }}
                    onClick={() => window.open(task.question_file, "_blank")}
                  >
                    <img
                      src={getIconForFile(
                        task.question_file.split(".").pop().toLowerCase()
                      )}
                      alt="file-icon"
                      style={{ width: "20px", height: "20px" }}
                    />
                    {task.question_file.length > 55
                      ? `${task.question_file.slice(0, 52)}...`
                      : task.question_file}
                  </Button>
                  {editMode && (
                    <CloseOutlined
                      style={{
                        color: "#fff",
                        marginLeft: "8px",
                        cursor: "pointer",
                      }}
                      onClick={handleRemoveQuestionFile}
                    />
                  )}
                </div>
              ) : (
                editMode && (
                  <Upload
                    beforeUpload={handleQuestionUpload}
                    maxCount={1}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />}>
                      Upload question file
                    </Button>
                  </Upload>
                )
              )}
            </Form.Item>
          </div>
          <div className={styles.formContainerRight}>
            <Form.Item label="Answer" name="answer">
              <Input.TextArea maxLength={2500} />
            </Form.Item>
            <Form.Item label="Answer File" name="answer_file">
              <Upload
                beforeUpload={handleUpload}
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
                <Button style={{ width: "100%" }} icon={<UploadOutlined />}>
                  Upload
                </Button>
              </Upload>
              {task?.answer_file && (
                <Button
                  onClick={() => window.open(task.answer_file, "_blank")}
                  style={{ marginTop: 10, width: "100%" }}
                >
                  View File
                </Button>
              )}
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  backgroundColor: "#138565",
                  color: isAnswerChanged ? "#ffffff" : "#8A8C98",
                  width: "100%",
                }}
                disabled={!isAnswerChanged}
              >
                Save Answer
              </Button>
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Created By (User ID)" name="user_name">
                  <Input readOnly={!editMode} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Completed At" name="completed_at">
                  <Input readOnly={!editMode} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>
      )}
      {!editMode && (
        <div className={styles.btn}>
          <Button type="primary" onClick={() => setEditMode(true)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this task?"
            onConfirm={handleDelete}
            okText="Yes"
            cancelText="No"
          >
            <Button type="danger" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </div>
      )}
      {editMode && (
        <div className={styles.btn}>
          <Button
            type="primary"
            onClick={() => form.submit()}
            style={{ borderRadius: "6px", marginRight: "8px" }}
          >
            Save
          </Button>
          <Button
            danger
            style={{ borderRadius: "6px", backgroundColor: "#ff4d4f" }}
            onClick={() => setEditMode(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default TaskDetailModal;
