import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./providers/authProvider";
import SnackbarProvider from "./providers/snackbarProvider";
import { ProtectedRoute } from "./components/protectedRoute/ProtectedRoute";
import { SessionExpiryBanner } from "./components/SessionExpiryBanner";
import Layout from "./components/layout/Layout/Layout";
import HomePage from "./pages/home/HomePage";
import CreatePatient from "./pages/patients/CreatePatient/CreatePatient";
import PatientHome from "./pages/PatientHome";

function AppRoutes() {
  return (
    <Routes>
      {/* All pages inside Layout will have the Header */}
      <Route element={<Layout />}>

        {/* Public */}
        <Route path="/" element={<HomePage />} />

        {/* Doctor */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <CreatePatient />
            </ProtectedRoute>
          }
        />

        {/* Patient */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientHome />
            </ProtectedRoute>
          }
        />

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