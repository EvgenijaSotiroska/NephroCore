import { usePatientProfile } from "../hooks/usePatientProfile";

export default function PatientHome() {
  const { profile, loading, error } = usePatientProfile();

  if (loading) return <p>Loading your profile…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!profile) return null;

  return (
    <div>
      <h2>Welcome, {profile.full_name}</h2>
      {profile.allergies && (
        <p>
          <strong>Allergies:</strong> {profile.allergies}
        </p>
      )}
      <p>Your lab result trends will appear here.</p>
    </div>
  );
}
