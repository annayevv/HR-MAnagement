/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import debounce from "lodash.debounce";
import { useLanguage } from "../Language/LanguageContext";
import translations from "../Language/translation";
import { CgHomeAlt, CgUser } from "react-icons/cg";
import { IoDocumentsOutline } from "react-icons/io5";
import { IoPeopleSharp } from "react-icons/io5";
import api from "../api/apifor";
import { AiOutlineAppstore } from "react-icons/ai";
import { BsBoxSeam } from "react-icons/bs";

const Navbar = ({ setSearchQuery }) => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hireDateStart, setHireDateStart] = useState("");
  const [hireDateEnd, setHireDateEnd] = useState("");
  const [resignDateStart, setResignDateStart] = useState("");
  const [resignDateEnd, setResignDateEnd] = useState("");
  const [userID, setUserId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { language, changeLanguage } = useLanguage();
  const t = translations[language];
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/oraz/Login");
  };

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  const getToken = () => {
    const token = localStorage.getItem("v1/auth/login");
    if (!token) {
      throw new Error("Token tapylmady. Girizmegiňizi haýyş edýäris.");
    }
    return token;
  };

  const fetchUsers = () => {
    api
      .get("v1/auth")
      .then((response) => {
        const userData = response.data?.data;
        setUser(userData);
      })
      .catch((error) => {
        console.log("Failed to fetch user:", error);
      });
  };

  const handleSearch = useCallback(
    debounce(async () => {
      const rawPayload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        hire_start_date: hireDateStart,
        hire_end_date: hireDateEnd,
        position: position.trim(),
        email: email.trim(),
        birth_month: birthMonth,
        phone_number: phoneNumber.trim(),
        resign_start_date: resignDateStart,
        resign_end_date: resignDateEnd,
        user_id: userID ? parseInt(userID, 10) : "",
      };

      const payload = Object.fromEntries(
        Object.entries(rawPayload).filter(
          ([, value]) => value !== null && value !== undefined && value !== ""
        )
      );

      console.log("Sending payload for search:", payload);

      try {
        const token = getToken();
        if (!token) {
          throw new Error("Authorization token is missing!");
        }

        const response = await api.post(
          "http://192.168.4.58/api/v1/employee/search",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const queryString = Object.entries(payload)
          .map(([key, value]) => `${key}:${value}`)
          .join(" ");
        const lowerCaseQuery = queryString.toLowerCase();

        setSearchQuery({
          query: lowerCaseQuery,
          rawQuery: payload,
          results: response.data.data,
        });
      } catch (error) {
        console.error("Error during search:", error.message);
      }
    }, 300),
    [
      firstName,
      lastName,
      hireDateStart,
      hireDateEnd,
      position,
      email,
      birthMonth,
      phoneNumber,
      resignDateStart,
      resignDateEnd,
      userID,
    ]
  );

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
  };

  const toggleModal = () => setShowModal(!showModal);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <nav
      className="mt-2 mx-[10px] w-[98.5%]  p-4 rounded-[16px] h-[55px] flex items-center"
      style={{ backgroundColor: "#212224", color: "#ffffff" }}
    >
      <div className="w-[98.5%] flex justify-center md:justify-between items-center">
        <div className="flex space-x-8">
          <div
            onClick={() => navigate("/oraz/Dashboard")}
            className={`flex items-center pr-[5px] ${
              isActive("/oraz/Dashboard")
                ? "bg-white text-gray-500"
                : " border-[#2A2A2A] bg-[#2A2A2A] border-solid  text-white"
            } rounded-lg`}
          >
            <CgHomeAlt
              onClick={() => navigate("/oraz/Dashboard")}
              className="cursor-pointer"
            />
            <Link to="/oraz/Dashboard" className="rounded-lg ">
              {t.dashbaordN}
            </Link>
          </div>
          <div
            className={`flex items-center  ${
              isActive("/oraz/EmployeesList")
                ? "bg-white text-gray-500"
                : " border-[#2A2A2A] bg-[#2A2A2A] border-solid text-white"
            } rounded-lg`}
          >
            <CgUser
              onClick={() => navigate("/oraz/EmployeesList")}
              className="cursor-pointer"
            />
            <Link to="/oraz/EmployeesList" className="px-1 py-2 rounded-lg">
              {t.navEmp}
            </Link>
          </div>
          <div
            className={`flex items-center  ${
              isActive("/oraz/DocumentForm")
                ? "bg-white text-gray-500"
                : " border-[#2A2A2A] bg-[#2A2A2A] border-solid text-white"
            } rounded-lg`}
          >
            <IoDocumentsOutline
              onClick={() => navigate("/oraz/DocumentForm")}
              className="cursor-pointer"
            />
            <Link to="/oraz/DocumentForm" className="px-1 py-2 rounded-lg">
              {t.navDoc}
            </Link>
          </div>
          <div
            className={`flex items-center  ${
              isActive("/oraz/User")
                ? "bg-white text-gray-500"
                : " border-[#2A2A2A] bg-[#2A2A2A] border-solid text-white"
            } rounded-lg`}
          >
            <IoPeopleSharp
              onClick={() => navigate("/oraz/User")}
              className="cursor-pointer"
            />
            <Link to="/oraz/User" className="px-1 py-2 rounded-lg">
              {t.navUsr}
            </Link>
          </div>
          <div
            className={`flex items-center  ${
              isActive("/oraz/TaskManager")
                ? "bg-white text-gray-500"
                : " border-[#2A2A2A] bg-[#2A2A2A] border-solid text-white"
            } rounded-lg`}
          >
            <AiOutlineAppstore
              onClick={() => navigate("/oraz/TaskManager")}
              className="cursor-pointer"
            />
            <Link to="/oraz/TaskManager" className="px-1 py-2 rounded-lg">
              {t.navTaskMAnager}
            </Link>
          </div>
          <div
            className={`flex items-center pl-[3px]  ${
              isActive("/oraz/createInventory")
                ? "bg-white text-gray-500"
                : " border-[#2A2A2A] bg-[#2A2A2A] border-solid text-white"
            } rounded-lg`}
          >
            <BsBoxSeam
              onClick={() => navigate("/oraz/createInventory")}
              className="cursor-pointer"
            />
            <Link to="/oraz/createInventory" className="px-1 py-2 rounded-lg">
              {t.navInventar}
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="  py-2  rounded-md focus:ring-2 focus:ring-[#888] outline-none"
            style={{ backgroundColor: "#2A2A2A", color: "#ffffff" }}
          >
            <option value="Tkm">Türkmen</option>
            <option value="Eng">English</option>
          </select>
          <button
            onClick={toggleModal}
            className="flex items-center bg-gray-500 text-gray-500 py-2 px-3 border border-gray-600 rounded-md hover:bg-gray-600 transition-colors duration-200"
            style={{ backgroundColor: "#2A2A2A", color: "#ffffff" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m-1.85 1.85A7.5 7.5 0 1111.25 3a7.5 7.5 0 014.85 13.5z"
              />
            </svg>
            {t.navGozleg}
          </button>

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className=" text-white py-2 border border-gray-600 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200"
              style={{ backgroundColor: "#2A2A2A", color: "#ffffff" }}
            >
              {user ? `${user.first_name}/${user.roles[0]?.name}` : "Loading"}
            </button>
          ) : (
            <Link
              to="/oraz/Login"
              className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors duration-200"
            >
              Hasaba gir
            </Link>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ">
          <div className="bg-[#333] w-[1000px] rounded-lg shadow-2xl p-8">
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-xl text-white ml-[400px]   font-semibold">
                {t.navIsgar}
              </h2>
              <button
                onClick={toggleModal}
                className="text-white transition duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-9 text-white">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t.navSDoglanAy}
                  </label>
                  <select
                    className="w-full bg-[#444] border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                    value={birthMonth}
                    onChange={(e) => {
                      setBirthMonth(e.target.value);
                      handleSearch();
                    }}
                  >
                    <option value="">{t.navSAySayla}</option>
                    <option value="01">{t.navSYanwar}</option>
                    <option value="02">{t.navSFewral}</option>
                    <option value="03">{t.navSMart}</option>
                    <option value="04">{t.navSAprel}</option>
                    <option value="05">{t.navSMay}</option>
                    <option value="06">{t.navSIyun}</option>
                    <option value="07">{t.navSIyul}</option>
                    <option value="08">{t.navSAwgust}</option>
                    <option value="09">{t.navSSentyabr}</option>
                    <option value="10">{t.navSOktyabr}</option>
                    <option value="11">{t.navSNoyabr}</option>
                    <option value="12">{t.navSDekabr}</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder={t.navSName}
                  className="w-full bg-[#444] border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                  value={firstName}
                  onChange={handleInputChange(setFirstName)}
                />
                <input
                  type="text"
                  placeholder={t.navSSName}
                  className="w-full bg-[#444] border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                  value={lastName}
                  onChange={handleInputChange(setLastName)}
                />

                <input
                  type="email"
                  placeholder={t.navSGmail}
                  className="w-full bg-[#444] border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                  value={email}
                  onChange={handleInputChange(setEmail)}
                />
                <input
                  type="text"
                  placeholder={t.navSTelefon}
                  className="w-full bg-[#444] border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                  value={phoneNumber}
                  onChange={handleInputChange(setPhoneNumber)}
                />
                <input
                  type="text"
                  placeholder={t.navSWezipe}
                  className="w-full bg-[#444] border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                  value={position}
                  onChange={handleInputChange(setPosition)}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t.navSGirenW}
                  </label>
                  <div className="space-y-4">
                    <input
                      type="date"
                      value={hireDateStart}
                      onChange={handleInputChange(setHireDateStart)}
                      className="w-full bg-[#444] border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                    />
                    <input
                      type="date"
                      value={hireDateEnd}
                      onChange={handleInputChange(setHireDateEnd)}
                      className="w-full bg-[#444] border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={userID}
                      placeholder="User..."
                      onChange={handleInputChange(setUserId)}
                      className="w-full bg-[#444] border border-gray-600 mt-3 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="">
                  <label className="block text-sm mt-[44px] font-medium mb-1">
                    {t.navSCykanW}
                  </label>
                  <div className="space-y-4  ">
                    <input
                      type="date"
                      value={resignDateStart}
                      onChange={handleInputChange(setResignDateStart)}
                      className="w-full bg-[#444] border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                    />
                    <input
                      type="date"
                      value={resignDateEnd}
                      onChange={handleInputChange(setResignDateEnd)}
                      className="w-full bg-[#444] border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={toggleModal}
                className="px-6 py-2 text-white border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-200"
              >
                {t.navSYatyr}
              </button>
              <button
                onClick={() => {
                  handleSearch.cancel();
                  handleSearch();
                  toggleModal();
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
              >
                {t.navSGozlegB}
              </button>
              <button
                onClick={() => {
                  setFirstName("");
                  setLastName("");
                  setPosition("");
                  setEmail("");
                  setPhoneNumber("");
                  setBirthMonth("");
                  setHireDateStart("");
                  setHireDateEnd("");
                  setResignDateStart("");
                  setResignDateEnd("");
                  setUserId("");
                  handleSearch.cancel();
                  setSearchQuery(null);
                }}
                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-600 transition duration-200"
              >
                {t.navSHemme}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
