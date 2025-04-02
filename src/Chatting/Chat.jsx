import React from "react";
import { Modal } from "antd";
import ChatInterface from "./index"; // Import the ChatInterface

const ChatModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      footer={null}
      width="60%"
      bodyStyle={{ height: "80vh" }}
    >
      <ChatInterface />
    </Modal>
  );
};

export default ChatModal;
