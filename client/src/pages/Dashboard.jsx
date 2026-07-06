import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { authHeader } from "../utils/auth.js";

const API = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [emailInputs, setEmailInputs] = useState({});
  const [emailStatus, setEmailStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview"); // "overview" | "faculty"
  const [openDepartments, setOpenDepartments] = useState({});

  useEffect(() => {
    axios
      .get(`${API}/api/reports`, { headers: authHeader() })
      .then((res) => setReports(res.data))
      .finally(() => setLoading(false));

    axios
      .get(`${API}/api/auth/users`, { headers: authHeader() })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Failed to fetch users:", err));
  }, []);

  const facultyCount = users.filter((u) => u.role === "faculty").length;

  // Group reports by department (falls back to "Unspecified" for legacy reports
  // created before the department field existed)
  const departmentMap = useMemo(() => {
    const map = {};
    reports.forEach((r) => {
      const dept = (r.department && r.department.trim()) || "Unspecified";
      if (!map[dept]) map[dept] = [];
      map[dept].push(r);
    });
    return map;
  }, [reports]);

  const departments = Object.keys(departmentMap).sort((a, b) => a.localeCompare(b));

  const toggleDepartment = (dept) =>
    setOpenDepartments((prev) => ({ ...prev, [dept]: !prev[dept] }));

  const deleteReport = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    await axios.delete(`${API}/api/reports/${id}`, { headers: authHeader() });
    setReports(reports.filter((r) => r._id !== id));
  };

  const sendEmail = async (id) => {
    const to = emailInputs[id];
    if (!to || !to.trim()) {
      alert("Please enter a recipient email.");
      return;
    }
    setEmailStatus({ ...emailStatus, [id]: "sending" });
    try {
      await axios.post(`${API}/api/reports/email/${id}`, { to: to.trim() }, { headers: authHeader() });
      setEmailStatus({ ...emailStatus, [id]: "sent" });
    } catch {
      setEmailStatus({ ...emailStatus, [id]: "error" });
    }
  };

  const emailBox = (r) => (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="email"
          placeholder="recipient@email.com"
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 w-44"
          value={emailInputs[r._id] || ""}
          onChange={(e) => setEmailInputs({ ...emailInputs, [r._id]: e.target.value })}
        />
        <button
          onClick={() => sendEmail(r._id)}
          disabled={emailStatus[r._id] === "sending"}
          className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:bg-green-400 transition"
        >
          {emailStatus[r._id] === "sending" ? "Sending..." : emailStatus[r._id] === "sent" ? "✓ Sent" : "Send"}
        </button>
      </div>
      {emailStatus[r._id] === "error" && (
        <p className="text-xs text-red-500 mt-1">Failed to send</p>
      )}
    </div>
  );

  const actionButtons = (r) => (
    <div className="flex items-center gap-2">
      <a
        href={`${API}/api/reports/pdf/${r._id}`}
        target="_blank"
        rel="noreferrer"
        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs rounded-lg hover:bg-indigo-100 transition"
      >
        Download PDF
      </a>
      <button
        onClick={() => deleteReport(r._id)}
        className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 transition"
      >
        Delete
      </button>
    </div>
  );

  return (
    <div className="min-h-full bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage all reports, send emails and track activity</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-indigo-500">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Reports</p>
          <p className="text-4xl font-extrabold text-indigo-600">{reports.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Faculty Users</p>
          <p className="text-4xl font-extrabold text-green-600">{facultyCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-purple-500">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Departments</p>
          <p className="text-4xl font-extrabold text-purple-600">{departments.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setTab("overview")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            tab === "overview" ? "bg-indigo-600 text-white shadow" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab("faculty")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            tab === "faculty" ? "bg-indigo-600 text-white shadow" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Faculty (Department-wise)
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400 border border-gray-100">
          Loading...
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400 border border-gray-100">
          No reports yet. Faculty-submitted reports will appear here.
        </div>
      ) : tab === "overview" ? (
        /* ── OVERVIEW: flat table of every report ── */
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800">All Reports</h2>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium">
              {reports.length} total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Submitted By</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Email Report</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">{r.title}</td>
                    <td className="px-6 py-4 text-gray-500">{r.department || "—"}</td>
                    <td className="px-6 py-4 text-gray-500">{r.createdBy || "—"}</td>
                    <td className="px-6 py-4 text-gray-500">{r.date}</td>
                    <td className="px-6 py-4">{emailBox(r)}</td>
                    <td className="px-6 py-4">{actionButtons(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── FACULTY: reports grouped department-wise ── */
        <div className="space-y-4">
          {departments.map((dept) => {
            const deptReports = departmentMap[dept];
            const isOpen = openDepartments[dept] !== false; // default expanded
            return (
              <div key={dept} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleDepartment(dept)}
                  className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                      {dept.slice(0, 1).toUpperCase()}
                    </span>
                    <h2 className="text-base font-bold text-gray-800">{dept}</h2>
                    <span className="text-xs bg-purple-50 text-purple-600 px-3 py-1 rounded-full font-medium">
                      {deptReports.length} report{deptReports.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                        <tr>
                          <th className="px-6 py-3">Title</th>
                          <th className="px-6 py-3">Submitted By</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Email Report</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {deptReports.map((r) => (
                          <tr key={r._id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 font-medium text-gray-800">{r.title}</td>
                            <td className="px-6 py-4 text-gray-500">{r.createdBy || "—"}</td>
                            <td className="px-6 py-4 text-gray-500">{r.date}</td>
                            <td className="px-6 py-4">{emailBox(r)}</td>
                            <td className="px-6 py-4">{actionButtons(r)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
