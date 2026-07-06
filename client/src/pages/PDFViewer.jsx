import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const API = import.meta.env.VITE_API_URL;

export default function PDFViewer() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [pdfBytes, setPdfBytes]         = useState(null);  // Uint8Array
  const [numPages, setNumPages]         = useState(0);
  const [currentPage, setCurrentPage]   = useState(1);
  const [scale, setScale]               = useState(1.2);
  const [status, setStatus]             = useState("loading");
  const [title, setTitle]               = useState("Report");

  useEffect(() => {
    fetch(`${API}/api/reports/pdf/view/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const cd = res.headers.get("content-disposition") || "";
        const m  = cd.match(/filename="?([^"]+\.pdf)"?/i);
        if (m) setTitle(m[1].replace(/\.pdf$/i, ""));
        return res.arrayBuffer();
      })
      .then((buffer) => {
        // Store as Uint8Array — ArrayBuffers can get detached across renders
        setPdfBytes(new Uint8Array(buffer));
        setStatus("ready");
      })
      .catch((err) => {
        console.error("PDF fetch error:", err);
        setStatus("error");
      });
  }, [id]);

  // Memoize the file prop so react-pdf never sees it as "changed"
  const pdfFile = useMemo(
    () => (pdfBytes ? { data: pdfBytes } : null),
    [pdfBytes]
  );

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  const goTo = (page) => {
    setCurrentPage(Math.max(1, Math.min(numPages, page)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", background: "#1a1a2e", fontFamily: "sans-serif",
      overflow: "hidden",
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px", background: "#1e1b4b", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}>
        {/* Back */}
        <button onClick={() => navigate(-1)} style={btn("#3730a3")}>
          ← Back
        </button>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)" }} />

        {/* Title */}
        <span style={{
          color: "white", fontWeight: 600, fontSize: 13,
          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          📄 {title || "Report"}
        </span>

        {/* Page controls — only show when PDF loaded */}
        {status === "ready" && numPages > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage <= 1}
              style={btn("#374151", currentPage <= 1)}
            >‹</button>

            <span style={{ color: "#c7d2fe", fontSize: 13, whiteSpace: "nowrap", minWidth: 70, textAlign: "center" }}>
              {currentPage} / {numPages}
            </span>

            <button
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage >= numPages}
              style={btn("#374151", currentPage >= numPages)}
            >›</button>

            {/* Zoom */}
            <button onClick={() => setScale(s => Math.min(2.5, +(s + 0.2).toFixed(1)))} style={btn("#374151")}>+</button>
            <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.2).toFixed(1)))} style={btn("#374151")}>−</button>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>{Math.round(scale * 100)}%</span>
          </div>
        )}

        {/* Download */}
        <a
          href={`${API}/api/reports/pdf/${id}`}
          download
          style={{ ...btn("#059669"), textDecoration: "none", marginLeft: 4 }}
        >
          ⬇ Download
        </a>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          flex: 1, overflowY: "auto", overflowX: "auto",
          display: "flex", flexDirection: "column",
          alignItems: "center", padding: "24px 16px",
          background: "#525659",
        }}
      >
        {/* Loading */}
        {status === "loading" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{
              width: 44, height: 44,
              border: "4px solid rgba(255,255,255,0.15)",
              borderTop: "4px solid #6366f1",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "#e2e8f0", fontSize: 14, margin: 0 }}>Generating PDF…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div style={{
            marginTop: 60,
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 14, padding: "28px 36px",
            textAlign: "center", maxWidth: 360, color: "#fca5a5",
          }}>
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>❌ Failed to load PDF</p>
            <p style={{ fontSize: 13, margin: "0 0 18px", color: "#f87171" }}>
              Check the server console and try again.
            </p>
            <button onClick={() => navigate(-1)} style={btn("#7f1d1d")}>← Go Back</button>
          </div>
        )}

        {/* PDF rendered page-by-page on canvas — no browser PDF plugin needed */}
        {status === "ready" && pdfFile && (
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(e) => { console.error(e); setStatus("error"); }}
            loading={
              <p style={{ color: "#e2e8f0", fontSize: 14 }}>Loading pages…</p>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              canvasBackground="white"
            />
          </Document>
        )}
      </div>

      {/* ── Bottom page bar (mobile-friendly) ── */}
      {status === "ready" && numPages > 1 && (
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          gap: 12, padding: "10px 16px", background: "#1e1b4b", flexShrink: 0,
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}>
          <button onClick={() => goTo(1)}            disabled={currentPage <= 1}      style={btn("#374151", currentPage <= 1)}>«</button>
          <button onClick={() => goTo(currentPage-1)} disabled={currentPage <= 1}     style={btn("#374151", currentPage <= 1)}>‹ Prev</button>
          <span style={{ color: "white", fontSize: 13 }}>Page {currentPage} of {numPages}</span>
          <button onClick={() => goTo(currentPage+1)} disabled={currentPage >= numPages} style={btn("#374151", currentPage >= numPages)}>Next ›</button>
          <button onClick={() => goTo(numPages)}     disabled={currentPage >= numPages} style={btn("#374151", currentPage >= numPages)}>»</button>
        </div>
      )}
    </div>
  );
}

function btn(bg, disabled = false) {
  return {
    background: disabled ? "#374151" : bg,
    border: "none", color: disabled ? "#6b7280" : "white",
    padding: "7px 14px", borderRadius: 7,
    fontSize: 13, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    display: "inline-block", transition: "opacity 0.15s",
  };
}