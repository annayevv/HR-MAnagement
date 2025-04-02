import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEmployees } from "../api/EmployeeServices";
import { useLanguage } from "../Language/LanguageContext";
import translations from "../Language/translation";
import { IoMdAdd } from "react-icons/io";

import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { addEmployee } from "../api/EmployeeServices";

import { FaArrowRight } from "react-icons/fa6";

const EmployeesList = ({ searchQuery }) => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 10;
  const [showAddEmployeesModal, setShowAddEmployeeModal] = useState(false);

  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const data = await fetchEmployees({});
        const employeesData = Array.isArray(data) ? data : [];
        setEmployees(employeesData);
        setFilteredEmployees(employeesData);
      } catch (err) {
        console.error("Error fetching employees:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadEmployees();
  }, []);

  useEffect(() => {
    if (searchQuery?.results) {
      setFilteredEmployees(searchQuery.results);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchQuery, employees]);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    birth_date: "",
    hire_date: "",
    resign_date: "",
    phone_number: "+993",
    position: "",
    avatar: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {}, []);

  const handlePhoneChange = (value) => {
    setFormData({ ...formData, phone_number: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, avatar: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log("Form Data Before Submit:", formData);

    try {
      const formattedFormData = {
        ...formData,
        birth_date: formData.birth_date
          ? new Date(formData.birth_date).toISOString().split("T")[0]
          : "",
        hire_date: formData.hire_date
          ? new Date(formData.hire_date).toISOString().split("T")[0]
          : "",
        resign_date: formData.resign_date
          ? new Date(formData.resign_date).toISOString().split("T")[0]
          : "",
      };

      console.log("Formatted Form Data:", formattedFormData);

      await addEmployee(formattedFormData);

      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        birth_date: "",
        hire_date: "",
        resign_date: "",
        phone_number: "+993",
        position: "",
        avatar: null,
      });

  setShowAddEmployeeModal(false);
    } catch (err) {
      console.error("Error during employee addition:", err);
      setError(err.message || "Işgär goşmakda ýalňyşlyk ýüze çykdy.");
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) return <p className="text-center">Loading...</p>;
  if (error)
    return <p className="text-center text-red-500 font-bold mt-5">{error}</p>;

  return (
    <div
      className="min-h-screen p-5 font-inter"
      style={{ backgroundColor: "black", color: "#ffffff" }}
    >
      <div className="flex justify-end mb-4">
        <button
          className="flex items-center px-5 py-3 rounded-md mr-2 text-white hover:bg-gray-700 transition"
          style={{ backgroundColor: "#2A2A2A" }}
          onClick={() => navigate("/oraz/timesheet")}
        >
          {t.timeIsgarHasap}
        </button>
        <button
          className="flex items-center bg-gray-700 px-5 py-3 rounded-md text-white hover:bg-gray-700 transition"
          style={{ backgroundColor: "#2A2A2A" }}
          onClick={() => {
            setShowAddEmployeeModal(true);
          }}
        >
          <IoMdAdd className=" text-white text-md rounded-xl mr-2" />
          {t.empAddEmployee}
        </button>
      </div>

      <table className="w-full text-left font-inter bg-black">
        <thead>
          <tr style={{ color: "#ffffff" }}>
            <th className="p-8 text-gray-500">{t.empAName}</th>
            <th className="p-8 pl-32 text-gray-500">{t.empALastN}</th>
            <th className="p-8 pl-32 text-gray-500">{t.empAPosition}</th>
            <th className="p-8 text-gray-500">{t.empAPhone}</th>
            <th className="p-8 text-gray-500">Email</th>
          </tr>
        </thead>
        <tbody>
          {currentEmployees.map((employee) => (
            <tr
              key={employee.id}
              className="cursor-pointer"
              style={{ color: "#ffffff" }}
              onClick={() => navigate(`/oraz/employee/${employee.id}`)}
            >
              <td className="flex items-center">
                <img
                  src={employee.avatar || "/default-avatar.jpg"}
                  alt={`${employee.first_name} avatar`}
                  className="w-10 h-10 rounded-full mr-4"
                />
                {employee.first_name}
              </td>
              <td className="p-5 pl-32 border-gray-700">
                {employee.last_name}
              </td>
              <td className="p-5 pl-32 border-gray-700">{employee.position}</td>
              <td className="p-5 border-gray-700 pr-0">
                {employee.phone_number}
              </td>
              <td className="p-5 border-gray-700 pr-0">{employee.email}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <button
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded-l-md hover:bg-gray-400"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          {t.docYza}
        </button>
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index}
            className={`px-4 py-2 text-sm sm:text-base ${
              currentPage === index + 1
                ? "bg-gray-700 text-white"
                : "bg-gray-200"
            } hover:bg-gray-700 rounded-md mx-1`}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        <button
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded-r-md hover:bg-gray-400"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          {t.docOne}
        </button>
      </div>

      {/* Modal */}
      {showAddEmployeesModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 transition-opacity duration-300 ease-out">
          <div
            className="h-[660px] mx-auto p-6"
            style={{ backgroundColor: "#252525", color: "#ffffff" }}
          >
            <h1 className="text-2xl font-bold text-center mb-6">
              {t.empAGosmak}
            </h1>

            {error && (
              <p className="text-center text-red-500">
                {JSON.stringify(error)}
              </p>
            )}
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
              <div className="flex mb-6  items-start">
                <div className="w-1/3">
                  <label className="block font-semibold mb-2 text-center">
                    {t.empAAvatar}
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full flex items-center p-3 border h-[240px] bg-[#333] text-white border-gray-400 rounded-lg"
                  />
                </div>

                <div className="w-2/3 pl-4 mt-[10px]">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label
                        className="block font-semibold"
                        htmlFor="first_name"
                      >
                        {t.empAName}
                      </label>
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="w-full p-3 border bg-[#333] text-white border-gray-400 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label
                        className="block font-semibold"
                        htmlFor="last_name"
                      >
                        {t.empALastN}
                      </label>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="w-full p-3 border bg-[#333] text-white border-gray-400 rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block font-semibold" htmlFor="position">
                      {t.empAPosition}
                    </label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className="w-full p-3 border bg-[#333] text-white border-gray-400 rounded-lg"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block font-semibold" htmlFor="birth_date">
                      {t.empABirth}
                    </label>
                    <input
                      type="date"
                      id="birth_date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleChange}
                      className="w-full p-3 border bg-[#333] text-white border-gray-400 rounded-lg"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block font-semibold" htmlFor="hire_date">
                    {t.empAHireDate}
                  </label>
                  <input
                    type="date"
                    id="hire_date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleChange}
                    className="w-full p-3 border bg-[#333] text-white border-gray-400 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold" htmlFor="resign_date">
                    {t.empDIsdenCykan}
                  </label>
                  <input
                    type="date"
                    id="resign_date"
                    name="resign_date"
                    value={formData.resign_date}
                    onChange={handleChange}
                    className="w-full p-3 border bg-[#333] text-white border-gray-400 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block font-semibold" htmlFor="phone_number">
                    {t.empAPhone}
                  </label>
                  <PhoneInput
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={handlePhoneChange}
                    className="w-full p-3 border bg-[#333] text-black border-gray-400 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold" htmlFor="email">
                    {t.empAGmail}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 border bg-[#333] text-white border-gray-400 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="bg-[#333] text-white px-4 py-2 rounded-md transition"
                  onClick={() => setShowAddEmployeeModal(false)}
                >
                  {t.userCCancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#333] text-white px-4 py-2 rounded-md transition"
                >
                  {loading ? t.empALoading : t.empAAdamGos}
                </button>
                <div className="flex items-center justify-center px-4 py-2 rounded-md bg-[#333]">
                  <button
                    type="button"
                    className=" text-white  transition"
                    onClick={handleSubmit}
                  >
                    {t.empAAdamGosNext}
                  </button>
                  <FaArrowRight className="" />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesList;
