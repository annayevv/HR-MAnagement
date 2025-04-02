import api from "../api/apifor";

const API_BASE_URL = "http://192.168.4.58/api/v1/employee";

const getToken = () => {
  const token = localStorage.getItem("v1/auth/login");
  if (!token) {
    throw new Error("Token tapylmady. Girizmegiňizi haýyş edýäris.");
  }
  return token;
};
export const patchEmployeeUserId = async (employeeId, newUserId) => {
  try {
    const token = getToken();
    const payload = { user_id: newUserId };
    const response = await api.patch(
      `http://192.168.4.58/api/v1/employee/${employeeId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("Error patching user id:", error.message);
    throw error;
  }
};

export const fetchEmployees = async (params = {}) => {
  try {
    const token = getToken();
    const response = await api.get(API_BASE_URL, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error(
      "Fetch Employees Error Details:",
      error.response?.data || error.message
    );
    throw new Error("Işgärleriň maglumatlaryny almakda ýalňyşlyk ýüze çykdy.");
  }
};

// Işgäriň maglumatlaryny ID arkaly almak
export const fetchEmployeeById = async (id) => {
  try {
    const token = getToken();
    const response = await api.get(`${API_BASE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.data;
  } catch (err) {
    console.error("Error fetching employee by ID:", err);
    throw new Error("Işgäriň maglumatlaryny almakda ýalňyşlyk ýüze çykdy.");
  }
};
// isgar gosmak
export const addEmployee = async (formData) => {
  const data = new FormData();

  Object.keys(formData).forEach((key) => {
    if (formData[key]) {
      data.append(key, formData[key]);
    }
  });

  try {
const token = getToken();

    if (!token) {
      throw new Error("Token is missing.");
    }

    const response = await api.post(
      "http://192.168.4.58/api/v1/employee",
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  } catch (err) {
    console.error(
      "Error during API request:",
      err.response?.data || err.message
    );
    throw new Error("Işgär goşmakda ýalňyşlyk ýüze çykdy.");
  }
};

export const fetchUserById = async (userId) => {
  try {
    const token = getToken();
    const response = await api.get(`/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error("Fetch User Error:", error);
    throw new Error("Ulanyjy tapylmady.");
  }
};

export const updateEmployeeWithAvatar = async (id, formData, avatarFile) => {
  const data = new FormData();

  Object.keys(formData).forEach((key) => {
    if (formData[key] !== undefined && formData[key] !== null) {
      data.append(key, formData[key]);
    }
  });

  if (avatarFile) {
    data.append("avatar", avatarFile);
  }

  try {
    const token = getToken();
    const response = await api.put(
      `http://192.168.4.58/api/v1/employee/${id}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    if (err.response) {
      throw new Error(
        `Error: ${err.response.data.message || "Failed to update employee"}`
      );
    } else if (err.request) {
      throw new Error("No response from server while updating employee.");
    } else {
      throw new Error(`Error setting up request: ${err.message}`);
    }
  }
};

export const deleteEmployee = async (id) => {
  try {
    const token = getToken();
    await api.delete(`${API_BASE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    throw new Error("Işgäri pozmakda ýalňyşlyk ýüze çykdy.");
  }
};

export const deleteDocument = async (docid) => {
  try {
    const token = getToken();
    console.log("Token:", token);
    await api.delete(`http://192.168.4.58/api/v1/doc/${docid}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(`Document with ID ${docid} deleted successfully.`);
  } catch (err) {
    console.error("Error deleting document:", err);
    throw new Error("Dokumenti pozmakda ýalňyşlyk ýüze çykdy.");
  }
};

export const fetchUsers = async () => {
  try {
    const token = getToken();
    const response = await api.get(`${API_BASE_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.results || [];
  } catch (err) {
    throw new Error("Ulanyjylary almakda ýalňyşlyk ýüze çykdy.");
  }
};
