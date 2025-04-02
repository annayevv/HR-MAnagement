import { useState } from "react";
import api from "../api/apifor";

const useEmployees = () => {
  const [employees, setEmployees] = useState([]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/v1/auth/all");
      const employeesData = Array.isArray(response.data.data)
        ? response.data.data
        : [response.data.data];
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  return { employees, fetchEmployees };
};

export default useEmployees;
