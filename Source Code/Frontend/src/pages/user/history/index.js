"use client";

import { memo, useEffect, useMemo, useState } from "react";
import "./style.scss";
import { FiSearch, FiChevronDown } from "react-icons/fi";
import { api } from "services/api.service";

const HistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [selectedResult, setSelectedResult] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [records, setRecords] = useState([]);

  const stats = useMemo(() => {
    const total = records.length;
    const success = records.filter((r) => r.result === "SUCCESS").length;
    const failed = records.filter((r) => r.result === "FALSE").length;
    return [
      { number: success, label: "Successful Access", bgColor: "#e3f2fd" },
      { number: failed, label: "Failed Attempts", bgColor: "#ffebee" },
      { number: total, label: "Total Records", bgColor: "#e8f5e9" },
    ];
  }, [records]);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/access_log");
      const list = res.data?.result || [];
      const mapped = list.map((item) => {
        const resultCode = item.result || "SUCCESS"; // "SUCCESS" | "FALSE"
        const resultLabel = resultCode === "SUCCESS" ? "Success" : "Failed";

        // Chuẩn hóa method
        const rawMethod = (item.method || "RFID").toLowerCase();
        let methodLabel = "RFID";

        if (rawMethod === "face id" || rawMethod === "faceid" || rawMethod === "face") {
          methodLabel = "Face ID";
        } else if (rawMethod === "app") {
          methodLabel = "App";
        } else {
          methodLabel = "RFID";
        }

        return {
          id: item._id,
          time: new Date(item.createdAt).toLocaleString(),
          // Hiện tại chưa map được user, chỉ có device + rf_id
          user: item.device_id?.name || "Unknown",
          avatar: (item.device_id?.name || "D").slice(0, 2).toUpperCase(),
          method: (item.method || "RFID").toUpperCase(),
          result: resultCode,
          resultLabel,
          color: "#4a90e2",
        };
      });
      setRecords(mapped);
    } catch (error) {
      console.error("Fetch access_log error", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = selectedMethod === "all" || record.method.toLowerCase() === selectedMethod.toLowerCase();
    const matchesResult = selectedResult === "all" || record.resultLabel.toLowerCase() === selectedResult.toLowerCase();
    return matchesSearch && matchesMethod && matchesResult;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const methodLabel = useMemo(() => {
    switch (selectedMethod) {
      case "face id":
        return "Face ID";
      case "rfid":
        return "RFID";
      case "app":
        return "App";
      default:
        return "All Methods";
    }
  }, [selectedMethod]);

  const resultLabel = useMemo(() => {
    switch (selectedResult) {
      case "success":
        return "Success";
      case "failed":
        return "Failed";
      default:
        return "All Results";
    }
  }, [selectedResult]);

  const getMethodIcon = (method) => {
    switch (method) {
      case "Face ID":
        return "👤";
      case "RFID":
        return "📳";
      case "App":
        return "📱";
      default:
        return "🔒";
    }
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>Access History</h1>
        <p>View and filter door access logs and security events</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card" style={{ backgroundColor: stat.bgColor }}>
            <p className="stat-number">{stat.number}</p>
            <p className="stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by user name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filter-dropdowns">
          <div className="dropdown">
            <button className="dropdown-btn">
              {methodLabel}
              <FiChevronDown />
            </button>
            <div className="dropdown-menu">
              <div onClick={() => setSelectedMethod("all")}>All Methods</div>
              <div onClick={() => setSelectedMethod("face id")}>Face ID</div>
              <div onClick={() => setSelectedMethod("rfid")}>RFID</div>
              <div onClick={() => setSelectedMethod("app")}>App</div>
            </div>
          </div>

          <div className="dropdown">
            <button className="dropdown-btn">
              {resultLabel}
              <FiChevronDown />
            </button>
            <div className="dropdown-menu">
              <div onClick={() => setSelectedResult("all")}>All Results</div>
              <div onClick={() => setSelectedResult("success")}>Success</div>
              <div onClick={() => setSelectedResult("failed")}>Failed</div>
            </div>
          </div>

          <button
            className="clear-filters-btn"
            onClick={() => {
              setSearchTerm("");
              setSelectedMethod("all");
              setSelectedResult("all");
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="records-table-container">
        <table className="records-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User Name</th>
              <th>Method</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.time}</td>
                <td>
                  <div className="user-cell">
                    <div className="avatar" style={{ backgroundColor: record.color }}>
                      {record.avatar}
                    </div>
                    <span>{record.user}</span>
                  </div>
                </td>
                <td>
                  <div className="method-cell">
                    <span>{getMethodIcon(record.method)}</span>
                    {record.method}
                  </div>
                </td>
                <td>
                  <span className={`result-badge ${record.resultLabel.toLowerCase()}`}>{record.resultLabel}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination-container">
        <span className="pagination-info">
          Showing {paginatedRecords.length} of {filteredRecords.length} records
        </span>
        <div className="pagination-controls">
          <button
            className="page-btn"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`page-btn ${currentPage === page ? "active" : ""}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="page-btn"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(HistoryPage);
