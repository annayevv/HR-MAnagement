import React, { useState, useEffect } from "react";
import {
  Modal,
  Input,
  Select,
  Tabs,
  List,
  Button,
  Popconfirm,
  message,
  Avatar,
  Space,
} from "antd";
import {
  DeleteOutlined,
  UserDeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import api from "../api/apifor";
import styles from "./ChatInterface.module.scss";

const { TabPane } = Tabs;

const EditChatModal = ({ visible, onClose, currentChat, users, onUpdate }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatUsers, setChatUsers] = useState([]);

  useEffect(() => {
    if (currentChat) {
      setGroupName(currentChat.name);
      setSelectedUsers([]); // Reset selected users when modal opens
    }
  }, [currentChat, visible]);

  useEffect(() => {
    if (currentChat?.participants) {
      setChatUsers(currentChat.participants);
    }
  }, [currentChat]);

  // Update group name
  const handleUpdateName = async () => {
    if (!groupName.trim()) {
      message.error("Group name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      await api.put(`v1/chat/${currentChat.id}`, {
        name: groupName,
      });
      message.success("Chat name updated successfully");
      onUpdate();
    } catch (error) {
      console.error("Failed to update chat name:", error);
      message.error("Failed to update chat name");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (!currentChat.isGroup) {
      message.error("Members can only be added to group chats");
      return;
    }

    if (selectedUsers.length === 0) {
      message.error("Please select at least one user to add");
      return;
    }

    try {
      setLoading(true);

      // Send only the user IDs
      await api.post(`v1/chat/chatUser/${currentChat.id}`, {
        users: selectedUsers,
      });

      message.success("Members added successfully");
      setSelectedUsers([]); // Clear selection after adding
      onUpdate();
    } catch (error) {
      console.error("Failed to add members:", error);
      message.error("Failed to add members");
    } finally {
      setLoading(false);
    }
  };

  // Remove member
  const handleRemoveMember = async (chatUserId) => {
    try {
      // Use the chat_user id (from chat_users array) not the user_id
      const response = await api.delete(`v1/chat/chatUser/${chatUserId}`);

      if (response.status === 200) {
        message.success("Member removed successfully");
        // Update the chatUsers state to reflect the removal
        setChatUsers(chatUsers.filter((user) => user.id !== chatUserId));
        // Call the parent's onUpdate to refresh the chat details
        onUpdate();
      }
    } catch (error) {
      message.error("Failed to remove member from chat");
    }
  };

  // Delete chat
  const handleDeleteChat = async () => {
    try {
      setLoading(true);
      await api.delete(`v1/chat/${currentChat.id}`);
      message.success("Chat deleted successfully");
      onClose();
      onUpdate();
    } catch (error) {
      message.error("Failed to delete chat");
    } finally {
      setLoading(false);
    }
  };

  // Filter users that are not already in the chat
  const availableUsers = users.filter(
    (user) => !currentChat?.chat_users?.some((p) => p.user_id === user.id)
  );
  return (
    <Modal
      title={`Edit ${currentChat?.isGroup ? "Group" : "Chat"}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Tabs defaultActiveKey="1">
        <TabPane tab="General" key="1">
          <div style={{ marginBottom: 16 }}>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Chat Name"
              style={{
                width: "calc(100% - 88px)",
                marginRight: 8,
                marginBottom: "20px",
              }}
            />
            <Button onClick={handleUpdateName} type="primary" loading={loading}>
              Update
            </Button>
          </div>

          <Popconfirm
            title="Are you sure you want to delete this chat?"
            onConfirm={handleDeleteChat}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} loading={loading}>
              Delete Chat
            </Button>
          </Popconfirm>
        </TabPane>

        {currentChat?.isGroup && (
          <TabPane tab="Members" key="2">
            <div className={styles.memberManagement}>
              <div className={styles.addMemberSection}>
                <h4>Add New Members</h4>
                <Space style={{ width: "100%", marginBottom: 16 }}>
                  <Select
                    mode="multiple"
                    style={{ minWidth: "50%" }}
                    placeholder="Select users to add"
                    value={selectedUsers}
                    onChange={setSelectedUsers}
                    optionFilterProp="children"
                    loading={loading}
                  >
                    {availableUsers.map((user) => (
                      <Select.Option key={user.id} value={user.id}>
                        {user.first_name || user.email}
                      </Select.Option>
                    ))}
                  </Select>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddMembers}
                    disabled={selectedUsers.length === 0}
                    loading={loading}
                  >
                    Add
                  </Button>
                </Space>
              </div>

              <div className={styles.currentMembersSection}>
                <h4>Current Members</h4>
                <List
                  loading={loading}
                  style={{ height: "400px", overflowY: "auto" }}
                  dataSource={chatUsers}
                  renderItem={(user) => (
                    <List.Item
                      key={user.user_id}
                      actions={[
                        <Popconfirm
                          key={`remove-${user.id}`}
                          title="Remove this member from the group?"
                          onConfirm={() => handleRemoveMember(user.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button
                            icon={<UserDeleteOutlined />}
                            danger
                            size="small"
                            style={{ backgroundColor: "#B5BAC1" }}
                          />
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar>
                            {user.name
                              ? user.name.charAt(0).toUpperCase()
                              : "U"}
                          </Avatar>
                        }
                        title={user.name || "Unknown User"}
                        description={user.is_admin ? "Admin" : "Member"}
                      />
                    </List.Item>
                  )}
                />
              </div>
            </div>
          </TabPane>
        )}
      </Tabs>
    </Modal>
  );
};

export default EditChatModal;
