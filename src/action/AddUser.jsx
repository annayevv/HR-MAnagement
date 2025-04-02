/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Form, Input, Button, Select, Modal, message } from "antd";
import api from "../api/apifor";
import styles from "./CreateUser.module.scss";
import { useAuth } from "../Components/AuthContext";
const { Option } = Select;

const CreateUserRolePage = ({ setModalOpen, fetchUsers }) => {
  const { isAuthenticated } = useAuth();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [hasCreateRolePermission, setHasCreateRolePermission] = useState(true);
  const [hasCreateUserPermission, setHasCreateUserPermission] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRoles();
    } else {
      message.warning("You are not authenticated!");
    }
  }, [isAuthenticated]);

  const fetchRoles = async () => {
    try {
      const response = await api.get("v1/role");
      setRoles(response.data.data);
    } catch (error) {
      if (error.response?.status === 403) {
        message.error("create_role_permission");
        setHasCreateRolePermission(false);
      } else {
        message.error("fetch_roles_failed");
      }
    }
  };

  const handleCreateRole = async (values) => {
    if (!values.roleName) {
      message.warning("Role name is required!");
      return;
    }

    setLoading(true);
    try {
      await api.post("v1/role", { name: values.roleName });
      message.success("Role created successfully!");
      setIsRoleModalOpen(false);
      setModalOpen(false);
      fetchRoles();
      roleForm.resetFields();
    } catch (error) {
      if (error.response?.status === 403) {
        message.error("create_role_permission");
        setHasCreateRolePermission(false);
      } else {
        message.error("create_role_failed");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleCreateUser = async (values) => {
    if (!values.username || !values.password || !values.roles) {
      message.warning("Please fill in all required fields!");
      return;
    }

    setLoading(true);
    try {
      await api.post("v1/auth", {
        login: values.username,
        password: values.password,
        role: values.roles.map((role) => parseInt(role, 10)),
        is_active: true,
        last_name: values.lastname,
        first_name: values.firstname,
      });
      message.success("User created successfully!");
      fetchUsers();
      userForm.resetFields();
      setModalOpen(false);
    } catch (error) {
      if (error.response?.status === 403) {
        message.error("create_user_permission");
        setHasCreateUserPermission(false);
      } else {
        message.error("create_user_failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Role Modal */}
      <Modal
        open={isRoleModalOpen}
        onCancel={() => setIsRoleModalOpen(false)}
        footer={null}
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={handleCreateRole}
          className={styles.roleForm}
        >
          <Form.Item
            label="Role Name"
            name="roleName"
            rules={[{ required: true, message: "Enter role name!" }]}
          >
            <Input placeholder="Role name" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create
          </Button>
        </Form>
      </Modal>

      {/* User Form */}
      <Form
        layout="vertical"
        form={userForm}
        onFinish={handleCreateUser}
        className={styles.userForm}
      >
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: "Enter username!" }]}
        >
          <Input placeholder="Username" />
        </Form.Item>
        <Form.Item
          label="First Name"
          name="firstname"
          rules={[{ required: true, message: "Enter First Name!" }]}
        >
          <Input placeholder="First Name" />
        </Form.Item>
        <Form.Item
          label="Last Name"
          name="lastname"
          rules={[{ required: true, message: "Enter Last Name!" }]}
        >
          <Input placeholder="Last Name" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Enter password!" }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>

        <Form.Item
          label="Roles"
          name="roles"
          rules={[
            { required: true, message: "Please choose at least one role!" },
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Choose roles"
            allowClear
            loading={loading}
          >
            {roles.map((role) => (
              <Option key={role.Id} value={role.id}>
                {role.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <div className={styles.actions}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={!hasCreateUserPermission}
            style={{ backgroundColor: "#138565" }}
          >
            create_user
          </Button>
          <Button
            onClick={() => setIsRoleModalOpen(true)}
            disabled={!hasCreateRolePermission}
          >
            Add New Role
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CreateUserRolePage;
