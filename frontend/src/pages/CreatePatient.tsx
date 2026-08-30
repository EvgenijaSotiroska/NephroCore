import { useState, type ChangeEvent, type FormEvent } from "react";
import { usePatients } from "../hooks/usePatients";
import type { CreatePatientRequest, CreatePatientResponse } from "../api/types/patient";

const initialForm: CreatePatientRequest = {
  full_name: "",
  date_of_birth: "",
  previous_conditions: "",
  allergies: "",
  smoking: false,
  alcohol: false,
};

export default function CreatePatient() {
  const [form, setForm] = useState<CreatePatientRequest>(initialForm);
  const [result, setResult] = useState<CreatePatientResponse | null>(null);
  const { createPatient, creating, patients, loading } = usePatients();

  function update<K extends keyof CreatePatientRequest>(field: K) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const data = await createPatient({
      ...form,
      date_of_birth: form.date_of_birth || null,
    });
    if (data) {
      setResult(data);
      setForm(initialForm);
    }
    // createPatient() already shows a snackbar on failure — nothing else to do here.
  }

  return (
    <div>
      <h2>New patient</h2>

      {result && (
        <div style={{ background: "#eef", padding: "1rem", marginBottom: "1rem" }}>
          <p>
            Profile created for <strong>{result.full_name}</strong>.
          </p>
          <p>
            Invite code (share with the patient, expires{" "}
            {new Date(result.invite_code_expires_at).toLocaleDateString()}):
          </p>
          <code style={{ fontSize: "1.2rem" }}>{result.invite_code}</code>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input placeholder="Full name" value={form.full_name} onChange={update("full_name")} required />
        <input type="date" value={form.date_of_birth ?? ""} onChange={update("date_of_birth")} />
        <textarea
          placeholder="Previous conditions"
          value={form.previous_conditions ?? ""}
          onChange={update("previous_conditions")}
        />
        <textarea placeholder="Allergies" value={form.allergies ?? ""} onChange={update("allergies")} />
        <label>
          <input type="checkbox" checked={!!form.smoking} onChange={update("smoking")} /> Smoking
        </label>
        <label>
          <input type="checkbox" checked={!!form.alcohol} onChange={update("alcohol")} /> Alcohol
        </label>
        <button type="submit" disabled={creating}>
          {creating ? "Creating…" : "Create patient & generate invite code"}
        </button>
      </form>

      <h3>Your patients</h3>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {patients.map((p) => (
            <li key={p.id}>
              {p.full_name} {p.is_activated ? "" : "(not activated yet)"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}