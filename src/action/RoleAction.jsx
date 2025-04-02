import { useState, useEffect } from "react";
import { Modal, Button, Form, Select, Input, message, Spin } from "antd";
import api from "../api/apifor";
import styles from "./roleAction.module.scss";
import {
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
const { Option } = Select;

const ActionModal = ({ isVisible, onClose }) => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [actions, setActions] = useState([]);
  const [roleActions, setRoleActions] = useState([]);
  const [selectedActions, setSelectedActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newActionName, setNewActionName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchActions();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await api.get("v1/role");
      setRoles(res.data.data);
    } catch (error) {
      message.error("Failed to fetch roles.");
    }
  };

  const fetchActions = async () => {
    try {
      const res = await api.get("v1/action");
      setActions(res.data.data);
    } catch (error) {
      message.error("Failed to fetch actions.");
    }
  };

  const fetchRoleActions = async (roleId) => {
    setLoading(true);
    try {
      const res = await api.get(`v1/role/${roleId}`);
      const roleActionIds = res.data.data.actions?.map((item) => item.id) || [];

      setRoleActions(roleActionIds);
      setSelectedActions(roleActionIds);
    } catch (error) {
      setRoleActions([]);
      setSelectedActions([]);
      message.error("Failed to fetch role actions.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAction = async () => {
    if (!newActionName.trim()) {
      message.warning("Please enter an action name.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("v1/action", { name: newActionName });
      setActions([...actions, res.data.data]);
      message.success("Action added successfully!");
      setNewActionName("");
    } catch (error) {
      message.error("Failed to add action.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveActions = async () => {
    if (!selectedRole) {
      message.warning("Please select a role.");
      return;
    }

    try {
      setSubmitting(true);

      const currentRoleActionsResponse = await api.get(
        `v1/role/${selectedRole}`
      );
      const currentRoleActions =
        currentRoleActionsResponse.data.data.actions || [];

      const newActions = selectedActions.filter(
        (action) => !roleActions.includes(action)
      );

      const actionsToRemove = currentRoleActions.filter(
        (roleAction) => !selectedActions.includes(roleAction.Id)
      );

      if (newActions.length > 0) {
        await api.post(`v1/role/action`, {
          role_id: selectedRole,
          action_ids: newActions,
        });
      }

      for (const actionToRemove of actionsToRemove) {
        try {
          await api.delete(`v1/role/action/${actionToRemove.Id}/`);
        } catch (deleteError) {
          console.error(
            `Failed to delete role action ${actionToRemove.Id}:`,
            deleteError
          );
        }
      }

      message.success("Actions updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error response:", error.response?.data);
      message.error("Failed to update actions.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAction = async (actionId) => {
    try {
      await api.delete(`v1/action/${actionId}/`);
      setActions(actions.filter((action) => action.Id !== actionId));
      message.success("Action deleted successfully!");
    } catch (error) {
      message.error(
        "Failed to delete action. Action may be in use. Please remove from role. And try again."
      );
    }
  };

  const handleEditAction = (action) => {
    setEditingAction(action);
  };

  const handleSaveEdit = async (actionId, newName) => {
    try {
      await api.put(`v1/action/${actionId}/`, { name: newName });
      setActions(
        actions.map((action) =>
          action.Id === actionId ? { ...action, Name: newName } : action
        )
      );
      message.success("Action updated successfully!");
      setEditingAction(null);
    } catch (error) {
      message.error("Failed to update action.");
    }
  };

  const handleCancelEdit = () => {
    setEditingAction(null);
  };

  const handleRoleSelection = (value) => {
    setSelectedRole(value);
    fetchRoleActions(value);
  };

  return (
    <Modal
      visible={isVisible}
      onCancel={onClose}
      footer={null}
      className={styles.modal}
    >
      <Spin spinning={loading}>
        <div className={styles.container}>
          {/* Role Selection */}
          <Form layout="vertical" className={styles.form}>
            <Form.Item label="Select Role">
              <Select
                placeholder="Select a role"
                value={selectedRole}
                onChange={handleRoleSelection}
              >
                {roles.map((role) => (
                  <Option key={role.id} value={role.id}>
                    {role.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>

          {/* Add New Action */}
          <div className={styles.newAction}>
            <Input
              placeholder="Enter new action name"
              value={newActionName}
              onChange={(e) => setNewActionName(e.target.value)}
              onPressEnter={handleCreateAction}
            />
            <Button
              type="primary"
              onClick={handleCreateAction}
              loading={submitting}
            >
              add_action
            </Button>
          </div>

          <Button
            type="primary"
            onClick={() => setShowTable(!showTable)}
            className={styles.toggleTableButton}
          >
            {showTable ? "Hide Actions" : "Show Actions"}
          </Button>

          {/* Action Table */}
          {showTable && (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th> Action Name</th>
                    <th> action</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((action) => (
                    <tr key={action.id}>
                      <td>
                        {editingAction?.Id === action.id ? (
                          <Input
                            defaultValue={action.Name}
                            onChange={(e) =>
                              setEditingAction({
                                ...editingAction,
                                Name: e.target.value,
                              })
                            }
                          />
                        ) : (
                          action.name
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "5px" }}>
                          {editingAction?.Id === action.Id ? (
                            <>
                              <Button
                                type="link"
                                icon={<SaveOutlined />}
                                onClick={() =>
                                  handleSaveEdit(action.Id, editingAction.Name)
                                }
                                className={styles.actionButton}
                              />
                              <Button
                                type="link"
                                icon={<CloseOutlined />}
                                onClick={handleCancelEdit}
                                className={styles.actionButton}
                              />
                            </>
                          ) : (
                            <>
                              <Button
                                type="link"
                                icon={<EditOutlined />}
                                onClick={() => handleEditAction(action)}
                                className={styles.actionButton}
                              />
                              <Button
                                type="link"
                                icon={<DeleteOutlined />}
                                danger
                                onClick={() => handleDeleteAction(action.Id)}
                                className={styles.actionButton}
                              />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Action Selection */}
          <Form layout="vertical" className={styles.form}>
            <Form.Item label="Select Actions">
              <Select
                mode="multiple"
                placeholder="Select actions"
                value={selectedActions}
                onChange={(value) => setSelectedActions(value)}
                allowClear
                disabled={!selectedRole}
                dropdownClassName="custom-select-dropdown"
              >
                {actions.map((action) => (
                  <Option key={action.id} value={action.id}>
                    {action.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>

          {/* Save Button */}
          <div className={styles.footer}>
            {/* <Button onClick={onClose}> {t("cancel")}</Button> */}
            <Button
              type="primary"
              onClick={handleSaveActions}
              loading={submitting}
              disabled={!selectedRole}
              style={{ color: "#fff", backgroundColor: "#138565" }}
            >
              save
            </Button>
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default ActionModal;
