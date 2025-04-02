/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./updateEmp.module.scss";
import api from "../api/apifor";
import { Select, Button, Popconfirm, notification } from "antd";
import EmployeeBoard from "../taskmanagerEmployee/Board";
import { DeleteOutlined } from "@ant-design/icons";
import ProfileEdit from "../UpdateEmployee/index";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { IoIosAddCircle } from "react-icons/io";
import { useLanguage } from "../Language/LanguageContext";
import translations from "../Language/translation";
import { deleteDocument, fetchEmployeeById } from "../api/EmployeeServices";
import FormDetails from "../Form/FormDetails";
import { RiDeleteBin6Line } from "react-icons/ri";

import { GoDownload } from "react-icons/go";

const EmployeePage = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeInventory, setEmployeeInventory] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [selectedInventory, setSelectedInventory] = useState([]);
  const [quantity, setQuantity] = useState({});
  const { language } = useLanguage();
  const t = translations[language];

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await api.patch(`v1/task/${taskId}`, {
        status: newStatus.toLowerCase(),
      });

      if (response.data.status) {
        setEmployeeProfile((prev) => ({
          ...prev,
          task: prev.task.map((task) =>
            task.id === taskId
              ? { ...task, status: newStatus.toLowerCase() }
              : task
          ),
        }));

        notification.success({
          message: "Task Updated",
          description: `Task status successfully updated to ${newStatus}`,
        });
      }
    } catch (err) {
      console.error("Error updating task status:", err);
      notification.error({
        message: "Update Failed",
        description: "Failed to update task status. Please try again.",
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const employeeData = await fetchEmployeeById(id);
        const responseV2 = await api.get(`v1/employee/${id}`);
        setEmployee(employeeData);
        setDocuments(employeeData.documents || []);

        const tasks = employeeData.task || [];
        const inventories = responseV2.data.data.inventories || [];
        const existingInventory = inventories.map((item) => ({
          id: item.id,
          inventoryId: item.inventory.id,
          name: item.inventory.name,
          quantity: item.quantity,
        }));
        console.log(existingInventory);
        

        setEmployeeProfile({
          ...employeeData,
          task: tasks,
        });

        setEmployeeInventory(existingInventory);

        // Inventory data fetch
   const inventoryResponse = await api.get("v1/inventory", {
     headers: {
       Authorization: `Bearer ${getToken()}`,
     },
   });
   setInventoryList(inventoryResponse.data?.rows || []);


        if (inventoryResponse.data.rows) {
          setInventoryList(inventoryResponse.data.rows);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, t.errorFetchingEmployee]);

  const getToken = () => {
    const token = localStorage.getItem("v1/auth/login");
    if (!token) {
      throw new Error("Token tapylmady. Girizmegiňizi haýyş edýäris.");
    }
    return token;
  };

 const handleAddToEmployee = async () => {
   try {
       const token = getToken();
     if (!token) {
       console.error("No authentication token found");
       return;
     }

     const existingInventoryIds = employeeInventory.map(
       (item) => item.inventoryId
     );

     const duplicateInventory = selectedInventory.find((inventoryId) =>
       existingInventoryIds.includes(inventoryId)
     );

     if (duplicateInventory) {
       notification.warning({
         message: "Inventory Exists",
         description: `The inventory "${
           inventoryList.find((item) => item.id === duplicateInventory)?.name
         }" already exists for this employee.`,
       });
       return;
     }

     const inventoryToAdd = selectedInventory.map((inventoryId) => ({
       employee_id: parseInt(id),
       inventory_id: parseInt(inventoryId),
       quantity: parseInt(quantity[inventoryId] || 1),
     }));

     console.log("Sending request to add inventory:", inventoryToAdd);

     const responses = await Promise.all(
       inventoryToAdd.map((item) =>
         api.post(`v1/employee-inventory`, item).catch((err) => {
           console.error("Error adding inventory:", err);
           return null;
         })
       )
     );

     console.log("API Responses:", responses);

     const successfulResponses = responses.filter((res) => res !== null);

     const newEmployeeInventory = successfulResponses.map((response) => ({
       id: response.data.id,
       inventoryId: response.data.inventory_id,
       name: inventoryList.find(
         (item) => item.id === response.data.inventory_id
       )?.name,
       quantity: response.data.quantity,
     }));

     setEmployeeInventory((prev) => [...prev, ...newEmployeeInventory]);
     setSelectedInventory([]);
     setQuantity({});
   } catch (err) {
     console.error("Error adding inventory to employee:", err);
     setError("Error adding inventory to employee.");
   }
 };

  const handleDeleteDocument = async (docId) => {
    try {
      await deleteDocument(docId);
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== docId));
    } catch (err) {
      setError(t.errorDeletingDocument);
    }
  };

  const checkExpiry = (expiryDate) => {
    if (!expiryDate) {
      return "";
    }

    const currentDate = new Date();
    const expiry = new Date(expiryDate.split("-").reverse().join("-"));

    if (expiry < currentDate) {
      return "Wagty Geçen";
    } else {
      return "Aktiw";
    }
  };

   const handleUpdateQuantity = async (employeeInventoryId, change) => {
     try {
   const token = getToken();
       if (token) {
         const updatedItem = employeeInventory.find(
           (item) => item.id === employeeInventoryId
         );

         if (!updatedItem) {
           console.error("Employee inventory item not found.");
           return;
         }

         const updatedQuantity = updatedItem.quantity + change;

         if (updatedQuantity <= 0) {
           await handleRemoveFromEmployee(employeeInventoryId);
         } else {
           const payload = {
             employee: id,
             inventory: updatedItem.inventoryId,
             quantity: updatedQuantity,
           };

           await api.put(
             `v1/employee-inventory/${employeeInventoryId}`,
             payload
           );

           setEmployeeInventory((prev) =>
             prev.map((item) =>
               item.id === employeeInventoryId
                 ? { ...item, quantity: updatedQuantity }
                 : item
             )
           );
         }
       }
     } catch (err) {
       console.error("Error updating inventory quantity:", err);
       setError("Error updating inventory quantity.");
     }
   };

  const handleRemoveFromEmployee = async (employeeInventoryId) => {
    try {
   const token = getToken();
      if (token) {
        await api.delete(`v1/employee-inventory/${employeeInventoryId}`);

        setEmployeeInventory((prev) =>
          prev.filter((item) => item.id !== employeeInventoryId)
        );
      }
    } catch (err) {
      console.error("Error removing inventory from employee:", err);
      setError("Error removing inventory from employee.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!employeeProfile) return <div>No_employee_data_found</div>;

  return (
    <>
      <div className={styles.employeePage}>
        <ProfileEdit />
        <div className={styles.inventoryContainer}>
          {employeeInventory.length === 0 && (
            <div className={styles.background}>
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M36 6.5C36 2.91015 33.0899 0 29.5 0H6.5C2.91015 0 0 2.91015 0 6.5V29.5C0 33.0899 2.91015 36 6.5 36H20.3436C20.1124 35.2667 20 34.5082 20 33.75V33.544C20 33.3604 20.0089 33.179 20.0263 33H6.5C4.567 33 3 31.433 3 29.5V11H33V16.2899C34.1523 16.6328 35.1803 17.2645 36 18.101V6.5ZM6.5 3H29.5C31.433 3 33 4.567 33 6.5V8H3V6.5C3 4.567 4.567 3 6.5 3ZM36 23C36 25.7614 33.7614 28 31 28C28.2386 28 26 25.7614 26 23C26 20.2386 28.2386 18 31 18C33.7614 18 36 20.2386 36 23ZM40 33.75C40 36.863 37.4286 40 31 40C24.5714 40 22 36.8748 22 33.75V33.544C22 31.5859 23.5874 30 25.5455 30H36.4545C38.4126 30 40 31.5859 40 33.544V33.75Z"
                  fill="#8A8C98"
                />
              </svg>
              <h2>Add inventory to your employee</h2>
              <p>Just click the add inventory field to add it</p>
            </div>
          )}
          <div className={styles.mainInventory}>
            <div className={styles.employeeInventory}>
              {employeeInventory.length === 0 ? (
                <p style={{ color: "orange" }}>No assigned inventory</p>
              ) : (
                <ul>
                  {employeeInventory.map((item) => (
                    <li style={{ color: "#f1f1f1" }} key={item.id}>
                      {item.name}
                      <div
                        style={{
                          gap: "10px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Button
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className={styles.increaseButton}
                        >
                          +
                        </Button>
                        <Button>{item.quantity}</Button>
                        <Button
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className={styles.decreaseButton}
                          type="default"
                        >
                          -
                        </Button>
                        <Popconfirm
                          title="Are you sure you want to remove this item?"
                          onConfirm={() => handleRemoveFromEmployee(item.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button
                            className={styles.removeButton}
                            danger
                            icon={<DeleteOutlined />}
                          ></Button>
                        </Popconfirm>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Select Inventory"
              value={selectedInventory}
              onChange={(values) => setSelectedInventory(values)}
              options={(inventoryList || []).map((item) => ({
                label: item.name,
                value: item.id,
              }))}
              showSearch
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              dropdownClassName="custom-select-dropdown"
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <div
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      width: "100%",
                    }}
                  >
                    <Button
                      type="primary"
                      onClick={handleAddToEmployee}
                      disabled={selectedInventory.length === 0}
                      style={{
                        width: "100%",
                        background: "#454648",
                        boxShadow: "none",
                      }}
                    >
                      <IoIosAddCircle />
                      Add to Employee
                    </Button>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </div>
      <DndProvider backend={HTML5Backend}>
        <div className={styles.taskManager}>
          <h1>Task Management Board</h1>
          <EmployeeBoard
            tasks={employeeProfile?.task || []}
            updateTaskStatus={updateTaskStatus}
          />
        </div>
      </DndProvider>
      <div className="p-6 shadow-lg mt-[10px] bg-[#212224] w-full rounded-lg">
        <div className="flex justify-between">
          <h3 className="text-xl font-semibold mb-6 text-white">
            {t.empDDokumentler}
          </h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#138565] text-white px-4 py-2 rounded-[10px] hover:bg-green-600 transition duration-300"
          >
            {t.empDDokumentGos}
          </button>
        </div>

        <div className="flex sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {documents.length > 0 ? (
            documents.map((doc) => {
              return (
                <div
                  key={doc.id}
                  className="bg-[#333] p-4 rounded-lg w-[200px] h-[204px]"
                >
                  <div className="flex flex-col items-start mb-3">
                    <p className="font-bold text-lg">{doc.type}</p>
                    <h4 className="text-lg font-semibold text-white mb-1">
                      {doc.name}
                    </h4>
                  </div>
                  <div className="flex justify-between items-center mt-14">
                    <div>
                      {doc.expiry_date && (
                        <p
                          className={`text-xs mt-8 px-2 py-1 rounded-full ${
                            checkExpiry(doc.expiry_date) === "Wagty Geçen"
                              ? "text-red-600"
                              : "text-green-700"
                          }`}
                        >
                          {doc.expiry_date}
                        </p>
                      )}
                    </div>
                    <div className="flex mt-8 gap-2">
                      <GoDownload
                        className="text-white hover:text-gray-300 cursor-pointer"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = doc.file_path;
                          link.download = doc.name;
                          link.click();
                        }}
                      />
                      <RiDeleteBin6Line
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                        onClick={() => handleDeleteDocument(doc.id)}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="col-span-1 sm:col-span-2 xl:col-span-4 text-center text-white">
              No documents available
            </p>
          )}
        </div>
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-[#3E3E3E] p-6 rounded-lg shadow-lg w-100">
              <FormDetails
                employeeId={id}
                onClose={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EmployeePage;
