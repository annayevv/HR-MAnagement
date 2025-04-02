/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchTimesheetData,
  fetchEmployees,
  fetchDayTypes,
  submitWorkedHours,
  submitDayType,
  deleteTimesheetEntry,
} from "../api/TimeSheetapi";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../Language/LanguageContext";
import translations from "../Language/translation";
import { MdOutlineWork, MdOutlineSentimentDissatisfied } from "react-icons/md";
import { CiPill } from "react-icons/ci";
import { BiHappy } from "react-icons/bi";
import { AiFillSignal } from "react-icons/ai";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";

const TimeSheet = () => {
  const [timesheetData, setTimesheetData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [dayTypes, setDayTypes] = useState([]);
  const [workedHours, setWorkedHours] = useState("");
  const [editingCell, setEditingCell] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const tableBodyRef = useRef(null);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const fetchData = useCallback(async () => {
    try {
      const response = await fetchTimesheetData(
        "01-01-2024",
        "31-12-2025",
        "00:00:00",
        "23:00:00"
      );

      let timesheet = [];

      if (response && Array.isArray(response)) {
        timesheet = response;
      } else {
        setError("Unexpected response structure");
        return;
      }

      const employeesData = await fetchEmployees();
      const dayTypesData = await fetchDayTypes();

      const activeEmployees = employeesData.filter(
        (employee) =>
          !employee.resign_date ||
          new Date(employee.resign_date) >= new Date(currentDate)
      );

      setTimesheetData(timesheet);
      setEmployees(activeEmployees);
      setDayTypes(dayTypesData);
      setError(null);
    } catch (err) {
      setError(`Error fetching data: ${err.message}`);
    }
  }, [currentDate]);

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((e) => e.id === employeeId);
    if (employee) {
      return (
        <div className="flex items-center">
          <img
            src={employee.avatar}
            alt={`${employee.first_name} avatar`}
            className="w-8 h-8 mr-[4px] rounded-full "
          />
          <span>
            {employee.first_name || "No First Name"}{" "}
            {employee.last_name || "No Last Name"}
          </span>
        </div>
      );
    }
    return "No Name Provided";
  };

  const handleDelete = async (entryId) => {
    try {
      await deleteTimesheetEntry(entryId);
      fetchData();
    } catch (err) {
      setError(`Error deleting entry: ${err.message}`);
    }
  };

  const handleWorkedSubmit = async (employee, currentDay) => {
    if (!workedHours) return;

    const formattedWorkedHours = workedHours.padStart(2, "0") + ":00:00";

    try {
      await submitWorkedHours(employee.id, currentDay, formattedWorkedHours);
      setEditingCell(null);
      setWorkedHours("");
      await fetchData();
    } catch (err) {
      setError(`Error updating worked hours: ${err.message}`);
    }
  };

  const handleDayTypeSubmit = async (employee, currentDay, type) => {
    try {
      await submitDayType(employee.id, currentDay, type);
      fetchData();
    } catch (err) {
      setError(`Error updating data: ${err.message}`);
    }
  };

  const handleMonthChange = (direction) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + direction);
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth();

  const handleScroll = (direction) => {
    if (tableBodyRef.current) {
      const scrollAmount = tableBodyRef.current.offsetWidth / 2;
      tableBodyRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div
      className="p-6 h-[730px] "
      style={{ backgroundColor: "#", color: "#ffffff" }}
    >
      <div className="flex  items-center justify-center p-8  text-white ">
        <div className="flex flex-wrap items-center justify-between w-full max-w-7xl mb-8">
          <div className="flex mr-8   md:mb-0">
            <button
              onClick={() => handleMonthChange(-1)}
              className="bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
            >
              <FaChevronLeft />
            </button>

            <div className="text-xl font-semibold">
              {currentDate.toLocaleString("default", { month: "long" })}{" "}
              {currentDate.getFullYear()}
            </div>

            <button
              onClick={() => handleMonthChange(1)}
              className="bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
            >
              <FaChevronRight />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4 md:mb-0 border rounded-lg hover:bg-gray-700 border-gray-500 px-1">
            <AiFillSignal size={24} className="text-gray-400" />
            <button
              onClick={() => navigate("/oraz/diagramma")}
              className="border-gray-800  text-white rounded-lg p-2 transition duration-200"
            >
              Show Statistics
            </button>
          </div>

          <div className="flex gap-2 mb-4 md:mb-0">
            <button
              onClick={() => handleScroll("left")}
              className="bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition duration-200"
            >
              Left
            </button>
            <button
              onClick={() => handleScroll("right")}
              className="bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition duration-200"
            >
              Right
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 ml-[50px]  gap-2">
            <div className="bg-green-700 text-white flex items-center justify-center px-2 py-1 rounded-md">
              <MdOutlineWork className="mr-2" /> Worked
            </div>
            <div className="bg-red-500 text-white flex items-center justify-center px-3 py-2 rounded-md">
              <CiPill className="mr-2" /> Sick
            </div>
            <div className="bg-gray-500 text-white flex items-center justify-center px-2 py-1 rounded-md">
              <MdOutlineSentimentDissatisfied className="mr-2" /> Not Worked
            </div>
            <div className="bg-orange-500 text-white flex items-center justify-center px-2 py-1 rounded-md">
              <BiHappy className="mr-2" /> Holiday
            </div>
          </div>
        </div>
      </div>

      <div
        className="overflow-x-auto shadow-md rounded-lg max-h-[700px] "
        ref={tableBodyRef}
      >
        <table className="min-w-[1500px] border-collapse border ">
          <thead className="  text-white sticky top-0 z-30">
            <tr>
              <th className="border border-gray-700 bg-gray-600  px-6 py-4 sticky  left-0  z-40">
                {t.timeEmp}
              </th>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const currentDay = new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth(),
                  i + 1
                );
                const dayOfWeek = currentDay.toLocaleString("default", {
                  weekday: "short",
                });

                const isWeekend = currentDay.getDay() === 0;

                return (
                  <th
                    key={i}
                    className={`border border-gray-800 bg-gray-600 px-4 py-2 text-center sticky top-0 z-30 ${
                      isWeekend ? " text-red-500" : "bg-gray-600 text-white"
                    }`}
                  >
                    {i + 1}
                    <br />
                    <span className="text-sm font-semibold">{dayOfWeek}</span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody ref={tableBodyRef}>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="sticky left-0 z-20 bg-gray-800 border border-gray-700 px-4 pr-[2.5rem] py-4">
                  <span className="truncate">
                    {getEmployeeName(employee.id)}
                  </span>
                </td>

                {Array.from({ length: daysInMonth }, (_, i) => {
                  const currentDay = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    i + 1
                  )
                    .toLocaleDateString("en-GB")
                    .replace(/\//g, "-");

                  // Find the matching entry
                  const entry = timesheetData.find(
                    (item) =>
                      item.employee_id === employee.id &&
                      item.date === currentDay
                  );

                  return (
                    <td
                      key={i}
                      className={`border border-gray-700 px-5 text-center ${
                        entry?.type === "Worked"
                          ? "bg-green-700"
                          : entry?.type === "Not Worked"
                          ? "bg-gray-500"
                          : entry?.type === "Sick"
                          ? "bg-red-500"
                          : entry?.type === "Holiday"
                          ? "bg-orange-500"
                          : ""
                      } rounded-md`}
                    >
                      {editingCell?.employee === employee.id &&
                      editingCell?.date === currentDay ? (
                        <>
                          <input
                            type="text"
                            placeholder="Hours worked"
                            value={workedHours}
                            onChange={(e) => setWorkedHours(e.target.value)}
                            className="border border-gray-500 text-gray-600 p-2 rounded-md"
                          />
                          <button
                            onClick={() =>
                              handleWorkedSubmit(employee, currentDay)
                            }
                            className="bg-gray-600 px-4 py-2 mt-2 rounded-md ml-2"
                          >
                            Yukle
                          </button>
                        </>
                      ) : entry ? (
                        <div className="flex flex-col items-center justify-between">
                          <div className="flex justify-between w-full items-center">
                            {entry.type === "Worked" && (
                              <MdOutlineWork size={22} className="text-white" />
                            )}
                            {entry.type === "Sick" && (
                              <CiPill
                                size={22}
                                className="text-white text-lg"
                              />
                            )}
                            {entry.type === "Not Worked" && (
                              <MdOutlineSentimentDissatisfied
                                size={22}
                                className="text-white text-lg"
                              />
                            )}
                            {entry.type === "Holiday" && (
                              <BiHappy
                                size={22}
                                className="text-white text-lg"
                              />
                            )}
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-sm text-white px-1 py-1 rounded-md"
                            >
                              X
                            </button>
                          </div>
                          <p className="text-sm text-white">
                            {entry.type}{" "}
                            {entry.type === "Worked" &&
                              entry.time &&
                              `(${entry.time})`}
                          </p>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-2">
                          <MdOutlineWork
                            size={16}
                            className="cursor-pointer text-green-600"
                            onClick={() =>
                              setEditingCell({
                                employee: employee.id,
                                date: currentDay,
                              })
                            }
                          />
                          <CiPill
                            size={16}
                            className="cursor-pointer text-red-500"
                            onClick={() =>
                              handleDayTypeSubmit(employee, currentDay, "Sick")
                            }
                          />
                          <MdOutlineSentimentDissatisfied
                            size={16}
                            className="cursor-pointer text-gray-500"
                            onClick={() =>
                              handleDayTypeSubmit(
                                employee,
                                currentDay,
                                "Not Worked"
                              )
                            }
                          />
                          <BiHappy
                            size={16}
                            className="cursor-pointer text-orange-500"
                            onClick={() =>
                              handleDayTypeSubmit(
                                employee,
                                currentDay,
                                "Holiday"
                              )
                            }
                          />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimeSheet;
