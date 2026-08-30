import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./providers/authProvider";
import SnackbarProvider from "./providers/snackbarProvider";
import { ProtectedRoute } from "./components/protectedRoute/ProtectedRoute.tsx";
import { SessionExpiryBanner } from "./components/SessionExpiryBanner";
import useAuth from "./hooks/useAuth";
import Login from "./pages/auth/LoginPage.tsx";
import DoctorRegister from "./pages/auth/RegisterPage.tsx";
import ActivateAccount from "./pages/auth/ActivatePage.tsx";
import CreatePatient from "./pages/CreatePatient";
import PatientHome from "./pages/PatientHome";

// Sends a logged-in user to the right home screen for their role;
// unauthenticated users fall through to /login via ProtectedRoute.
function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "doctor" ? "/doctor" : "/patient"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<DoctorRegister />} />
      <Route path="/activate" element={<ActivateAccount />} />

      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <CreatePatient />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PatientHome />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SnackbarProvider>
          <SessionExpiryBanner />
          <AppRoutes />
        </SnackbarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}