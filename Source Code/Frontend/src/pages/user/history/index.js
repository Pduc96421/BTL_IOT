"use client"

import { memo, useState } from "react"
import "./style.scss"
import { FiSearch, FiChevronDown } from "react-icons/fi"

const HistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("all")
  const [selectedResult, setSelectedResult] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  const accessRecords = [
    {
      id: 1,
      time: "1/15/2024 2:32:00 PM",
      user: "Sarah Johnson",
      avatar: "SJ",
      method: "Face ID",
      result: "Success",
      color: "#4a90e2",
    },
    {
      id: 2,
      time: "1/15/2024 12:15:00 PM",
      user: "Mike Chen",
      avatar: "MC",
      method: "RFID",
      result: "Success",
      color: "#50c878",
    },
    {
      id: 3,
      time: "1/15/2024 9:45:00 AM",
      user: "Emma Wilson",
      avatar: "EW",
      method: "App",
      result: "Success",
      color: "#4ecdc4",
    },
    {
      id: 4,
      time: "1/15/2024 8:22:00 AM",
      user: "Unknown User",
      avatar: "UU",
      method: "Face ID",
      result: "Failed",
      color: "#9370db",
    },
    {
      id: 5,
      time: "1/14/2024 6:30:00 PM",
      user: "David Brown",
      avatar: "DB",
      method: "RFID",
      result: "Success",
      color: "#ff6b6b",
    },
    {
      id: 6,
      time: "1/14/2024 4:45:00 PM",
      user: "Lisa Garcia",
      avatar: "LG",
      method: "App",
      result: "Success",
      color: "#ffa500",
    },
    {
      id: 7,
      time: "1/14/2024 2:12:00 PM",
      user: "John Smith",
      avatar: "JS",
      method: "Face ID",
      result: "Failed",
      color: "#87ceeb",
    },
    {
      id: 8,
      time: "1/14/2024 11:28:00 AM",
      user: "Anna Taylor",
      avatar: "AT",
      method: "RFID",
      result: "Success",
      color: "#ff69b4",
    },
    {
      id: 9,
      time: "1/14/2024 9:15:00 AM",
      user: "Tom Anderson",
      avatar: "TA",
      method: "App",
      result: "Success",
      color: "#20b2aa",
    },
    {
      id: 10,
      time: "1/13/2024 8:45:00 PM",
      user: "Sarah Johnson",
      avatar: "SJ",
      method: "Face ID",
      result: "Success",
      color: "#4a90e2",
    },
    {
      id: 11,
      time: "1/13/2024 5:22:00 PM",
      user: "Unknown User",
      avatar: "UU",
      method: "RFID",
      result: "Failed",
      color: "#9370db",
    },
    {
      id: 12,
      time: "1/13/2024 3:10:00 PM",
      user: "Mike Chen",
      avatar: "MC",
      method: "App",
      result: "Success",
      color: "#50c878",
    },
  ]

  const stats = [
    { number: 9, label: "Successful Access", bgColor: "#e3f2fd" },
    { number: 3, label: "Failed Attempts", bgColor: "#ffebee" },
    { number: 12, label: "Total Records", bgColor: "#e8f5e9" },
  ]

  const filteredRecords = accessRecords.filter((record) => {
    const matchesSearch = record.user.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMethod = selectedMethod === "all" || record.method.toLowerCase() === selectedMethod.toLowerCase()
    const matchesResult = selectedResult === "all" || record.result.toLowerCase() === selectedResult.toLowerCase()
    return matchesSearch && matchesMethod && matchesResult
  })

  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const getMethodIcon = (method) => {
    switch (method) {
      case "Face ID":
        return "👤"
      case "RFID":
        return "📳"
      case "App":
        return "📱"
      default:
        return "🔒"
    }
  }

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
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>

        <div className="filter-dropdowns">
          <div className="dropdown">
            <button className="dropdown-btn">
              All Methods
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
              All Results
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
              setSearchTerm("")
              setSelectedMethod("all")
              setSelectedResult("all")
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
                  <span className={`result-badge ${record.result.toLowerCase()}`}>{record.result}</span>
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
  )
}

export default memo(HistoryPage)
