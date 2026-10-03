import {BrowserRouter, Routes, Route} from "react-router-dom";
import AuthProvider from "./providers/authProvider";
import SnackbarProvider from "./providers/snackbarProvider";
import {ProtectedRoute} from "./components/protectedRoute/ProtectedRoute";
import {SessionExpiryBanner} from "./components/SessionExpiryBanner";
import Layout from "./components/layout/Layout/Layout";
import HomePage from "./pages/home/HomePage";
import CreatePatient from "./pages/patients/CreatePatient/CreatePatient";
import EnterResultsPage from "./pages/results/EnterResults/EnterResultsPage.tsx";
import PatientProfilePage from "./pages/patients/PatientDashboard/PatientDashboardPage.tsx";
import PatientHomePage from "./pages/patients/PatientHomePage/PatientHomePage.tsx";
import AppointmentsPage from "./pages/doctors/AppointmentsPage/AppointmentsPage.tsx";

function AppRoutes() {
    return (
        <Routes>
            {/* All pages inside Layout will have the Header */}
            <Route element={<Layout/>}>

                {/* Public */}
                <Route path="/" element={<HomePage/>}/>

                {/* Doctor */}
                <Route
                    path="/createPatientProfile"
                    element={
                        <ProtectedRoute allowedRoles={["doctor"]}>
                            <CreatePatient/>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/appointments"
                    element={
                        <ProtectedRoute allowedRoles={["doctor"]}>
                            <AppointmentsPage/>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/addResult"
                    element={
                        <ProtectedRoute allowedRoles={["doctor"]}>
                            <EnterResultsPage/>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/patients/:patientId/trends"
                    element={
                        <ProtectedRoute allowedRoles={["doctor", "patient"]}>
                            <PatientProfilePage/>
                        </ProtectedRoute>
                    }
                />

                {/* Patient */}
                <Route
                    path="/patient"
                    element={
                        <ProtectedRoute allowedRoles={["patient"]}>
                            <PatientHomePage/>
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
                    <SessionExpiryBanner/>
                    <AppRoutes/>
                </SnackbarProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}