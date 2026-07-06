import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./pages/SignUp.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import MainLayout from "./components/MainLayout.jsx";
import CreateReport from "./pages/CreateReport.jsx";
import ViewReports from "./pages/ViewReports";
import Dashboard from "./pages/Dashboard.jsx";
import VerifyOTP from "./pages/VerifyOTP.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import PDFViewer from "./pages/PDFViewer.jsx";
import { getRole } from "./utils/auth.js";

// Where a logged-in user should land, based on their role
function homeForRole() {
  return getRole() === "admin" ? "/dashboard" : "/home";
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/signup" replace />;
}

// Only allows the Admin role through; faculty get redirected to their own home
function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/admin-login" replace />;
  return getRole() === "admin" ? children : <Navigate to="/home" replace />;
}

// Only allows the Faculty role through; admin gets redirected to the dashboard
function FacultyRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/signup" replace />;
  return getRole() === "faculty" ? children : <Navigate to="/dashboard" replace />;
}

// Redirect already-logged-in users away from public pages
function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? <Navigate to={homeForRole()} replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root — go to role home if logged in, else the sign up chooser */}
        <Route
          path="/"
          element={
            localStorage.getItem("token")
              ? <Navigate to={homeForRole()} replace />
              : <Navigate to="/signup" replace />
          }
        />

        {/* Sign Up chooser — Admin vs Faculty */}
        <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />

        {/* Public routes — redirect to role home if already logged in */}
        <Route path="/admin-login"    element={<PublicRoute><AdminLogin /></PublicRoute>} />
        <Route path="/register"       element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/verify-otp"     element={<PublicRoute><VerifyOTP /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes with sidebar layout */}
        <Route
          path="/home"
          element={
            <FacultyRoute>
              <Home />
            </FacultyRoute>
          }
        />
        <Route
          path="/create"
          element={
            <FacultyRoute>
              <MainLayout activeTab="create">
                <CreateReport />
              </MainLayout>
            </FacultyRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <FacultyRoute>
              <MainLayout activeTab="reports">
                <ViewReports />
              </MainLayout>
            </FacultyRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <MainLayout activeTab="dashboard">
                <Dashboard />
              </MainLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/view-report/:id"
          element={
            <PrivateRoute>
              <PDFViewer />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;