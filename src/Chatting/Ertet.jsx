// ChatInterface.jsx
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  Avatar,
  Tooltip,
  message as antMessage,
} from "antd";
import {
  CloseOutlined,
} from "@ant-design/icons";

import styles from "./ChatInterface.module.scss";


// Constants
const WS_BASE_URL = "ws://192.168.4.58";
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_TIMEOUT = 3000;

// Helper Components
const TypingIndicator = ({ typingUsers, currentChat }) => {
  // Check if anyone is typing
  const typingUserIds = Object.entries(typingUsers)
    .filter(([_, isTyping]) => isTyping)
    .map(([userId]) => userId);

  if (typingUserIds.length === 0) {
    return null;
  }

  return (
    <div className={styles.typingIndicator}>
      {typingUserIds
        .map((userId) => {
          const typingUser = currentChat?.participants?.find(
            (user) => user.user_id === parseInt(userId)
          );
          return typingUser
            ? `${typingUser.name} is typing...`
            : "Someone is typing...";
        })
        .join(", ")}
    </div>
  );
};

const ActionIcon = ({ icon, title, onClick }) => (
  <Tooltip title={title}>
    <div className={styles.actionIcon} onClick={onClick}>
      {icon}
    </div>
  </Tooltip>
);

const UserList = ({ users, createChat, onClose, currentChat }) => (
  <div className={styles.userListContainer}>
    <div className={styles.userListHeader}>
      <h3>Create Chat</h3>
      <CloseOutlined className={styles.closeIcon} onClick={onClose} />
    </div>
    <div className={styles.userListContent}>
      {users.map((user) => (
        <div
          key={user.id}
          className={styles.userListItem}
          onClick={() => {
            createChat(false, [user]);
            onClose();
          }}
        >
          <Avatar size={36} className={styles.avatar}>
            {user.name ? user.name.charAt(0) : "U"}
          </Avatar>
          <div className={styles.userDetails}>
            <div className={styles.userName}>
              {user.first_name || "Unknown User"}
            </div>
            <div className={styles.userEmail}>{user.email || "No email"}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ChatInterface = () => {
  // State for user and messages
  const [user, setUser] = useState(null);
  const [userID, setUserID] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  // Chat state
  const [currentChat, setCurrentChat] = useState(null);
  const [chatID, setChatID] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  // NEW: Track the last read message ID per chat
  const [lastReadMessageIds, setLastReadMessageIds] = useState({});

  // UI state
  const [inputMessage, setInputMessage] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // WebSocket state
  const [socket, setSocket] = useState(null);
  const [socketError, setSocketError] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const wsRef = useRef(null);
  const visibleMessagesRef = useRef(new Set());

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([fetchUsers(), fetchChats(), fetchUser()]);
      } catch (error) {
        antMessage.error("Failed to load chat data");
      }
    };

    fetchInitialData();
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!chatID || !userID) {
      console.log("Missing chatID or userID, cannot establish WebSocket");
      return;
    }

    const socketUrl = `${WS_BASE_URL}/api/v1/message/ws/${chatID}/${userID}`;
    establishWebSocketConnection(socketUrl);

    return () => {
      closeWebSocketConnection();
    };
  }, [chatID, userID]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // NEW: Track visible messages to mark them as read
  useEffect(() => {
    const checkVisibleMessages = () => {
      if (!messagesContainerRef.current || !currentChat) return;

      const container = messagesContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const messageElements = container.querySelectorAll(`.${styles.messageWrapper}`);
      const visibleMessageIds = new Set();

      messageElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Check if message is in view
        if (rect.top >= containerRect.top && rect.bottom <= containerRect.bottom) {
          const messageId = Number(el.dataset.messageId);
          if (messageId && !isNaN(messageId)) {
            visibleMessageIds.add(messageId);
          }
        }
      });

      // Process newly visible messages
      const newVisibleMessages = Array.from(visibleMessageIds).filter(
        (id) => !visibleMessagesRef.current.has(id)
      );

      if (newVisibleMessages.length > 0) {
        // Mark these messages as read
        newVisibleMessages.forEach((messageId) => {
          markMessageAsRead(messageId);
        });

        // Update the ref
        visibleMessagesRef.current = new Set([
          ...visibleMessagesRef.current,
          ...newVisibleMessages,
        ]);
      }
    };

    // Add scroll event listener
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkVisibleMessages);
      // Also check on initial load
      checkVisibleMessages();
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", checkVisibleMessages);
      }
    };
  }, [messages, currentChat]);

  // Auto-focus search input when searching is enabled
  useEffect(() => {
    if (isSearching) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
    }
  }, [isSearching]);

  // NEW: Send read receipts when switching chats
  useEffect(() => {
    if (currentChat && currentChat.id) {
      // Mark all messages in the current chat as read
      const unreadMessages = messages
        .filter((msg) => !msg.read && msg.sender_id !== userID)
        .map((msg) => msg.id)
        .filter(Boolean);

      if (unreadMessages.length > 0) {
        unreadMessages.forEach((messageId) => {
          markMessageAsRead(messageId);
        });
      }
      
      // Update contacts list to reset unread count
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === currentChat.id
            ? { ...contact, unreadCount: 0 }
            : contact
        )
      );
    }
  }, [currentChat, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // NEW: Mark message as read
  const markMessageAsRead = useCallback((messageId) => {
    if (!messageId || !socket || !currentChat) return;

    // Update local state
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );

    // Send read receipt to server
    const readData = {
      type: "read_message",
      message_id: messageId,
      chat_id: currentChat.id,
      user_id: userID,
    };

    try {
      socket.send(JSON.stringify(readData));
      
      // Update the last read message ID for this chat
      setLastReadMessageIds((prev) => ({
        ...prev,
        [currentChat.id]: Math.max(messageId, prev[currentChat.id] || 0),
      }));
    } catch (error) {
      console.error("Failed to send read receipt:", error);
    }
  }, [socket, currentChat, userID]);

  const establishWebSocketConnection = useCallback(
    (socketUrl) => {
      try {
        closeWebSocketConnection();

        const ws = new WebSocket(socketUrl);
        wsRef.current = ws;

        ws.onopen = handleWebSocketOpen;
        ws.onmessage = handleWebSocketMessage;
        ws.onerror = handleWebSocketError;
        ws.onclose = handleWebSocketClose;
      } catch (connectionError) {
        console.error("WebSocket Connection Error:", connectionError);
        setSocketError("Could not establish WebSocket connection");
        antMessage.error("Could not connect to chat service");
      }
    },
    [userID]
  );

  const closeWebSocketConnection = () => {
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleWebSocketOpen = () => {
    console.log("WebSocket Connected successfully");
    setSocket(wsRef.current);
    setSocketError(null);
    reconnectAttemptsRef.current = 0;
  };

  const handleWebSocketMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "chat_message":
          handleIncomingMessage(data);
          break;
        case "typing":
        case "stopped_typing":
          handleTypingEvent(data);
          break;
        case "read_message":
          handleReadMessageEvent(data);
          break;
        case "online_count":
          console.log("Online count data received:", data);
          handleOnlineCountUpdate(data);
          break;
        default:
          console.log("Unhandled WebSocket message type:", data);
      }
    } catch (parseError) {
      console.error("WebSocket message parsing error:", parseError);
    }
  };

  // NEW: Handle read message events
  const handleReadMessageEvent = useCallback((data) => {
    if (!data.message_id || !data.user_id) return;

    // Update the message read status
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === data.message_id
          ? { ...msg, read: true, readBy: [...(msg.readBy || []), data.user_id] }
          : msg
      )
    );
  }, []);

  const handleWebSocketError = (error) => {
    console.error("WebSocket Error:", error);
    setSocketError("WebSocket connection failed");
    antMessage.error("Unable to connect to chat service");
  };

  const handleWebSocketClose = (event) => {
    console.log("WebSocket Disconnected", event);
    setSocket(null);

    const shouldReconnect =
      event.code !== 1000 &&
      reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS;

    if (shouldReconnect && chatID && userID) {
      reconnectAttemptsRef.current++;
      setTimeout(() => {
        console.log(
          `Attempting to reconnect (Attempt ${reconnectAttemptsRef.current})...`
        );
        establishWebSocketConnection(
          `${WS_BASE_URL}/api/v1/message/ws/${chatID}/${userID}`
        );
      }, RECONNECT_TIMEOUT);
    } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      antMessage.error(
        "Could not establish WebSocket connection after multiple attempts"
      );
    }
  };

  const handleIncomingMessage = useCallback((data) => {
    // Check if this is a message in the current chat
    const isCurrentChat = data.chat_id === chatID;
    const isFromCurrentUser = data.sender_id === userID;
    
    // If it's from another user and in the current chat, mark as read immediately
    const shouldMarkAsRead = isCurrentChat && !isFromCurrentUser;
    
    // Update messages state
    setMessages((prevMessages) => {
      // Check for duplicate by ID
      const isDuplicate = prevMessages.some((msg) => msg.id === data.id);

      // Check for optimistic duplicate by content and sender
      const isOptimisticDuplicate = prevMessages.some(
        (msg) =>
          !msg.id &&
          msg.tempId &&
          msg.content === data.content &&
          msg.sender_id === data.sender_id
      );

      if (isDuplicate) return prevMessages;

      // If it's an optimistic duplicate, replace the temp message with the real one
      if (isOptimisticDuplicate) {
        return prevMessages.map((msg) =>
          !msg.id &&
          msg.content === data.content &&
          msg.sender_id === data.sender_id
            ? { ...data, id: data.id, read: isFromCurrentUser } // Sender's messages are always marked as read
            : msg
        );
      }

      // Otherwise add the new message
      return [
        ...prevMessages,
        {
          id: data.id,
          content: data.content,
          sender: data.sender_name,
          sender_id: data.sender_id,
          timestamp: `${data.create_date} ${data.create_time}`,
          read: isFromCurrentUser || shouldMarkAsRead, // Sender's messages are always marked as read
          type: "regular",
          chat_id: data.chat_id,
        },
      ];
    });