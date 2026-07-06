import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { authHeader } from "../utils/auth.js";

const API = import.meta.env.VITE_API_URL;

export default function ViewReports() {
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/api/reports`, { headers: authHeader() })
      .then((res) => {
        setReports(res.data);
        // Auto-select the most recent year
        if (res.data.length > 0) {
          const years = [...new Set(
            res.data.map((r) => new Date(r.date).getFullYear())
          )].sort((a, b) => b - a);
          setSelectedYear(years[0]);
        }
      })
      .catch(() => setError("Failed to load reports."))
      .finally(() => setLoading(false));
  }, []);

  // Build year → reports map
  const yearMap = useMemo(() => {
    const map = {};
    reports.forEach((r) => {
      const yr = new Date(r.date).getFullYear();
      if (!map[yr]) map[yr] = [];
      map[yr].push(r);
    });
    return map;
  }, [reports]);

  const years = Object.keys(yearMap)
    .map(Number)
    .sort((a, b) => b - a); // newest first

  const visibleReports = selectedYear ? (yearMap[selectedYear] || []) : [];

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        <svg className="animate-spin w-5 h-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading reports...
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="m-8 bg-red-50 text-red-600 border border-red-100 rounded-xl p-4 text-sm">
        {error}
      </div>
    );
  }

  // ── No reports at all ──
  if (reports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center max-w-md w-full">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 font-semibold">No reports yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first report to get started.</p>
        </div>
      </div>
    );
  }

  // ── Main layout ──
  return (
    <div className="flex min-h-full bg-gray-50">

      {/* ── Year Sidebar ── */}
      <aside className="w-52 shrink-0 bg-white border-r border-gray-100 flex flex-col shadow-sm">
        <div className="px-4 py-5 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">Filter by Year</p>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {/* "All" option */}
          <button
            onClick={() => setSelectedYear("all")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              selectedYear === "all"
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
            }`}
          >
            <span>All Years</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              selectedYear === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {reports.length}
            </span>
          </button>

          {years.map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                selectedYear === yr
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              <span>{yr}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                selectedYear === yr ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {yearMap[yr].length}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Reports Panel ── */}
      <div className="flex-1 p-6 overflow-y-auto">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-800">
              {selectedYear === "all"
                ? "All Reports"
                : `Reports — ${selectedYear}`}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {selectedYear === "all" ? reports.length : visibleReports.length} report
              {(selectedYear === "all" ? reports.length : visibleReports.length) !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {/* Grid */}
        {(selectedYear === "all" ? reports : visibleReports).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium">No reports for {selectedYear}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {(selectedYear === "all" ? reports : visibleReports).map((r) => (
              <ReportCard key={r._id} report={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Individual Report Card ──
function ReportCard({ report: r }) {
  const navigate = useNavigate();
  const formattedDate = (() => {
    try {
      return new Date(r.date).toLocaleDateString("en-IN", {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch {
      return r.date;
    }
  })();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 flex flex-col">

      {/* Icon + date */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-xs text-gray-400 mt-1">{formattedDate}</span>
      </div>

      {/* Title */}
      <h2 className="text-sm font-bold text-gray-800 mb-1 line-clamp-2 flex-1">{r.title}</h2>

      {/* Organized by */}
      {r.organizedBy && (
        <p className="text-xs text-gray-400 mb-1">
          <span className="font-medium text-gray-500">By:</span> {r.organizedBy}
        </p>
      )}

      {/* Report type badge */}
      {r.reportType && (
        <span className="inline-block mt-1 mb-3 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium w-fit">
          {r.reportType}
        </span>
      )}

      {/* ── Action buttons ── */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">

        {/* VIEW — opens PDF in full-page viewer */}
        <button
          onClick={() => navigate(`/view-report/${r._id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold
                     bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors duration-150"
          title="Open PDF in viewer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                 -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </button>

        {/* DOWNLOAD — triggers file save */}
        <a
          href={`${import.meta.env.VITE_API_URL}/api/reports/pdf/${r._id}`}
          download
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold
                     bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors duration-150"
          title="Download PDF to device"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1
                 m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </a>
      </div>
    </div>
  );
}


