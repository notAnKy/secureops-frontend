import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { authService, type Role } from "@/services/auth.service";

import Login  from "@/pages/auth/Login";
import SignUp from "@/pages/auth/SignUp";
import Home   from "@/pages/Home";

import ClientDashboard from "@/pages/client/Dashboard";
import CreateRequest   from "@/pages/client/CreateRequest";
import MyRequests      from "@/pages/client/MyRequests";
import RequestDetails  from "@/pages/client/RequestDetails";
import AdminDashboard  from "@/pages/admin/AdminDashboard";
import ManageUsers     from "@/pages/admin/ManageUsers";
import ManageServices  from "@/pages/admin/ManageServices";
import ViewRequests    from "@/pages/admin/ViewRequests";
import AssignTasks     from "@/pages/admin/AssignTasks";
import MyTasks         from "@/pages/employee/MyTasks";
import TaskDetails     from "@/pages/employee/TaskDetails";
import LegalPage from "@/pages/auth/LegalPage";
import NotFound from "@/pages/NotFound";
import Profile from "@/pages/client/Profile";
import EmployeeProfile from "@/pages/employee/EmployeeProfile";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword  from "@/pages/auth/ResetPassword";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: Role[] }) {
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />;
  if (allowedRoles) {
    const role = authService.getRole();
    if (!role || !allowedRoles.includes(role)) return <Navigate to="/404" replace />;
  }
  return <>{children}</>;
}

function RootRoute() {
  if (!authService.isAuthenticated()) return <Home />;
  const role = authService.getRole();
  if (role === "ADMIN")    return <Navigate to="/admin/dashboard" replace />;
  if (role === "EMPLOYEE") return <Navigate to="/employee/tasks"  replace />;
  return <Navigate to="/client/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<RootRoute />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* CLIENT */}
        <Route path="/client/dashboard"      element={<ProtectedRoute allowedRoles={["CLIENT"]}><ClientDashboard /></ProtectedRoute>} />
        <Route path="/client/create-request" element={<ProtectedRoute allowedRoles={["CLIENT"]}><CreateRequest /></ProtectedRoute>} />
        <Route path="/client/requests"       element={<ProtectedRoute allowedRoles={["CLIENT"]}><MyRequests /></ProtectedRoute>} />
        <Route path="/client/requests/:id"   element={<ProtectedRoute allowedRoles={["CLIENT"]}><RequestDetails /></ProtectedRoute>} />
        <Route path="/client/profile" element={<ProtectedRoute allowedRoles={["CLIENT"]}><Profile /></ProtectedRoute>} />

        {/* ADMIN */}
        <Route path="/admin/dashboard"    element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users"        element={<ProtectedRoute allowedRoles={["ADMIN"]}><ManageUsers /></ProtectedRoute>} />
        <Route path="/admin/services"     element={<ProtectedRoute allowedRoles={["ADMIN"]}><ManageServices /></ProtectedRoute>} />
        <Route path="/admin/requests"     element={<ProtectedRoute allowedRoles={["ADMIN"]}><ViewRequests /></ProtectedRoute>} />
        <Route path="/admin/requests/:id" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AssignTasks /></ProtectedRoute>} />

        {/* EMPLOYEE */}
        <Route path="/employee/tasks"     element={<ProtectedRoute allowedRoles={["EMPLOYEE"]}><MyTasks /></ProtectedRoute>} />
        <Route path="/employee/tasks/:id" element={<ProtectedRoute allowedRoles={["EMPLOYEE"]}><TaskDetails /></ProtectedRoute>} />
        <Route path="/employee/profile" element={<ProtectedRoute allowedRoles={["EMPLOYEE"]}><EmployeeProfile /></ProtectedRoute>} />

        <Route path="/404" element={<NotFound />} />
        <Route path="*"    element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}