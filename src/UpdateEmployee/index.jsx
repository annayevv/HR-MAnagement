/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import InputMask from "react-input-mask";
import { useParams, useNavigate } from "react-router-dom";
import { message } from "antd";
import styles from "./updateEmp.module.scss";
import api from "../api/apifor";
import { fetchEmployeeData, formatPhoneNumber } from "../utils/formUtils";
import ProfilePicture from "./profilePicture";
import { Select, DatePicker } from "antd";
import dayjs from "dayjs";
import {
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  SaveOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [users, setUsers] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const [employeeData, setEmployeeData] = useState({
    avatar: "",
    position: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    hire_date: "",
    resign_date: "",
    birth_date: "",
    user_id: "",
  });

  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetchEmployeeData(id, token);
        console.log("API'den gelen veri:", response.data.data);
        const formattedData = formatPhoneNumber(response.data.data);

        const processedData = {
          ...formattedData,
          birth_date: formattedData.birth_date
            ? dayjs(formattedData.birth_date)
            : null,
          hire_date: formattedData.hire_date
            ? dayjs(formattedData.hire_date)
            : null,
          resign_date: formattedData.resign_date
            ? dayjs(formattedData.resign_date)
            : null,
        };

        setEmployeeData(processedData);
        setOriginalData(processedData);

        const usersResponse = await api.get("v1/auth/all");
        setUsers(usersResponse.data.data);
      } catch (err) {
        message.error("Error fetching employee data or users.");
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    if (!isEditMode) return;

    const { name, value } = e.target;

    if (name === "phone_number") {
      let formattedValue = value.replace(/[^\d+]/g, "");
      setEmployeeData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
      return;
    }

    setEmployeeData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleDateChange = (date, dateField) => {
    setEmployeeData((prev) => ({
      ...prev,
      [dateField]: date,
    }));
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelClick = () => {
    setEmployeeData(originalData);
    setIsEditMode(false);
  };

  const handleDeleteEmployee = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await api.delete(`/v1/employee/${id}`);
        navigate("/home");
      }
    } catch (err) {
      message.error("Error deleting employee.");
    }
  };

  const validateForm = () => {
    const { email, phone_number } = employeeData;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      message.error("Invalid email format!");
      return false;
    }

    const cleanPhoneNumber = phone_number.replace(/[^+\d]/g, "");
    const phoneRegex = /^\+993(6[1-5]|71\d)\d{6}$/;
    if (!phoneRegex.test(cleanPhoneNumber)) {
      message.error(
        "Phone number must be in the format +993 61 000000 or +993 71 000000!"
      );
      return false;
    }

    return true;
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    Object.keys(employeeData).forEach((key) => {
      if (key === "avatar") {
        if (employeeData.avatar instanceof File) {
          formData.append(key, employeeData.avatar);
        }
      } else if (key === "phone_number") {
        const apiPhoneNumber = employeeData.phone_number.replace(/\D/g, "");
        formData.append(key, `+${apiPhoneNumber}`);
      } else if (["birth_date", "hire_date", "resign_date"].includes(key)) {
        if (employeeData[key]) {
          formData.append(key, employeeData[key].format("YYYY-MM-DD"));
        } else {
          formData.append(key, "");
        }
      } else if (key === "user_id") {
        if (employeeData.user_id) {
          const userId = parseInt(employeeData.user_id);
          if (userId > 0) {
            formData.append("user_id", userId);
          } else {
            formData.append("user_id", "");
          }
        } else {
          formData.append("user_id", "");
        }
      } else {
        formData.append(key, employeeData[key]);
      }
    });

    try {
      await api.patch(`/v1/employee/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      message.success("Employee updated successfully!");
      setIsEditMode(false);
      setOriginalData(employeeData);
    } catch (err) {
      console.error("Error updating employee:", err);
      message.error("Failed to update employee. Please try again.");
    }
  };

  return (
    <div className={styles.profileEditContainer}>
      <div className={styles.content}>
        <div className={styles.accountDetails}>
          <form onSubmit={handleSaveChanges} className={styles.form}>
            <div style={{ display: "flex", gap: "20px" }}>
              <ProfilePicture
                avatar={employeeData.avatar}
                setEmployeeData={setEmployeeData}
                isEditMode={isEditMode}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                <div className={styles.cont}>
                  <div className={styles.formGroup}>
                    <label>first_name</label>
                    <input
                      type="text"
                      name="first_name"
                      placeholder="First name"
                      value={employeeData.first_name}
                      onChange={handleChange}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>last_name</label>
                    <input
                      type="text"
                      name="last_name"
                      placeholder="Last name"
                      value={employeeData.last_name}
                      onChange={handleChange}
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>position</label>
                  <input
                    type="text"
                    name="position"
                    placeholder="Position"
                    value={employeeData.position}
                    onChange={handleChange}
                    disabled={!isEditMode}
                  />
                </div>

                <div className={styles.formGroupRow}>
                  <div className={styles.formGroup}>
                    <label>birth_date</label>
                    <DatePicker
                      value={employeeData.birth_date}
                      onChange={(date) => handleDateChange(date, "birth_date")}
                      disabled={!isEditMode}
                      suffixIcon={<CalendarOutlined />}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div className={styles.formGroup}>
                <label>hire_date</label>
                <DatePicker
                  value={employeeData.hire_date}
                  onChange={(date) => handleDateChange(date, "hire_date")}
                  disabled={!isEditMode}
                  style={{ width: "100%" }}
                />
              </div>
              <div className={styles.formGroup}>
                <label>resign_date</label>
                <DatePicker
                  value={employeeData.resign_date}
                  onChange={(date) => handleDateChange(date, "resign_date")}
                  disabled={!isEditMode}
                  style={{ width: "100%" }}
                />
              </div>
              <div className={styles.formGroup}>
                <label>select_user</label>
                <Select
                  dropdownClassName="custom-select-dropdown"
                  style={{ width: "100%", height: "40px" }}
                  placeholder="Select User"
                  value={employeeData.user_id || undefined}
                  disabled={!isEditMode}
                  onChange={(value) =>
                    setEmployeeData((prev) => ({
                      ...prev,
                      user_id: value,
                    }))
                  }
                  options={[
                    ...users.map((user) => ({
                      label: `${user.first_name} ${user.last_name}`,
                      value: user.id,
                    })),
                  ]}
                  showSearch
                  filterOption={(input, option) =>
                    option?.label?.toLowerCase().includes(input.toLowerCase())
                  }
                />
              </div>
            </div>
            <div className={styles.cont}>
              <div className={styles.formGroup}>
                <label>phone_number</label>
                <InputMask
                  mask="+999 99 999999"
                  value={employeeData.phone_number}
                  onChange={handleChange}
                  placeholder="+993 61 000000"
                  maskChar="_"
                  disabled={!isEditMode}
                >
                  {(inputProps) => (
                    <input
                      {...inputProps}
                      type="text"
                      name="phone_number"
                      className={styles.phoneInput}
                    />
                  )}
                </InputMask>
              </div>
              <div className={styles.formGroup}>
                <label>email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={employeeData.email}
                  onChange={handleChange}
                  disabled={!isEditMode}
                />
              </div>
            </div>
            <div className={styles.buttonGroup}>
              {!isEditMode ? (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditClick();
                    }}
                    className={styles.editButton}
                  >
                    <EditOutlined />
                    edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteEmployee}
                    className={styles.deleteButton}
                  >
                    <DeleteOutlined />
                    Fire Employee
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" className={styles.saveButton}>
                    <SaveOutlined />
                    save
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCancelClick();
                    }}
                    className={styles.cancelButton}
                  >
                    <StopOutlined />
                    cancel
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
