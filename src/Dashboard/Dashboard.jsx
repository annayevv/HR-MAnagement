/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../Language/LanguageContext";
import translations from "../Language/translation";
import "react-phone-number-input/style.css";
import { GrDocumentPdf } from "react-icons/gr";
import api from "../api/apifor";
import { Bar, Doughnut } from "react-chartjs-2";
import { AiOutlineExport } from "react-icons/ai";
import { fetchDocuments, checkExpiry } from "../api/DocumentFormApi";
import Statistic from "../statisticJel/Statistic";
import TaskMini2 from "../MinTask/taskBoardMini";
import { color } from "chart.js/helpers";

const Dasboard = ({ token }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayTypeData, setDayTypeData] = useState(null);
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(null);
  const [timesheetStartDate, setTimesheetStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 6)).toISOString()
  );
  const [timesheetEndDate, setTimesheetEndDate] = useState(
    new Date().toISOString()
  );
  const [timesheetData, setTimesheetData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");

  const handleWeekChange = (direction) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() + direction * 7);

      // Häzirki hepde üçin ilkinji we soňky günleri hasapla
      const currentDay = newDate.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(newDate);
      monday.setDate(newDate.getDate() + diffToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const firstDay = monday.toISOString().split("T")[0];
      const lastDay = sunday.toISOString().split("T")[0];

      setTimesheetStartDate(firstDay);
      setTimesheetEndDate(lastDay);

      fetchTimesheetData(firstDay, lastDay);
      fetchDayTypeData(firstDay, lastDay);

      return newDate;
    });
  };

  const fetchDayTypeData = async () => {
    try {
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // Calculate last Monday
      const lastMonday = new Date(today);
      lastMonday.setDate(
        today.getDate() - (currentDay === 0 ? 6 : currentDay - 1)
      );

      // Calculate next Sunday
      const nextSunday = new Date(lastMonday);
      nextSunday.setDate(lastMonday.getDate() + 6);

      // Convert date to "DD-MM-YYYY"
      const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is zero-based
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const date_begin = formatDate(lastMonday);
      const date_end = formatDate(nextSunday);
      const response = await api.post(
        "http://192.168.4.58/api/v1/statistics/dayTypePercent",
        { date_begin, date_end },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data.data;

      if (!data || data.length === 0) {
        setErrorMessage("No data available for the past week.");
        return;
      }

      const labels = data.map((item) => item.date_type);
      const values = data.map((item) => item.count);

      const colorMapping = {
        Worked: "#138565",
        NotWorked: "#474A52",
        Holiday: "#CB5D00",
        Sick: "#D41515",
      };
      const colors = labels.map((label) => colorMapping[label] || "#474A52");

      setDayTypeData({
        labels,
        datasets: [
          {
            label: "Day Type Percent",
            data: values,
            backgroundColor: colors,
            borderWidth: 2,
            datalabels: {
              color: "white",
            },
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching day type data:", error);
      setErrorMessage(
        error.response?.data?.message || "Error fetching day type data."
      );
    }
  };

  const fetchTimesheetData = async (start, end) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.post(
        "http://192.168.4.58/api/v1/statistics/timeSheet",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const labels = [];
      const dataMap = {};

      for (let i = 0; i < 7; i++) {
        const dateObj = new Date(start);
        dateObj.setDate(dateObj.getDate() + i);
        const formattedDate = dateObj.toISOString().split("T")[0];

        const day = String(dateObj.getDate()).padStart(2, "0");
        const weekDay = dateObj
          .toLocaleString("en-US", { weekday: "short" })
          .toUpperCase();

        labels.push(`${day}/${weekDay}`);
        dataMap[formattedDate] = response.data.data.find(
          (item) => item.date === formattedDate
        ) || { count_employee_at_work: 0, count_employee_not_at_work: 0 };
      }

      setTimesheetData({
        labels,
        datasets: [
          {
            label: "Işe gelmedikler",
            data: response.data.data.map(
              (item) => item.count_employee_not_at_work
            ),
            backgroundColor: "#333",
            borderWidth: 8,
            borderColor: "#333",
            borderRadius: 8,
            stack: "stack1",
            datalabels: {
              formatter: (value) => (value === 0 ? "" : value),
            },
          },
          {
            label: "Işe gelenler",
            data: response.data.data.map((item) => item.count_employee_at_work),
            backgroundColor: "#fff",
            borderColor: "white",
            borderRadius: 8,
            stack: "stack1",
            datalabels: {
              formatter: (value) => (value === 0 ? "" : value),
              color: "#000",
            },
          },
        ],
      });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Error fetching timesheet data."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await fetchDocuments();
      const today = new Date();
      const expiredDocuments = data.filter((doc) => {
        if (!doc.expiry_date) return false;
        const expiryDate = new Date(
          doc.expiry_date.split("-").reverse().join("-")
        );
        return expiryDate < today;
      });

      setDocuments(expiredDocuments);
    } catch (err) {
      setError("Dokumentler ýüklenmedi: " + err.message);
    }
  };

  useEffect(() => {
    loadDocuments();
    handleWeekChange(0);
    fetchDayTypeData();
    fetchTimesheetData(timesheetStartDate, timesheetEndDate);
  }, [timesheetStartDate, timesheetEndDate]);

  return (
    <div className="">
      <div className="flex">
        <div className="ml-[8px] bg-[#252525] w-[622px] sm:w-[50%]  mt-[12px] h-[auto]">
          <div className="flex items-center justify-between">
            <h1 className="text-white ml-[30px] font-semibold w-[190px] p-[8px] pt-[17px] ">
              {t.dashtimesheetdiag}
            </h1>
            <AiOutlineExport
              className=" mr-[10px] text-[#8A8C98] cursor-pointer"
              onClick={() => navigate("/oraz/diagramma")}
              size={20}
            />
          </div>
          <div className="w-full h-[300px] md:w-[50%] lg:w-[952px]">
            {timesheetData && timesheetData.labels.length > 0 ? (
              <Bar
                data={timesheetData}
                options={{
                  indexAxis: "y",
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: true },
                    tooltip: { enabled: true },
                    datalabels: {
                      color: "#fff",
                      anchor: "left",
                      align: "left",
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: { display: false },
                      grid: { display: false },
                    },
                    y: {
                      ticks: {
                        color: (context) => {
                          const label = context.tick.label;
                          return label.includes("SAT") ? "red" : "#fff";
                        },
                      },
                      grid: { display: false },
                    },
                  },
                }}
              />
            ) : (
              <p className="text-white">
                No data available for the selected month.
              </p>
            )}
          </div>
        </div>
        <div className="ml-4  flex h-[100%] w-[48%] mt-[10px] bg-[#252525] rounded-[10px] justify-center  items-center  text-white">
          <Statistic />
        </div>
      </div>
      <div className="flex justify-start gap-4 ml-[10px] mt-[16px] mr-[10px] ">
        <div className=" md:w-[90%] lg:w-[1300px] h-[354px] bg-[#252525] rounded-lg">
          <TaskMini2 />
        </div>
        <div className=" md:w-[90%] lg:w-[1300px] h-[354px] bg-[#252525] rounded-lg">
          {" "}
          <div className="flex items-center justify-between ">
            <h2 className="text-xl font-semibold mt-[10px] ml-[10px] text-white">
              {t.dashdaytype}
            </h2>
            <AiOutlineExport
              className=" mr-[10px] text-[#8A8C98] cursor-pointer"
              onClick={() => navigate("/oraz/diagramma")}
              size={20}
            />
          </div>
          <div className="h-[275px]">
            {dayTypeData ? (
              <Doughnut
                data={dayTypeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "right",
                      labels: { color: "white" },
                    },
                  },
                  layout: {
                    padding: {
                      bottom: 5,
                    },
                  },
                }}
              />
            ) : (
              <p className="text-white">Loading...</p>
            )}
          </div>
        </div>
        <div className="md:w-[90%] lg:w-[1300px] h-auto bg-[#252525] rounded-lg p-4">
          {/* Header */}
          <div className="flex justify-between items-center w-full">
            <h1 className="text-white font-semibold">{t.dashexpiredoc}</h1>
            <AiOutlineExport
              className=" text-[#8A8C98] cursor-pointer"
              onClick={() => navigate("/oraz/DocumentForm")}
              size={20}
            />
          </div>

          {/* Documents Container */}
          <div className="flex flex-col gap-4 mt-4 max-h-[282px] overflow-auto">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="w-full bg-[#333]  text-white flex items-center justify-between p-4 rounded-xl"
              >
                <div>
                  <p className="flex items-center text-[#C9C9C9] text-sm border border-[#454648] py-1 px-3 rounded-md">
                    <GrDocumentPdf className="mr-2 text-[#C9C9C9]" />
                    {doc.type}
                  </p>
                  <h4 className="text-[#C9C9C9] text-base mt-1">{doc.name}</h4>
                </div>

                {doc.expiry_date && (
                  <p
                    className={`text-sm font-medium rounded-lg px-3 py-1 border ${
                      checkExpiry(doc.expiry_date) === "Wagty Geçen"
                        ? "text-red-500 border-red-500"
                        : "text-green-500 border-green-500"
                    }`}
                  >
                    {checkExpiry(doc.expiry_date) === "Wagty Geçen"
                      ? t.docWagtyGecen
                      : t.docActive}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dasboard;
