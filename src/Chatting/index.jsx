// ChatInterface.jsx
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Input,
  Avatar,
  Tooltip,
  Popconfirm,
  Button,
  message as antMessage,
} from "antd";
import { EditOutlined } from "@ant-design/icons";
import EditChatModal from "./CEditChatModal";
import {
  SendOutlined,
  SearchOutlined,
  PlusCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { IoIosPeople } from "react-icons/io";
import api from "../api/apifor"
import styles from "./ChatInterface.module.scss";
import GroupChatModal from "./GroupChatModal";

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
  const [lastReadMessageIds, setLastReadMessageIds] = useState({});
  // Chat state
  const [currentChat, setCurrentChat] = useState(null);
  const [chatID, setChatID] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);

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
  const searchInputRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const wsRef = useRef(null);
  const messagesContainerRef = useRef(null);
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
  const markMessageAsRead = useCallback(
    (messageId) => {
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
        console.log("Read receipt sent for message:", messageId);
      } catch (error) {
        console.error("Failed to send read receipt:", error);
      }
    },
    [socket, currentChat, userID]
  );
  useEffect(() => {
    const checkVisibleMessages = () => {
      if (!messagesContainerRef.current || !currentChat) return;

      const container = messagesContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const messageElements = container.querySelectorAll(
        `.${styles.messageWrapper}`
      );
      const visibleMessageIds = new Set();

      messageElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Check if message is in view
        if (
          rect.top >= containerRect.top &&
          rect.bottom <= containerRect.bottom
        ) {
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
  }, [messages, currentChat, markMessageAsRead]);

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

  // Auto-focus search input when searching is enabled
  useEffect(() => {
    if (isSearching) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
    }
  }, [isSearching]);

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

  // Make sure your WebSocket is receiving online_count messages
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

  const handleReadMessageEvent = useCallback((data) => {
    console.log("Read message event received:", data);

    // Handle single message read receipt
    if (data.message_id) {
      console.log(`Marking single message ${data.message_id} as read`);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === data.message_id ? { ...msg, read: true } : msg
        )
      );
    }

    // Handle multiple message read receipts (from the server)
    if (data.Messages && Array.isArray(data.Messages)) {
      console.log("Processing batch read messages:", data.Messages);
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          const updatedMessage = data.Messages.find((m) => m.id === msg.id);
          return updatedMessage ? { ...msg, read: true } : msg;
        })
      );
    }
  }, []);

  const handleIncomingMessage = useCallback(
    (data) => {
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
        const newMessage = {
          id: data.id,
          content: data.content,
          sender: data.sender_name,
          sender_id: data.sender_id,
          timestamp: `${data.create_date} ${data.create_time}`,
          read: isFromCurrentUser || shouldMarkAsRead, // Sender's messages are always marked as read
          type: "regular",
          chat_id: data.chat_id,
        };

        // If the message is not for the current chat, increment the unread count
        if (!isCurrentChat && !isFromCurrentUser) {
          setContacts((prevContacts) =>
            prevContacts.map((contact) =>
              contact.id === data.chat_id
                ? {
                    ...contact,
                    unreadCount: (contact.unreadCount || 0) + 1,
                    lastMessage: data.content,
                  }
                : contact
            )
          );
        }

        return [...prevMessages, newMessage];
      });

      // If the message is in view and from another user, mark it as read
      if (shouldMarkAsRead && data.id) {
        markMessageAsRead(data.id);
      }
    },
    [chatID, userID, markMessageAsRead]
  );

  const handleTypingEvent = useCallback((data) => {
    const isTyping = data.type === "typing";

    setTypingUsers((prev) => {
      const newState = { ...prev, [data.user_id]: isTyping };
      return newState;
    });
  }, []);

  const handleOnlineStatusUpdate = useCallback((data) => {
    setOnlineUsers((prev) => ({
      ...prev,
      [data.user_id]: data.is_online,
    }));
  }, []);

  const isOnline = currentChat?.participants?.some(
    (p) => onlineUsers[p.user_id]
  );

  const handleOnlineCountUpdate = useCallback((data) => {
    setOnlineUsersCount(data.count || 0);

    const newOnlineUsers = {};

    if (data.Users && Array.isArray(data.Users)) {
      data.Users.forEach((user) => {
        if (user && user.id) {
          newOnlineUsers[user.id] = true;
        }
      });
    }
    setOnlineUsers(newOnlineUsers);
  }, []);

  // API calls
  const fetchUser = async () => {
    try {
      const response = await api.get("v1/auth");
      const userData = response.data?.data;
      setUser(userData);
      setUserID(userData.id);
      return userData;
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("v1/auth/all");
      const userData = response.data?.data;
      const usersArray = Array.isArray(userData)
        ? userData
        : userData
        ? [userData]
        : [];
      setUsers(usersArray);
      return usersArray;
    } catch (error) {
      antMessage.error("Could not load users");
      throw error;
    }
  };

  const fetchChats = async () => {
    try {
      const response = await api.get("v1/chat");
      const chatsData = response.data?.data?.data || [];
      const formattedChats = [];

      for (const chat of chatsData) {
        // For each chat, fetch its participants
        try {
          const chatDetailResponse = await api.get(`v1/chat/${chat.id}`);
          const chatDetails = chatDetailResponse.data.data;

          formattedChats.push({
            id: chat.id,
            name: chat.name,
            isGroup: chat.is_group,
            lastMessage: chat.last_message,
            unreadCount: chat.unread_count,
            participants: chatDetails.chat_users || [],
          });
        } catch (detailError) {
          console.error(
            `Failed to fetch details for chat ${chat.id}:`,
            detailError
          );
          formattedChats.push({
            id: chat.id,
            name: chat.name,
            isGroup: chat.is_group,
            lastMessage: chat.last_message,
            unreadCount: chat.unread_count,
            participants: [],
          });
        }
      }

      setContacts(formattedChats);
      return formattedChats;
    } catch (error) {
      antMessage.error("Could not load chats");
      throw error;
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      // Fetch chat details
      const chatDetailResponse = await api.get(`v1/chat/${chatId}`);
      const chatDetails = chatDetailResponse.data.data;
      const participants = chatDetails.chat_users || [];

      // Set current chat with details
      setCurrentChat({
        id: chatDetails.id,
        name: chatDetails.name,
        isGroup: chatDetails.is_group,
        members: chatDetails.count_chat_user,
        participants: chatDetails.chat_users || [], // Use consistent naming
      });

      // Also update the contacts array to include participants
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === chatId
            ? { ...contact, participants: participants }
            : contact
        )
      );

      // Fetch chat messages
      const messagesResponse = await api.get(`v1/message/history/${chatId}`);
      const chatMessages =
        messagesResponse.data?.data || messagesResponse.data || [];

      // Transform the messages
      const formattedMessages = chatMessages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender_name,
        sender_id: msg.sender_id,
        timestamp: `${msg.create_date} ${msg.create_time}`,
        read: msg.read,
        type: msg.type || "regular",
      }));

      setMessages(formattedMessages);
    } catch (error) {
      antMessage.error("Could not load chat messages");
    }
  };

  // Chat actions
  const createChat = useCallback(
    async (isGroup, selectedUsers, groupName = "") => {
      try {
        const userIds = selectedUsers.map((user) => user.id);
        const payload = {
          is_group: isGroup,
          name: isGroup ? groupName : selectedUsers[0]?.first_name,
          users_id: userIds,
        };

        const response = await api.post("v1/chat", payload);

        if (response.data?.data) {
          const newChat = {
            id: response.data.data.id,
            name: response.data.data.name,
            isGroup: isGroup,
            lastMessage: "",
            unreadCount: 0,
          };

          setContacts((prevContacts) => [...prevContacts, newChat]);
          setCurrentChat(newChat);
          setChatID(newChat.id);
          loadChatMessages(newChat.id);

          antMessage.success("Chat created successfully!");
        }
      } catch (error) {
        antMessage.error("Could not create chat");
      }
    },
    []
  );

  const handleSend = useCallback(() => {
    if (!inputMessage.trim() || !currentChat || !socket) {
      return;
    }

    try {
      const messageData = {
        type: "get_message",
        chat_id: currentChat.id,
        sender_id: userID,
        content: inputMessage,
        timestamp: new Date().toISOString(),
      };

      socket.send(JSON.stringify(messageData));

      // Optimistically add message to the UI
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          tempId: Date.now(),
          content: inputMessage,
          sender: user?.first_name || "You",
          sender_id: userID,
          timestamp: new Date().toISOString(),
        },
      ]);

      setInputMessage("");

      // Stop typing indication
      sendTypingEvent(false);
    } catch (error) {
      antMessage.error("Could not send message");
    }
  }, [inputMessage, currentChat, socket, userID, user]);

  const sendTypingEvent = useCallback(
    (isTyping) => {
      if (socket && currentChat) {
        const typingData = {
          type: isTyping ? "typing" : "stopped_typing", // Set correct type
          chat_id: currentChat.id,
          user_id: userID, // Make sure this matches what server expects
          sender_name: user?.first_name || "You",
        };

        try {
          socket.send(JSON.stringify(typingData));
        } catch (error) {
          console.error("Failed to send typing event:", error);
        }
      }
    },
    [socket, currentChat, userID, user]
  );

  // UI event handlers
  const handleInputChange = useCallback(
    (e) => {
      const newMessage = e.target.value;
      setInputMessage(newMessage);
      sendTypingEvent(newMessage.length > 0);
    },
    [sendTypingEvent]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleContactClick = useCallback((contact) => {
    setCurrentChat(contact);
    setChatID(contact.id);
    loadChatMessages(contact.id);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearching((prev) => !prev);
  }, []);

  const toggleUserList = useCallback(() => {
    setShowUserList((prev) => !prev);
  }, []);

  const handleCall = useCallback(() => {
    antMessage.info("Initiating call...");
  }, []);

  const handleShareInvite = useCallback(() => {
    const dummyLink = `https://chat.example.com/invite/${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    navigator.clipboard
      .writeText(dummyLink)
      .then(() => {
        antMessage.success("Invite link copied to clipboard!");
      })
      .catch((err) => {
        antMessage.error("Failed to copy invite link");
      });
  }, []);

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;

    return messages.filter(
      (msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (msg.sender &&
          msg.sender.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [messages, searchQuery]);

  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      const response = await api.delete(`v1/chat/message/${messageId}`);

      if (response.status === 200) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== messageId)
        );
        antMessage.success("Message deleted successfully");
      }
    } catch (error) {
      antMessage.error("Failed to delete message");
    }
  }, []);

  // ShareIcon SVG component
  const ShareIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 8V6C14 5.46957 13.7893 4.96086 13.4142 4.58579C13.0391 4.21071 12.5304 4 12 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H12C12.5304 20 13.0391 19.7893 13.4142 19.4142C13.7893 19.0391 14 18.5304 14 18V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 12H20M20 12L16 8M20 12L16 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // CallIcon SVG component
  const CallIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.2218 11.3182C18.1588 11.1039 18.1224 10.8833 18.1224 10.6591C18.1224 10.4348 18.1588 10.2143 18.2218 10C18.5724 9.03347 19.4651 8.32609 20.5 8.13864V8.13864C21.8281 7.88095 22.5 6.75 21.9831 5.63068C21.6241 4.8254 20.9512 4.27402 20.1348 4.10044C18.8155 3.81993 17.4707 3.66551 16.1224 3.63864C10.5325 3.52212 5.57192 7.2429 4.32752 12.6136C3.8963 14.4171 3.8317 16.3105 4.12341 18.1364C4.30162 19.2955 5.18588 20.2429 6.32752 20.5V20.5C7.14139 20.681 7.95539 20.2358 8.14139 19.4091C8.20444 19.1948 8.24084 18.9742 8.24084 18.75C8.24084 18.5258 8.20444 18.3052 8.14139 18.0909C7.79079 17.1244 8.47807 16.0933 9.50002 16.0454C9.66229 16.0379 9.82521 16.034 9.98876 16.034C11.9835 16.034 13.9782 16.034 15.973 16.034C16.1365 16.034 16.2994 16.0379 16.4617 16.0454C17.4837 16.0933 18.1709 17.1244 17.8203 18.0909C17.7573 18.3052 17.7209 18.5258 17.7209 18.75C17.7209 18.9742 17.7573 19.1948 17.8203 19.4091C18.0063 20.2358 18.8203 20.681 19.6342 20.5V20.5C20.7758 20.2429 21.6601 19.2955 21.8383 18.1364C22.13 16.3105 22.0654 14.4171 21.6342 12.6136C21.5119 12.1184 21.3618 11.6159 21.1836 11.1364C20.9512 10.5227 20.336 10.1683 19.7233 10.3182C19.1106 10.4681 18.7649 11.0795 18.9973 11.6932C19.0785 11.9042 19.1518 12.1178 19.2164 12.3341C19.7131 14.0966 19.1659 16.0062 17.7218 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.channelName}>
              {currentChat ? currentChat.name : "Select a chat"}
            </div>
            <div className={styles.memberInfo}>
              {currentChat
                ? currentChat.isGroup
                  ? `${
                      currentChat.members || 0
                    } members, ${onlineUsersCount} online`
                  : onlineUsers[currentChat.participants?.[0]?.user_id]
                  ? "Online"
                  : "Offline"
                : "Select a chat"}
            </div>
          </div>
          <div className={styles.headerActions}>
            {/* <SearchOutlined
              className={`${styles.actionIcon} ${
                isSearching ? styles.activeIcon : ""
              }`}
              onClick={toggleSearch}
            />
            <ActionIcon
              icon={<ShareIcon />}
              title="Copy Invite Link"
              onClick={handleShareInvite}
            /> */}
            {/* <ActionIcon icon={<CallIcon />} title="Call" onClick={handleCall} /> */}
            {currentChat && (
              <ActionIcon
                icon={<EditOutlined />}
                title="Edit Chat"
                onClick={() => setShowEditModal(true)}
              />
            )}
          </div>
        </div>

        {isSearching && (
          <div className={styles.searchContainer}>
            <Input
              ref={searchInputRef}
              placeholder="Search in conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<SearchOutlined className={styles.searchInputIcon} />}
              className={styles.searchInput}
              allowClear
            />
          </div>
        )}

        <div className={styles.messagesContainer} ref={messagesContainerRef}>
          {filteredMessages.map((msg) => (
            <div
              key={msg.id || msg.tempId}
              className={`${styles.messageWrapper} ${
                msg.sender_id === userID
                  ? styles.sentMessage
                  : styles.receivedMessage
              }`}
              data-message-id={msg.id}
            >
              {msg.type === "system" ? (
                <div className={styles.systemMessage}>
                  <div className={styles.dateHeader}>{msg.date}</div>
                  <div className={styles.systemContent}>{msg.content}</div>
                </div>
              ) : (
                <div className={styles.messageContent}>
                  <div className={styles.messageHeader}>
                    <span className={styles.senderName}>{msg.sender}</span>
                    <span className={styles.messageTime}>{msg.timestamp}</span>
                  </div>
                  <div className={styles.sentContain}>
                    {msg.sender_id === userID && (
                      <>
                        <Popconfirm
                          title="Delete this message?"
                          onConfirm={() => handleDeleteMessage(msg.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button
                            icon={<DeleteOutlined />}
                            danger
                            type="text"
                            className={styles.deleteMessageButton}
                          />
                        </Popconfirm>
                        {/* <div className={styles.readStatus}>
                          {msg.read ? (
                            <CheckCircleOutlined />
                          ) : (
                            <CheckOutlined />
                          )}
                        </div> */}
                      </>
                    )}
                    <div className={styles.messageText}>{msg.content}</div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <TypingIndicator
            typingUsers={typingUsers}
            currentChat={currentChat}
          />
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputContainer}>
          <Input
            placeholder="Message"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            suffix={
              <SendOutlined
                onClick={handleSend}
                className={`${styles.sendIcon} ${
                  inputMessage.trim() ? styles.activeSend : ""
                }`}
              />
            }
            className={styles.messageInput}
          />
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.rightPanelHeader}>
          {/* <div className={styles.headerIcons}>
            <SearchOutlined className={styles.searchIcon} />
          </div> */}
          <div className={styles.headerIcons} onClick={toggleUserList}>
            <IoIosPeople />
          </div>
          <div className={styles.headerIcons}>
            <PlusCircleOutlined onClick={() => setShowGroupModal(true)} />
          </div>
        </div>
        <div className={styles.contact}>
          {showUserList ? (
            <UserList
              users={users}
              createChat={createChat}
              onClose={() => setShowUserList(false)}
            />
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className={`${styles.rightPanelItem} ${
                  currentChat?.id === contact.id ? styles.active : ""
                } ${contact.unreadCount ? styles.unread : ""}`}
                onClick={() => handleContactClick(contact)}
              >
                <div className={styles.rightPanelContent}>
                  <div className={styles.userAvatar}>
                    <Avatar size={36} className={styles.avatar}>
                      {contact.name ? contact.name.charAt(0) : "U"}
                    </Avatar>

                    {/* Show online indicator based on the user's online status */}
                    {!contact.isGroup &&
                      contact.participants &&
                      contact.participants.some(
                        (participant) => onlineUsers[participant.user_id]
                      ) && <div />}
                  </div>
                  <div className={styles.messageDetails}>
                    <div className={styles.rightSenderName}>
                      {contact.name}
                      {!contact.isGroup &&
                        contact.participants &&
                        contact.participants.some(
                          (participant) => onlineUsers[participant.user_id]
                        ) && <span className={styles.onlineText}> </span>}
                    </div>
                    <div className={styles.rightMessageContent}>
                      {contact.lastMessage}
                    </div>
                  </div>
                  <div className={styles.rightMessageMeta}>
                    <div className={styles.rightMessageTime}>
                      {contact.time}
                    </div>
                    {contact.unreadCount > 0 && (
                      <div className={styles.counter}>
                        {contact.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {currentChat && (
        <EditChatModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentChat={currentChat}
          users={users}
          onUpdate={() => {
            // Sohbet güncellendiğinde yapılacak işlemler
            loadChatMessages(currentChat.id);
            fetchChats();
          }}
        />
      )}
      <GroupChatModal
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        users={users}
        createChat={createChat}
      />
    </div>
  );
};

export default ChatInterface;
