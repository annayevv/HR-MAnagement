import axiosInstance from "../api/axiosInstance";

export const fetchEmployees = async () => {
  try {
    const response = await axiosInstance.get("/employees/");
    return response.data.results || [];
  } catch (err) {
    throw new Error("Işgärleriň sanawyny almakda ýalňyşlyk ýüze çykdy.");
  }
};

export const addEmployee = async (formData) => {
  const data = new FormData();
  Object.keys(formData).forEach((key) => {
    if (formData[key]) {
      data.append(key, formData[key]);
    }
  });

  try {
    const response = await axiosInstance.post("/employees/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (err) {
    throw new Error("Işgär goşmakda ýalňyşlyk ýüze çykdy.");
  }
};
