import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./providers/authProvider";
import SnackbarProvider from "./providers/snackbarProvider";
import { ProtectedRoute } from "./components/protectedRoute/ProtectedRoute";
import { SessionExpiryBanner } from "./components/SessionExpiryBanner";
import Layout from "./components/layout/Layout/Layout";
import HomePage from "./pages/home/HomePage";
import CreatePatient from "./pages/patients/CreatePatient/CreatePatient";
import PatientHome from "./pages/PatientHome";
import EnterResultsPage from "./pages/results/EnterResults/EnterResultsPage.tsx";

function AppRoutes() {
  return (
    <Routes>
      {/* All pages inside Layout will have the Header */}
      <Route element={<Layout />}>

        {/* Public */}
        <Route path="/" element={<HomePage />} />

        {/* Doctor */}
        <Route
          path="/createPatientProfile"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <CreatePatient />
            </ProtectedRoute>
          }
        />

          <Route
          path="/addResult"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <EnterResultsPage />
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