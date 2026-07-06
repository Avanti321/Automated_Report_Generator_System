require("dotenv").config();
const router      = require("express").Router();
const multer      = require("multer");
const Report      = require("../models/Report");
const PDFDocument = require("pdfkit");
const fs          = require("fs");
const path        = require("path");
const QRCode      = require("qrcode");
const axios       = require("axios");
const cloudinary  = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { authenticate, requireAdmin } = require("../middleware/auth");

// ── Cloudinary config ─────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer uploads directly to Cloudinary ─────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "activity-reports",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation:  [{ quality: "auto" }],
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ─────────────────────────────────────────────
//  SEND EMAIL VIA BREVO HTTP API (no SDK needed)
// ─────────────────────────────────────────────
async function sendEmailWithBrevo(to, subject, htmlContent, pdfBuffer, pdfName) {
  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name:  "Report System",
        email: process.env.BREVO_USER,
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
      attachment: [
        {
          name:    pdfName,
          content: pdfBuffer.toString("base64"),
        },
      ],
    },
    {
      headers: {
        "api-key":     process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept":       "application/json",
      },
    }
  );
  return response.data;
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
async function makeQR(url) {
  return QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    type:   "png",
    width:  160,
    margin: 1,
    color:  { dark: "#1e1b4b", light: "#ffffff" },
  });
}

