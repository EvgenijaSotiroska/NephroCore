import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./providers/authProvider";
import SnackbarProvider from "./providers/snackbarProvider";
import { ProtectedRoute } from "./components/protectedRoute/ProtectedRoute";
import { SessionExpiryBanner } from "./components/SessionExpiryBanner";
import Layout from "./components/layout/Layout/Layout";
import HomePage from "./pages/home/HomePage";
import CreatePatient from "./pages/CreatePatient";
import PatientHome from "./pages/PatientHome";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
      </Route>

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
        <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
        </Route>
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