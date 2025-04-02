import React, { useState, useEffect } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./task.module.scss";
import api from "../api/apifor";

const TaskStatisticsMini = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [taskStats, setTaskStats] = useState([]);
  const [hoveredData, setHoveredData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State to track which lines are visible
  const [visibleLines, setVisibleLines] = useState({
    totalCreated: true,
    totalCompleted: true,
    overdue: true,
    ontime: true,
  });

  useEffect(() => {
    // Format dates for API call
    const formatDateForApi = (dateStr) => {
      if (!dateStr) return "";
      const [day, month, year] = dateStr.split(".");
      return `${year}-${month}-${day}`;
    };

    const fetchTaskStats = async () => {
      if (!startDate || !endDate) return;

      setLoading(true);
      setError(null);

      try {
        const response = await api.post(
          `v1/statistics/task_weekly_stats?start_date=${formatDateForApi(
            startDate
          )}&end_date=${formatDateForApi(endDate)}`
        );

        if (response.data.status) {
          // Transform the API data for the chart
          const formattedData = transformApiDataToChartData(response.data.data);
          setTaskStats(formattedData);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching task statistics:", error);
        setError("Failed to load task statistics");
        setLoading(false);
      }
    };

    fetchTaskStats();
  }, [startDate, endDate]);

  // Transform API data to the format needed for the chart
  const transformApiDataToChartData = (apiData) => {
    return apiData.map((week) => {
      const weekDate = new Date(week.week_start);
      const weekEnd = new Date(weekDate);
      weekEnd.setDate(weekDate.getDate() + 6);

      const startDay = weekDate.getDate();
      const endDay = weekEnd.getDate();
      const month = weekEnd.toLocaleString("default", { month: "short" });

      return {
        name: `${startDay}- ${endDay} ${month}`,
        totalCreated: week.total_created,
        totalCompleted: week.total_completed,
        ontime: week.completed_on_time,
        overdue: week.completed_overdue,
        weekStart: week.week_start,
      };
    });
  };

  // Custom tooltip to show data when hovering
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.label}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value} Tasks
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Toggle visibility of a line
  const toggleLine = (dataKey) => {
    setVisibleLines((prev) => ({
      ...prev,
      [dataKey]: !prev[dataKey],
    }));
  };

  // Custom date input handler
  const handleDateChange = (event, setter) => {
    setter(event.target.value);
  };

  // Sample data to match the image if API doesn't return enough data
  const sampleData = [
    {
      name: "10- 16 Feb",
      totalCreated: 32,
      totalCompleted: 30,
      overdue: 16,
      ontime: 22,
    },
    {
      name: "22- 28 Feb",
      totalCreated: 23,
      totalCompleted: 20,
      overdue: 6,
      ontime: 14,
    },
    {
      name: "1- 6 Mar",
      totalCreated: 42,
      totalCompleted: 39,
      overdue: 25,
      ontime: 32,
    },
    {
      name: "7- 13 Mar",
      totalCreated: 28,
      totalCompleted: 25,
      overdue: 11,
      ontime: 19,
    },
    {
      name: "14- 22 Mar",
      totalCreated: 51,
      totalCompleted: 50,
      overdue: 36,
      ontime: 42,
    },
    {
      name: "23- 29 Mar",
      totalCreated: 32,
      totalCompleted: 30,
      overdue: 16,
      ontime: 23,
    },
    {
      name: "30 Mar- 05 Apr",
      totalCreated: 62,
      totalCompleted: 58,
      overdue: 45,
      ontime: 52,
    },
  ];

  // Use API data if available, otherwise use sample data
  const chartData = taskStats.length > 0 ? taskStats : sampleData;

  // Define the line data for rendering
  const lineData = [
    {
      key: "totalCreated",
      name: "Total created tasks",
      color: "#aaa",
      className: styles.totalCreated,
    },
    {
      key: "totalCompleted",
      name: "Total completed tasks",
      color: "#d68c32",
      className: styles.totalCompleted,
    },
    {
      key: "overdue",
      name: "Overdue",
      color: "#d63232",
      className: styles.overdue,
    },
    {
      key: "ontime",
      name: "Ontime",
      color: "#32d6b5",
      className: styles.ontime,
    },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dateControls}>
        {/* <div className={styles.dateField}>
          <label htmlFor="startDate">From</label>
          <input
            type="text"
            id="startDate"
            value={startDate}
            onChange={(e) => handleDateChange(e, setStartDate)}
            className={styles.dateInput}
            placeholder="DD.MM.YYYY"
          />
        </div> */}

        {/* <div className={styles.dateField}>
          <label htmlFor="endDate">Until</label>
          <input
            type="text"
            id="endDate"
            value={endDate}
            onChange={(e) => handleDateChange(e, setEndDate)}
            className={styles.dateInput}
            placeholder="DD.MM.YYYY"
          />
        </div> */}
        <div>Total Tasks {}</div>

        <div className={styles.legendContainer}>
          {lineData.map((line) => (
            <div
              key={line.key}
              className={styles.legendItem}
              onClick={() => toggleLine(line.key)}
              style={{
                cursor: "pointer",
                opacity: visibleLines[line.key] ? 1 : 0.5,
              }}
            >
              <div className={`${styles.legendColor} ${line.className}`}></div>
              <span>{line.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.chartContainer}>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              onMouseMove={(e) => {
                if (e.activePayload) {
                  setHoveredData(e.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredData(null)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#fff" }}
                axisLine={{ stroke: "#333" }}
                tickLine={{ stroke: "#333" }}
              />
              <YAxis
                tick={{ fill: "#fff" }}
                axisLine={{ stroke: "#333" }}
                tickLine={{ stroke: "#333" }}
                domain={[0, "dataMax + 10"]}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Render lines based on visibility state */}
              {lineData.map(
                (line) =>
                  visibleLines[line.key] && (
                    <Line
                      key={line.key}
                      type="linear" // Changed from "monotone" to "linear" for straight lines
                      dataKey={line.key}
                      stroke={line.color}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                      dot={{ r: 4, fill: line.color, stroke: line.color }}
                      name={line.name}
                    />
                  )
              )}
            </LineChart>
          </ResponsiveContainer>
        )}

        {hoveredData && (
          <div className={styles.hoveredData}>
            <div>{hoveredData.name}</div>
            <div className={styles.tasksValue}>
              {hoveredData.totalCreated} Tasks
            </div>
          </div>
        )}

        <div className={styles.xAxisLabel}>Months</div>
        <div className={styles.yAxisLabel}>Tasks</div>
      </div>
    </div>
  );
};

export default TaskStatisticsMini;
