import api from "../api/apifor";

// Add a new document
export const postDocument = async (formDataToSend, token) => {
  try {
    const response = await api.post(
      "http://192.168.4.58/api/v1/doc",
      formDataToSend,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    if (error.response) {
      console.error("API error response:", error.response.data);
      throw new Error(error.response.data.detail || "API Error");
    } else {
      console.error("API error:", error.message);
      throw new Error("Network or server error");
    }
  }
};



// Fetch all documents
export const fetchDocuments = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await api.get("http://192.168.4.58/api/v1/doc", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.results || response.data.data || [];
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
};

// Delete a document by ID
export const deleteDocument = async (id) => {
  if (!id || isNaN(Number(id))) throw new Error("Invalid or missing ID!");
  try {
    const token = localStorage.getItem("token");
    await api.delete(`http://192.168.4.58/api/v1/doc/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

// Update a document by ID
export const updateDocument = async (id, formData) => {
  if (!id || isNaN(Number(id))) throw new Error("Invalid or missing ID!");
  try {
    const token = localStorage.getItem("token");
    await api.put(`http://192.168.4.58/api/v1/doc/${id}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error updating document:", error.response?.data || error);
    throw error;
  }
};

// Fetch a document by ID
export const fetchDocumentById = async (id) => {
  if (!id || isNaN(Number(id))) throw new Error("Invalid or missing ID!");
  try {
    const token = localStorage.getItem("token");
    const response = await api.get(`http://192.168.4.58/api/v1/doc/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching document by ID:", error);
    throw error;
  }
};

// Check expiry status of a document
export const checkExpiry = (expiryDate) => {
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

// Fetch all employees
export const fetchEmployees = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await api.get("http://192.168.4.58/api/v1/employee", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};
