/* eslint-disable react/prop-types */
import api from "../api/apifor";

export const fetchEmployeeData = async (id, token) => {
  const response = await api.get(`v1/employee/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};

export const formatPhoneNumber = (data) => {
  if (data && data.phone_number) {
    const formattedPhone = data.phone_number.replace(
      /^(\+993)(\d{2})(\d{3})(\d{3})$/,
      "$1 $2 $3$4"
    );

    return {
      ...data,
      phone_number: formattedPhone,
    };
  }
  return data;
};
