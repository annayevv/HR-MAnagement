import api from "../api/apifor";

const getAuthHeaders = () => {
  const token = localStorage.getItem("v1/auth/login");
  if (!token)
    throw new Error("Authentication token is missing. Please log in.");
  return { Authorization: `Bearer ${token}` };
};

const API_BASE_URL = "http://192.168.4.58/api/v1/time_sheet";

const handleAxiosError = (err, defaultMessage) => {
  if (err.response) {
    console.error("Response error:", err.response.data);
    throw new Error(
      err.response.data.message || `Server Error: ${err.response.statusText}`
    );
  }
  console.error("Request error:", err);
  throw new Error(defaultMessage || "An unknown error occurred.");
};

// GET: Fetch timesheet data
export const fetchTimesheetData = async (
  dateBegin,
  dateEnd,
  timeBegin = "00:00:00",
  timeEnd = "23:00:00"
) => {
  try {
    const params = {
      date_begin: dateBegin,
      date_end: dateEnd,
      time_begin: timeBegin,
      time_end: timeEnd,
    };

    const response = await api.get(API_BASE_URL, {
      headers: getAuthHeaders(),
      params,
    });

    if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data.Data)
    ) {
      return response.data.data.Data;
    }

    console.warn("Unexpected response structure:", response.data);
    return [];
  } catch (err) {
    handleAxiosError(err, "Failed to fetch timesheet data.");
    return [];
  }
};

// DELETE: Delete timesheet entry
export const deleteTimesheetEntry = async (entryId) => {
  try {
    const response = await api.delete(
      `http://192.168.4.58/api/v1/time_sheet/${entryId}`,
      {
        headers: getAuthHeaders(),
      }
    );
    console.log("Deleted Entry Response:", response.data);
    return response.data.Data;
  } catch (err) {
    handleAxiosError(err, "Failed to delete timesheet entry.");
  }
};

// GET: Fetch employees
export const fetchEmployees = async () => {
  try {
    const response = await api.get(`http://192.168.4.58/api/v1/employee`, {
      headers: getAuthHeaders(),
    });
    return response.data.data || [];
  } catch (err) {
    handleAxiosError(err, "Failed to fetch employees.");
    return [];
  }
};

// GET: Fetch day types
export const fetchDayTypes = async () => {
  try {
    const response = await api.get(`http://192.168.4.58/api/v1/dayType`, {
      headers: getAuthHeaders(),
    });

    return response.data.data || [];
  } catch (err) {
    handleAxiosError(err, "Failed to fetch day types.");
  }
};

// POST: Submit worked hours
export const submitWorkedHours = async (employeeId, date, time) => {
  try {
    const payload = {
      employee_id: employeeId,
      date,
      type: "Worked",
      time: time || "00:00:00",
    };

    console.log("Payload being sent:", JSON.stringify(payload, null, 2));

    const response = await api.post(
      `http://192.168.4.58/api/v1/time_sheet`,
      payload,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Submit Worked Hours Response:", response.data);
    return response.data.Data || {};
  } catch (err) {
    if (err.response) {
      console.error("Response error:", err.response.data);
      if (err.response.data.code === "SE-00013") {
        console.error("Employee ID not found. Please verify the ID.");
      }
    }
    handleAxiosError(err, "Failed to submit worked hours.");
  }
};

export const submitDayType = async (employeeId, date, type) => {
  const payload = {
    employee_id: employeeId,
    date,
    type,
  };

  if (type === "Worked") {
    payload.time = "00:00:00";
  }

  console.log("Payload being sent:", JSON.stringify(payload, null, 2));

  try {
    const response = await api.post(
      "http://192.168.4.58/api/v1/time_sheet",
      payload,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Submit Day Type Response:", response.data);
    return response.data.data || {};
  } catch (err) {
    handleAxiosError(err, "Failed to submit day type.");
  }
};
