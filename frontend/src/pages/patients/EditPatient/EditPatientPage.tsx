import { useParams } from "react-router";
import { usePatientProfile } from "../../../hooks/usePatientProfile";
import CreatePatient from "../CreatePatient/CreatePatient";

// The "edit profile" page: the same form as "create patient", filled with the saved values.
export default function EditPatientPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { profile, loading, error } = usePatientProfile(patientId);

  if (loading) {
    return (
      <div className="create-patient-page">
        <p>Се вчитува профилот на пациентот…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="create-patient-page">
        <p>{error ?? "Пациентот не е пронајден."}</p>
      </div>
    );
  }

  // key: a different patient always starts with a fresh form
  return <CreatePatient key={profile.id} existing={profile} />;
}
