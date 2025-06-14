import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Login from "./Components/Login";
import Navbar from "./Components/Navbar";
import DocumentForm from "./Form/DocumentForm";
import EmployeesList from "./Employee/EmployeesList";
import EmployeeDetails from "./Employee/EmployeeDetails";
import { AuthProvider, useAuth } from "./Components/AuthContext";
import NewDoc from "./Form/NewDocForm";
import FormDetails from "./Form/FormDetails";
import EditDocForm from "./Form/EditDocForm";
import User from "./action/UserList";
import TimeSheet from "./TimeSheet/TimeSheet";
import UserList from "./action/UserList";
import { LanguageProvider } from "./Language/LanguageContext";
import Diagramma from "./TimeSheet/Diagramma";
import Dashboard from "./Dashboard/Dashboard";
import { BsChatText } from "react-icons/bs";
import Chat from "./Chatting/Chat";
import TaskManager from "./TaskManagers/TaskManager";
import CreateInventory from "./CreateInventory/CreateInventory";
import InventoryDetail from "./InventoryDetails/InventoryDetail";
import ChatModal from "./Chatting/Chat";

function App() {
  return (
    <div>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <AppContent />
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false); // Add state to handle chat visibility
  const [isChatModalVisible, setIsChatModalVisible] = useState(false);

  const showChatModal = () => {
    setIsChatModalVisible(true);
  };

  // Function to hide the chat modal
  const hideChatModal = () => {
    setIsChatModalVisible(false);
  };
  return (
    <>
      {location.pathname !== "/HrManagement/Login" && (
        <>
          <Navbar setSearchQuery={setSearchQuery} />

          {/* Chat button */}
          <div
            className="flex justify-center items-center cursor-pointer text-white fixed bottom-5 right-5 py-[8px] px-[10px] bg-[#2A2A2A] h-12 w-20 z-50 rounded-[10px]"
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              if (!isChatOpen) {
                showChatModal();
              } else {
                hideChatModal();
              }
            }}
          >
            <BsChatText size={26} />

            <button className="text-white ml-[6px] shadow-lg">Chat</button>
          </div>

          {isChatOpen && (
            <>
              <Chat onClose={() => setIsChatOpen(false)} />
              {/* Pass the isChatModalVisible to ChatModal */}
              {isChatModalVisible && (
                <ChatModal
                  visible={isChatModalVisible}
                  onClose={hideChatModal}
                />
              )}
            </>
          )}
        </>
      )}

      <Routes>
        <Route
          path="/oraz/EmployeesList"
          element={<EmployeesList searchQuery={searchQuery} />}
        />
        <Route path="/oraz/Chat" element={<Chat />} />
        <Route path="/oraz/Login" element={<LoginPage />} />
        <Route path="/oraz/timesheet" element={<TimeSheet />} />
        <Route path="/oraz/employee/:id" element={<EmployeeDetails />} />
        <Route path="/oraz/user" element={<User />} />
        <Route
          path="/oraz/employee-details/:id"
          element={<EmployeeDetails />}
        />
        <Route path="/oraz/add-document" element={<NewDoc />} />
        <Route path="/oraz/edit-document/:id" element={<EditDocForm />} />
        <Route path="/oraz/DocumentForm" element={<DocumentForm />} />
        <Route path="/oraz/TaskManager" element={<TaskManager />} />
        <Route path="/oraz/users" element={<UserList />} />
        <Route path="/oraz/" element={<Navigate to="/oraz/Login" replace />} />
        <Route path="/oraz/Dashboard" element={<Dashboard />} />
        <Route path="/oraz/form" element={<FormDetails />} />
        <Route path="/oraz/diagramma" element={<Diagramma />} />

        {/* Inventory Routes */}
        <Route path="/oraz/createInventory" element={<CreateInventory />} />
        <Route
          exact
          path="/oraz/inventory-detail/:id"
          element={<InventoryDetail />}
        />
      </Routes>
    </>
  );
}

const LoginPage = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/oraz/Dashboard" replace />;
  }
  return <Login />;
};

export default App;
