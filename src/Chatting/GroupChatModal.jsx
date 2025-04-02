import React from "react";
import { Modal, Input, Select, Form } from "antd";


const GroupChatModal = ({ visible, onClose, users, createChat }) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // This is where the fix is needed - we need to pass the actual user objects
      // to the createChat function, not just their IDs
      const selectedUsers = values.users
        .map((userId) => users.find((user) => user.id === userId))
        .filter((user) => user !== undefined);

      await createChat(true, selectedUsers, values.groupName);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Error creating group chat:", error);
    }
  };

  return (
    <Modal
      title="Create Group Chat"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Create Group"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="groupName"
          label="Group Name"
          rules={[{ required: true, message: "Please enter group name!" }]}
        >
          <Input placeholder="Enter group name" />
        </Form.Item>
        <Form.Item
          name="users"
          label="Select Members"
          rules={[
            {
              required: true,
              message: "Please select at least one member!",
              type: "array",
              min: 1,
            },
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Select members"
            style={{ width: "100%" }}
          >
            {users.map((user) => (
              <Select.Option key={user.id} value={user.id}>
                {user.first_name || user.email}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GroupChatModal;
