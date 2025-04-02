import { useState, useEffect } from "react";
import api from "../api/apifor";
import styles from "./UserList.module.scss";
import {
  Button,
  Modal,
  Input,
  Popconfirm,
  notification,
  Pagination,
  Select,
} from "antd";
import { EditOutlined, DeleteOutlined, StopOutlined } from "@ant-design/icons";
import CreateUserRolePage from "./AddUser";
import ActionModal from "./RoleAction";
import { useLanguage } from "../Language/LanguageContext";
import translations from "../Language/translation";

const { Option } = Select;
const ITEMS_PER_PAGE = 12;

const fetchData = async (urls) => {
  try {
    const responses = await Promise.all(urls.map((url) => api.get(url)));
    const userData = responses[0].data?.data || [];
    if (!Array.isArray(userData)) {
      console.error("User data is not an array:", userData);
      return [[], []];
    }
    return [userData, responses[1].data?.data || []];
  } catch (error) {
    console.error("API Request Failed:", error);
    return [[], []];
  }
};

const UserManager = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [editUserId, setEditUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState({
    login: "",
    first_name: "",
    last_name: "",
    password: "",
    isActive: true,
    roles: [],
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [userData, roleData] = await fetchData(["v1/auth/all", "v1/role"]);
      setUsers(userData);
      setAvailableRoles(roleData);
      setLoading(false);
    };

    loadData();
  }, []);

  const fetchUsers = () => {
    api
      .get("v1/auth/all")
      .then((response) => {
        const userData = response.data?.data;
        const usersArray = Array.isArray(userData)
          ? userData
          : userData
          ? [userData]
          : [];
        setUsers(usersArray);
      })
      .catch((error) => {
        console.error("Failed to fetch users:", error);
        setUsers([]);
      });
  };

  const handleModalOpen = () => setOpen(true);
  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);
  const handleEditUser = async () => {
    const userBeingEdited = users.find((user) => user.id === editUserId);

    const updateData = {
      login: editFormData.login || userBeingEdited.login,
      first_name: editFormData.first_name || userBeingEdited.first_name,
      last_name: editFormData.last_name || userBeingEdited.last_name,
      is_active:
        editFormData.isActive !== undefined
          ? editFormData.isActive
          : userBeingEdited.is_active,
      roles: editFormData.roles.length
        ? editFormData.roles
        : userBeingEdited.roles,
      ...(editFormData.password && { password: editFormData.password }),
    };

    try {
      await api.patch(`v1/auth/${editUserId}`, updateData);
      notification.success({
        message: "User Updated",
        description: "The user details have been successfully updated.",
      });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === editUserId ? { ...user, ...updateData } : user
        )
      );

      resetEditState();
    } catch (error) {
      notification.error({
        message: "Update Failed",
        description: "There was an error updating the user.",
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`v1/auth/${userId}/`);
      setUsers(users.filter((user) => user.id !== userId));
      notification.success({
        message: "User Deleted",
        description: "The user was successfully deleted.",
      });
    } catch (error) {
      notification.error({
        message: "Delete Failed",
        description: "There was an error deleting the user.",
      });
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await api.delete(`v1/role/${roleId}/`);
      setAvailableRoles((prevRoles) =>
        prevRoles.filter((role) => role.id !== roleId)
      );
      notification.success({
        message: "Role Deleted",
        description: "The role was successfully deleted.",
      });
    } catch (error) {
      notification.error({
        message: "Delete Failed",
        description: "There was an error deleting the role.",
      });
    }
  };

  const resetEditState = () => {
    setEditUserId(null);
    setEditFormData({
      username: "",
      password: "",
      isActive: true,
      roles: [],
    });
  };

  const handleFormChange = (field, value) => {
    setEditFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const currentUsers = Array.isArray(users)
    ? users.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      )
    : [];

  const renderRoleSelect = (user) => (
    <Select
      dropdownClassName="custom-select-dropdown"
      mode="multiple"
      style={{ width: "100%" }}
      value={editFormData.roles.map((role) => role.id)}
      onChange={(selectedIds) => {
        const selectedRoles = selectedIds
          .map(
            (id) =>
              availableRoles.find((role) => role.Id === id) || {
                id,
                name: `Role ${id}`,
              }
          )
          .map((role) => ({
            id: role.Id || role.id,
            name: role.Name || role.name,
          }));
        handleFormChange("roles", selectedRoles);
      }}
    >
      {availableRoles.map((role) => (
        <Option key={role.Id} value={role.Id}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{role.Name}</span>
            {!editFormData.roles.some((r) => r.id === role.Id) && (
              <Button
                icon={<DeleteOutlined />}
                type="link"
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRole(role.Id);
                }}
                style={{ padding: 0 }}
              />
            )}
          </div>
        </Option>
      ))}
    </Select>
  );

  return (
    <div className={styles.managerPage}>
      <header className={styles.header}>
        <Button type="primary" className="static" onClick={handleModalOpen}>
          {t.userCreateUser}
        </Button>

        <div>
          <Button className="static" type="primary" onClick={openModal}>
            {t.userRoleActionB}
          </Button>
          <ActionModal isVisible={isModalVisible} onClose={closeModal} />
        </div>

        <Modal
          open={open}
          className={styles.customModal}
          footer={null}
          onCancel={() => setOpen(false)}
        >
          <CreateUserRolePage setModalOpen={setOpen} fetchUsers={fetchUsers} />
        </Modal>
      </header>

      <table className={styles.inventoryTable}>
        <thead>
          <tr>
            <th> {t.userFirstName}</th>
            <th> {t.UserUsername}</th>
            <th> {t.userLastName}</th>
            <th> {t.userParol}</th>
            <th> Status</th>
            <th> {t.userRoles}</th>
            <th> {t.userActions}</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="6">Loading...</td>
            </tr>
          ) : currentUsers.length ? (
            currentUsers.map((user, index) => (
              <tr key={user.id}>
                <td>
                  {editUserId === user.id ? (
                    <Input
                      value={editFormData.first_name}
                      onChange={(e) =>
                        handleFormChange("first_name", e.target.value)
                      }
                    />
                  ) : (
                    user.first_name
                  )}
                </td>
                <td>
                  {editUserId === user.id ? (
                    <Input
                      value={editFormData.last_name}
                      onChange={(e) =>
                        handleFormChange("last_name", e.target.value)
                      }
                    />
                  ) : (
                    user.last_name
                  )}
                </td>
                <td>
                  {editUserId === user.id ? (
                    <Input
                      value={editFormData.login}
                      onChange={(e) =>
                        handleFormChange("login", e.target.value)
                      }
                    />
                  ) : (
                    user.login
                  )}
                </td>
                <td>
                  {editUserId === user.id ? (
                    <Input
                      type="password"
                      value={editFormData.password}
                      onChange={(e) =>
                        handleFormChange("password", e.target.value)
                      }
                    />
                  ) : (
                    "********"
                  )}
                </td>
                <td>
                  {editUserId === user.id ? (
                    <Select
                      dropdownClassName="custom-select-dropdown"
                      defaultValue={user.is_active ? "Active" : "Inactive"}
                      onChange={(value) =>
                        handleFormChange("isActive", value === "Active")
                      }
                    >
                      <Option value="Active"> Active</Option>
                      <Option value="Inactive"> Inactive</Option>
                    </Select>
                  ) : user.is_active ? (
                    "Active"
                  ) : (
                    "Inactive"
                  )}
                </td>
                <td>
                  {editUserId === user.id
                    ? renderRoleSelect(user)
                    : user.roles?.map((role) => role.name).join(", ") ||
                      "No roles"}
                </td>
                <td style={{ display: "flex", gap: "15px" }}>
                  {editUserId === user.id ? (
                    <>
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={handleEditUser}
                        className={styles.actionButton}
                      >
                        save
                      </Button>
                      <Button
                        icon={<StopOutlined />}
                        onClick={() => {
                          resetEditState();
                        }}
                        style={{ marginLeft: "10px", color: "#fff" }}
                        className={styles.actionButton}
                      ></Button>
                    </>
                  ) : (
                    <Button
                      icon={<EditOutlined style={{ color: "#fff" }} />}
                      className={`${styles.actionButton} static`}
                      onClick={() => {
                        setEditFormData({
                          username: user.username,
                          password: "",
                          isActive: user.is_active,
                          roles: user.roles,
                        });
                        setEditUserId(user.id);
                      }}
                    ></Button>
                  )}
                  <Popconfirm
                    title="Are you sure you want to delete this user?"
                    onConfirm={() => handleDeleteUser(user.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      className={`${styles.actionButton} static`}
                      icon={<DeleteOutlined color="red" />}
                      danger
                    ></Button>
                  </Popconfirm>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6"> No_users_found</td>
            </tr>
          )}
        </tbody>
      </table>
      <Pagination
        current={currentPage}
        total={users.length}
        pageSize={ITEMS_PER_PAGE}
        onChange={(page) => setCurrentPage(page)}
        style={{ marginTop: "20px" }}
      />
    </div>
  );
};

export default UserManager;