async function fetchImageBuffer(imgUrl) {
  // Valid Cloudinary / absolute URL — fetch over HTTP
  if (imgUrl && /^https?:\/\//i.test(imgUrl)) {
    const response = await axios.get(imgUrl, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  }

  // Legacy bare filename — try reading from local uploads/ folder
  if (imgUrl) {
    const localPath = path.join(__dirname, "..", "uploads", path.basename(imgUrl));
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
  }

  throw new Error(`Image not found — not a URL and not in uploads/: ${imgUrl}`);
}

// ─────────────────────────────────────────────
//  PDF GENERATOR
// ─────────────────────────────────────────────
async function generatePDF(report) {
  const outPath = path.join("uploads", `report-${report._id}.pdf`);
  if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

  return new Promise(async (resolve, reject) => {
    try {
      const M   = 40;
      const doc = new PDFDocument({
        size:          "A4",
        margin:        M,
        autoFirstPage: true,
        bufferPages:   false,
      });

      const PW   = doc.page.width;
      const PH   = doc.page.height;
      const CW   = PW - M * 2;
      const SAFE = PH - M - 10;

      const INDIGO   = "#3730a3";
      const GRAY     = "#6b7280";
      const BLACK    = "#1f2937";
      const BGBLUE   = "#eef2ff";
      const LINERULE = "#c7d2fe";

      const stream = fs.createWriteStream(outPath);
      doc.pipe(stream);

      function hr(color, weight) {
        doc.moveTo(M, doc.y).lineTo(PW - M, doc.y)
          .lineWidth(weight || 0.5).strokeColor(color || LINERULE).stroke();
        doc.y += 6;
      }

      function heading(text) {
        if (doc.y > SAFE - 50) { doc.addPage(); doc.y = M; }
        doc.fontSize(10.5).font("Helvetica-Bold").fillColor(INDIGO)
          .text(text.toUpperCase(), { characterSpacing: 0.6 });
        doc.y += 2;
        hr(LINERULE, 0.4);
        doc.fillColor(BLACK).font("Helvetica").fontSize(10);
      }

      function row(label, value) {
        if (!value) return;
        doc.font("Helvetica-Bold").fillColor(BLACK)
          .text(`${label}:  `, { continued: true })
          .font("Helvetica").text(value);
      }

      async function placeImg(imgUrl, imgW, imgH, contHeading) {
        if (!imgUrl) return;
        if (doc.y + imgH > SAFE) {
          doc.addPage(); doc.y = M;
          if (contHeading) heading(contHeading);
          doc.y += 4;
        }
        const x = M + (CW - imgW) / 2;
        const y = doc.y;
        try {
          const imgBuffer = await fetchImageBuffer(imgUrl);
          doc.image(imgBuffer, x, y, { width: imgW, height: imgH });
        } catch (imgErr) {
          console.error("Image render error:", imgUrl, imgErr.message);
        }
        doc.y = y + imgH + 8;
      }

      async function drawQRSection(sectionTitle, scanLabel, link, errorFallbackLabel) {
        if (doc.y + 200 > SAFE) { doc.addPage(); doc.y = M; }
        heading(sectionTitle);
        doc.y += 4;
        doc.fontSize(10).font("Helvetica").fillColor(GRAY).text(scanLabel, { width: CW });
        doc.y += 10;
        try {
          const qrBuf = await makeQR(link);
          const QR_SZ = 105;
          const qrX   = (PW - QR_SZ) / 2;
          const qrY   = doc.y;
          doc.save().roundedRect(qrX - 10, qrY - 8, QR_SZ + 20, QR_SZ + 18, 6)
            .fill("#f0f4ff").restore();
          doc.image(qrBuf, qrX, qrY, { width: QR_SZ, height: QR_SZ });
          doc.y = qrY + QR_SZ + 20;
          doc.fillColor(BLACK);
        } catch (e) {
          console.error(`${sectionTitle} QR error:`, e.message);
          doc.text(`${errorFallbackLabel}: ${link}`, { width: CW });
          doc.y += 10;
        }
      }

      // SECTION 1 — College Header
      const LOGO_SIZE = 50;
      const logoCandidates = [
        path.join(__dirname, "../client/src/assets/logo.png"),
        path.join(__dirname, "../../client/src/assets/logo.png"),
        path.join(__dirname, "../public/logo.png"),
        path.join(process.cwd(), "client/src/assets/logo.png"),
        path.join(process.cwd(), "public/logo.png"),
        path.join(process.cwd(), "logo.png"),
      ];
      const logoPath = logoCandidates.find(p => fs.existsSync(p)) || null;
      if (logoPath) {
        const logoX = (PW - LOGO_SIZE) / 2;
        const logoY = doc.y;
        try {
          doc.image(logoPath, logoX, logoY, { width: LOGO_SIZE, height: LOGO_SIZE });
        } catch (_) { console.warn("Logo render failed, skipping."); }
        doc.y = logoY + LOGO_SIZE + 8;
      }

      doc.fontSize(13).font("Helvetica-Bold").fillColor(INDIGO)
        .text("Progressive Education Society's", { align: "center" });
      doc.y += 1;
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(BLACK)
        .text("Modern College of Arts, Science and Commerce (Autonomous)", { align: "center" });
      doc.y += 1;
      doc.fontSize(9).font("Helvetica").fillColor(GRAY)
        .text("Ganeshkhind, Pune - 411016", { align: "center" });
      doc.y += 5;

      doc.moveTo(M, doc.y).lineTo(PW - M, doc.y).lineWidth(1.8).strokeColor(INDIGO).stroke();
      doc.y += 8;

      const BANNER_H = 28;
      doc.save().rect(M, doc.y, CW, BANNER_H).fill(BGBLUE).restore();
      doc.fontSize(12).font("Helvetica-Bold").fillColor(INDIGO)
        .text((report.title || "ACTIVITY REPORT").toUpperCase(),
          M, doc.y + (BANNER_H - 12) / 2,
          { width: CW, align: "center", characterSpacing: 0.7 });
      doc.y += BANNER_H + 10;

      // SECTION 2 — Event Details
      heading("Event Details");
      row("Date",         report.date);
      row("Duration",     report.duration);
      row("Organized By", report.organizedBy);
      row("Speaker",      report.speakerName);
      row("Designation",  report.speakerDesignation);

      let attend = "—";
      let tc = report.whocanattend || [];
      if (!Array.isArray(tc)) tc = [tc];
      tc = tc.filter(v => v && v.trim());
      if (tc.includes("All")) {
        attend = "All members can attend the workshop/event.";
      } else if (tc.length === 1) {
        const map1 = {
          "Students":        "Students can attend the session.",
          "Faculty Members": "Faculty members can attend the session.",
          "Researchers":     "Researchers can attend the session.",
        };
        attend = map1[tc[0]] || tc[0];
      } else if (tc.length > 1) {
        const map = {
          "Students":        "Students",
          "Faculty Members": "Faculty members",
          "Researchers":     "Researchers",
        };
        const words = tc.map(v => map[v]).filter(Boolean);
        const last  = words.pop();
        attend = `${words.join(", ")} and ${last} can attend the session.`;
      }
      row("Who Can Attend", attend);
      doc.y += 7;

      // SECTION 3 — Session Conducted By
      if (report.sessionRoles) {
        heading("Session Conducted By");
        row("HOD",            report.sessionRoles.hod);
        row("Coordinator",    report.sessionRoles.coordinator);
        row("Anchor",         report.sessionRoles.anchor);
        row("Vote of Thanks", report.sessionRoles.voteOfThanks);
        doc.y += 7;
      }

      // SECTION 4 — Objective
      heading("Objective");
      doc.fontSize(10).font("Helvetica").fillColor(BLACK)
        .text(report.objective || "—", { width: CW, align: "justify", lineGap: 1.5 });
      doc.y += 7;

      // SECTION 5 — Summary
      heading("Summary");
      doc.fontSize(10).font("Helvetica").fillColor(BLACK)
        .text(report.summary || "—", { width: CW, align: "justify", lineGap: 1.5 });
      doc.y += 7;

      // SECTION 6 — Notice Photos
      if (report.noticeFile && report.noticeFile.length > 0) {
        doc.addPage(); doc.y = M;
        heading("Notice / Circular");
        doc.y += 4;
        for (const imgUrl of report.noticeFile) {
          await placeImg(imgUrl, CW, 235, "Notice / Circular (continued)");
          doc.y += 16;
        }
      }

      // SECTION 7 — Event Photos
      if (report.photos && report.photos.length > 0) {
        doc.addPage(); doc.y = M;
        heading("Event Photos");
        doc.y += 4;
        const H_GAP = 14;
        const V_GAP = 14;
        const EW    = (CW - H_GAP) / 2;
        const EH    = 185;
        let col  = 0;
        let rowY = doc.y;
        for (let i = 0; i < report.photos.length; i++) {
          const imgUrl = report.photos[i];
          if (!imgUrl) continue;
          if (col === 0 && rowY + EH > SAFE) {
            doc.addPage(); doc.y = M;
            heading("Event Photos (continued)");
            doc.y += 4;
            rowY = doc.y;
          }
          const x = M + col * (EW + H_GAP);
          try {
            const imgBuffer = await fetchImageBuffer(imgUrl);
            doc.image(imgBuffer, x, rowY, {
              width: EW, height: EH, fit: [EW, EH], align: "center", valign: "center",
            });
          } catch (imgErr) {
            console.error("Photo render error:", imgErr.message);
          }
          if (col === 0) { col = 1; } else { col = 0; rowY += EH + V_GAP; }
        }
        doc.y = rowY + (col === 1 ? EH : 0) + V_GAP;
      }

      // SECTION 8 — QR Codes + Signatures
      doc.addPage(); doc.y = M;
      if (report.registrationLink) {
        await drawQRSection("Event Registration",
          "Scan the QR code below to register for this event:",
          report.registrationLink, "Registration");
      }
      if (report.attendanceLink) {
        await drawQRSection("Event Attendance",
          "Scan the QR code below to mark your attendance:",
          report.attendanceLink, "Attendance");
      }
      if (report.feedbackformLink) {
        await drawQRSection("Event Feedback",
          "Scan the QR code below to fill in the feedback form:",
          report.feedbackformLink, "Feedback");
      }

      if (doc.y + 120 > SAFE) { doc.addPage(); doc.y = M; }
      heading("Signatures");
      doc.y += 38;
      const COL_W    = Math.floor(CW / 3);
      const LINE_W   = Math.floor(COL_W * 0.72);
      const LINE_OFF = Math.floor((COL_W - LINE_W) / 2);
      const sig1X = M + LINE_OFF;
      const sig2X = M + COL_W + LINE_OFF;
      const sig3X = M + COL_W * 2 + LINE_OFF;
      const sigY  = doc.y;
      function sigSlot(x, label) {
        doc.moveTo(x, sigY).lineTo(x + LINE_W, sigY)
          .lineWidth(0.8).strokeColor(BLACK).stroke();
        doc.fontSize(9).font("Helvetica-Bold").fillColor(INDIGO)
          .text(label, x, sigY + 5, { width: LINE_W, align: "center" });
      }
      sigSlot(sig3X, "Principal");
      sigSlot(sig2X, "Vice Principal");
      sigSlot(sig1X, "HOD");
      doc.y = sigY + 48;
      doc.y += 12;
      hr(LINERULE, 0.4);
      doc.fontSize(8).font("Helvetica").fillColor(GRAY)
        .text(`Report generated on ${new Date().toLocaleDateString("en-IN")} | Activity Report System`,
          M, doc.y, { width: CW, align: "center" });

      doc.end();
      stream.on("finish", () => resolve(outPath));
      stream.on("error",  reject);

    } catch (err) {
      console.error("❌ PDF ERROR:", err.message);
      reject(err);
    }
  });
}

// ─────────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────────

// CREATE (faculty only — the submitting faculty member and their department
// are taken from the verified token, not trusted from the request body)
router.post("/",
  authenticate,
  upload.fields([
    { name: "noticeFile", maxCount: 10 },
    { name: "photos",     maxCount: 20 },
  ]),
  async (req, res) => {
    try {
      const data = JSON.parse(req.body.data);

      // ── Server-side validation (guards against direct API calls too) ──
      const requiredTopLevel = [
        "title", "date", "duration", "objective", "summary",
        "organizedBy", "department", "speakerName", "speakerDesignation"
      ];
      for (const field of requiredTopLevel) {
        if (!data[field] || !data[field].toString().trim()) {
          return res.status(400).json({
            error: `Field "${field}" is required and cannot be empty.`
          });
        }
      }

      const sessionRoleFields = ["hod", "coordinator", "anchor", "voteOfThanks"];
      for (const role of sessionRoleFields) {
        if (!data.sessionRoles?.[role] || !data.sessionRoles[role].trim()) {
          return res.status(400).json({
            error: `Session role "${role}" is required.`
          });
        }
      }

      if (!req.files["noticeFile"] || req.files["noticeFile"].length === 0) {
        return res.status(400).json({ error: "At least one Notice / Circular file is required." });
      }
      if (!req.files["photos"] || req.files["photos"].length === 0) {
        return res.status(400).json({ error: "At least one Event Photo is required." });
      }
      // ── End validation ──

      if (req.files["noticeFile"])
        data.noticeFile = req.files["noticeFile"].map((f) => f.path);
      if (req.files["photos"])
        data.photos = req.files["photos"].map((f) => f.path);

      // createdBy always comes from the verified token, never the client body
      data.createdBy = req.user.name ? `${req.user.name} <${req.user.email}>` : req.user.email;

      const report = new Report(data);
      await report.save();
      console.log("✅ Report saved:", report.title);
      res.status(201).json(report);
    } catch (err) {
      console.error("❌ CREATE ERROR:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// GET ALL (any logged-in user — faculty see reports to review, admin sees everything)
router.get("/", authenticate, async (req, res) => {
  try {
    res.json(await Report.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VIEW PDF — serves raw PDF bytes; frontend fetches as blob and renders in iframe (MUST be before /pdf/:id)
router.get("/pdf/view/:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Not found" });
    console.log("👁️ PDF view for:", report.title);
    const fp       = await generatePDF(report);
    const absPath  = path.isAbsolute(fp) ? fp : path.join(__dirname, "..", fp);
    const safeName = (report.title || "report")
      .replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "report";
    const pdfBuffer = fs.readFileSync(absPath);
    // Allow browser to render inline — object/embed tags need these headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${safeName}.pdf"`);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Type");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ PDF VIEW ERROR:", err.message);
    if (!res.headersSent) res.status(500).json({ error: "PDF generation failed: " + err.message });
  }
});

// DOWNLOAD PDF — forces file save dialog
router.get("/pdf/:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Not found" });
    console.log("📄 PDF download for:", report.title);
    const fp = await generatePDF(report);
    res.download(fp, `${report.title || "report"}.pdf`);
  } catch (err) {
    console.error("❌ PDF DOWNLOAD ERROR:", err.message);
    res.status(500).json({ error: "PDF generation failed: " + err.message });
  }
});

// EMAIL (any authenticated user — faculty email their own new report, admin emails any report)
router.post("/email/:id", authenticate, async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: "Email required" });

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Not found" });

    console.log("📧 Sending email to:", to);

    // Generate PDF
    const fp        = await generatePDF(report);
    const pdfBuffer = fs.readFileSync(fp);

    // Send via Brevo HTTP API
    await sendEmailWithBrevo(
      to,
      `Activity Report – ${report.title}`,
      `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#3730a3">Activity Report – ${report.title}</h2>
          <p><strong>Date:</strong> ${report.date || "N/A"}</p>
          <p><strong>Organized By:</strong> ${report.organizedBy || "N/A"}</p>
          <p>Please find the activity report attached as a PDF.</p>
          <hr/>
          <p style="color:#6b7280;font-size:12px">Generated by Activity Report System</p>
        </div>
      `,
      pdfBuffer,
      `${report.title || "report"}.pdf`
    );

    console.log("✅ Email sent successfully to:", to);
    res.json({ message: "Email sent successfully" });

  } catch (err) {
    console.error("❌ EMAIL ERROR:", err.message);
    console.error("❌ EMAIL DETAILS:", err.response?.data || err);
    res.status(500).json({ error: "Email failed: " + err.message });
  }
});

// DELETE (Admin only)
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const r = await Report.findByIdAndDelete(req.params.id);
    if (r) {
      const allUrls = [...(r.noticeFile || []), ...(r.photos || [])];
      for (const url of allUrls) {
        try {
          const parts    = url.split("/");
          const file     = parts[parts.length - 1];
          const folder   = parts[parts.length - 2];
          const publicId = `${folder}/${file.split(".")[0]}`;
          await cloudinary.uploader.destroy(publicId);
        } catch (e) {
          console.error("Cloudinary delete error:", e.message);
        }
      }
      const pdfPath = path.join("uploads", `report-${r._id}.pdf`);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    }
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE ERROR:", err.message);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;