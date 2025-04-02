/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../Language/LanguageContext";
import translations from "../Language/translation";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import api from "../api/apifor";
import { color } from "chart.js/helpers";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const TimesheetAndDayTypeCharts = ({ token }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayTypeDataPercent, setDayTypeDataPercent] = useState(null);
  const [timesheetStartDate, setTimesheetStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 6)).toISOString()[0]
  );
  const [timesheetEndDate, setTimesheetEndDate] = useState(new Date()[0]);
  const [timesheetData, setTimesheetData] = useState(null);
  const [dayTypeData, setDayTypeData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();

  const fetchDayTypePercentages = async () => {
    try {
      const response = await api.post(
        "http://192.168.4.58/api/v1/statistics/dayTypePercent",
        { date_begin: "", date_end: "" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchDayTypePercentages().then((data) => setDayTypeDataPercent(data));
  }, []);

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

      console.log("Sending request with:", { date_begin, date_end });

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

      const daysInMonth = new Date(
        new Date(start).getFullYear(),
        new Date(start).getMonth() + 1,
        0
      ).getDate();
      const labels = Array.from({ length: daysInMonth }, (_, i) => {
        const dateObj = new Date(
          new Date(start).getFullYear(),
          new Date(start).getMonth(),
          i + 1
        );
        const day = String(dateObj.getDate()).padStart(2, "0");
        const weekDay = dateObj
          .toLocaleString("en-US", { weekday: "short" })
          .toUpperCase();

        return `${day}/${weekDay}`;
      });

      const dataMap = response.data.data.reduce((acc, item) => {
        acc[item.date] = item;
        return acc;
      }, {});

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
            borderWidth: 8,
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

  const handleMonthChange = (direction) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + direction);

      const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const lastDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      setTimesheetStartDate(firstDay);
      setTimesheetEndDate(lastDay);

      fetchTimesheetData(firstDay, lastDay);
      fetchDayTypeData(firstDay, lastDay);

      return newDate;
    });
  };

  useEffect(() => {
    fetchDayTypeData();
  }, []);

  useEffect(() => {
    fetchTimesheetData(timesheetStartDate, timesheetEndDate);
  }, [timesheetStartDate, timesheetEndDate]);

  return (
    <div className="flex flex-col items-center text-white p-6">
      <div className="w-full flex justify-between items-center pl-4 mb-6">
        <div className="flex items-center space-x-2 text-gray-500">
          <h3
            className="cursor-pointer"
            onClick={() => navigate("/oraz/Dashboard")}
          >
            {t.dashbaordN}
          </h3>
          <FaChevronRight size={10} />
          <h3
            className="text-white cursor-pointer"
            onClick={() => navigate("/oraz/timesheet")}
          >
            {t.timeIsgarHasap}
          </h3>
          <FaChevronRight size={10} />
          <h3
            className="text-white cursor-pointer"
            onClick={() => navigate("/oraz/diagramma")}
          >
            {t.statistic}
          </h3>
        </div>
        <input
          className="text-white bg-[#333] h-[30px] w-[138px] pl-[20px] rounded-[5px]"
          type="date"
          value={today}
          readOnly
        />
      </div>

      <div className="flex w-full gap-6">
        {/* Left Section */}
        <div className="w-1/2 shadow-lg rounded-lg p-6 bg-[#333]">
          <h2 className="text-xl font-semibold mb-4">Day Type</h2>
          <h3 className="text-gray-500  underline mb-4">Week</h3>
          <div className="h-[300px]">
            {dayTypeData ? (
              <Doughnut
                data={dayTypeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { color: "#fff" },
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
          <div className="mt-20">
            <h1 className="mb-[8px]">Employee Status</h1>
            <h4 className="text-gray-500 mb-[18px]  border-b w-[47px] border-gray-500">
              Month
            </h4>
            {dayTypeDataPercent ? (
              dayTypeDataPercent.map((type) => (
                <div
                  key={type.date_type}
                  className="flex justify-between p-2  border rounded-lg mb-[10px]"
                >
                  <span className="pl-[10px]">{type.date_type}</span>
                  <span>{type.count}%</span>
                </div>
              ))
            ) : (
              <p className="text-white">Loading percentages...</p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="w-1/2 shadow-lg rounded-lg p-6 bg-[#222]">
          <h2 className="text-xl font-semibold mb-4 text-white">Timesheet</h2>
          <div className="flex items-center mb-4">
            <button
              onClick={() => handleMonthChange(-1)}
              className="text-white p-2"
            >
              <FaChevronLeft />
            </button>
            <div className="text-xl mx-2 font-semibold text-white">
              {currentDate.toLocaleString("default", { month: "long" })}{" "}
              {currentDate.getFullYear()}
            </div>
            <button
              onClick={() => handleMonthChange(1)}
              className="text-white p-2"
            >
              <FaChevronRight />
            </button>
          </div>
          <div className="h-[650px] ">
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
                      anchor: "end",
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
      </div>
    </div>
  );
};

export default TimesheetAndDayTypeCharts;
