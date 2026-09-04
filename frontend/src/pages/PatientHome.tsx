import { usePatientProfile } from "../hooks/usePatientProfile";

export default function PatientHome() {
  const { profile, loading, error } = usePatientProfile();

  if (loading) return <p>Loading your profile…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!profile) return null;

  return (
    <div>
      <h2>Welcome, {profile.full_name}</h2>

      <p>
        <strong>Sex:</strong> {profile.sex}
      </p>

      {profile.date_of_birth && (
        <p>
          <strong>Date of birth:</strong> {profile.date_of_birth}
        </p>
      )}

      {profile.height_cm !== null && (
        <p>
          <strong>Height:</strong> {profile.height_cm} cm
        </p>
      )}

      {profile.ckd_etiology && (
        <p>
          <strong>CKD etiology:</strong>{" "}
          {profile.ckd_etiology}
        </p>
      )}

      {profile.diagnosis_date && (
        <p>
          <strong>Diagnosis date:</strong>{" "}
          {profile.diagnosis_date}
        </p>
      )}

      {profile.baseline_egfr !== null && (
        <p>
          <strong>Baseline eGFR:</strong>{" "}
          {profile.baseline_egfr}
        </p>
      )}

      <p>
        <strong>Dialysis status:</strong>{" "}
        {profile.dialysis_status}
      </p>

      {profile.dialysis_modality && (
        <p>
          <strong>Dialysis modality:</strong>{" "}
          {profile.dialysis_modality}
        </p>
      )}

      {profile.allergies && (
        <p>
          <strong>Allergies:</strong> {profile.allergies}
        </p>
      )}

      <p>Your lab result trends will appear here.</p>
    </div>
  );
}
