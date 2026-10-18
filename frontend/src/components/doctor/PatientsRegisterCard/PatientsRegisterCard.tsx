import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { AppointmentResponse } from "../../../api/types/appointment";
import { CKD_STAGE_ORDER, type CKDStage } from "../../../api/types/ckdStage";
import type { PatientProfile } from "../../../api/types/patient";
import { ETIOLOGY_LABELS } from "../../../constants";
import { daysUntil, formatDayMonth, formatTime } from "../../../utils/date";
import { calculateAge, getInitials, stageFromEgfr, stageTone } from "../../../utils/patient";
import "./PatientsRegisterCard.css";

interface PatientsRegisterCardProps {
  patients: PatientProfile[];
  appointments: AppointmentResponse[];
}

function formatNextVisit(iso: string | undefined): string {
  if (!iso) return "—";
  return daysUntil(iso) <= 0 ? `Денес, ${formatTime(iso)}` : formatDayMonth(iso);
}

export default function PatientsRegisterCard({ patients, appointments }: PatientsRegisterCardProps) {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<CKDStage | "all">("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

  // Earliest upcoming scheduled appointment per patient.
  const nextVisitByPatient = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, string>();

    [...appointments]
      .filter((a) => a.status === "scheduled" && new Date(a.scheduled_at).getTime() >= now)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .forEach((a) => {
        if (!map.has(a.patient_id)) map.set(a.patient_id, a.scheduled_at);
      });

    return map;
  }, [appointments]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return patients
      .filter(
        (patient) =>
          (stage === "all" || stageFromEgfr(patient.baseline_egfr) === stage) &&
          (status === "all" || patient.is_active === (status === "active")) &&
          (query === "" || patient.full_name.toLowerCase().includes(query))
      )
      .sort((a, b) => Number(b.is_active) - Number(a.is_active)); // active patients first
  }, [patients, search, stage, status]);

  return (
    <section className="dh-card">
           <div className="dh-card-head">
        <div>
          <span className="dh-eyebrow">Регистар</span>
          <h2 className="dh-card-title">Мои пациенти</h2>
        </div>

        <div className="dh-register-actions">
          <span className="dh-muted">
            {filtered.length} од {patients.length}
          </span>

          <Link to="/createPatientProfile" className="dh-add-button">
            + Нов пациент
          </Link>
        </div>
      </div>

      <div className="dh-filters">
        <input
          type="search"
          className="dh-search"
          placeholder="Пребарај пациент…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="dh-select"
          value={stage}
          onChange={(e) => setStage(e.target.value as CKDStage | "all")}
        >
          <option value="all">Сите стадиуми</option>
          {CKD_STAGE_ORDER.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="dh-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | "active" | "inactive")}
        >
          <option value="all">Сите пациенти</option>
          <option value="active">Активни</option>
          <option value="inactive">Неактивни</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="dh-muted">Нема пациенти што одговараат на пребарувањето.</p>
      ) : (
        <div className="dh-table">
          <div className="dh-table-row dh-table-head">
            <span>Пациент</span>
            <span>Почетен стадиум</span>
            <span>Почетен eGFR</span>
            <span>Причина</span>
            <span>Следна посета</span>
          </div>

          {filtered.map((patient) => {
            const age = calculateAge(patient.date_of_birth);
            const patientStage = stageFromEgfr(patient.baseline_egfr);

            return (
              <Link
                key={patient.id}
                to={`/patients/${patient.id}/trends`}
                className={`dh-table-row dh-table-link ${patient.is_active ? "" : "dh-table-row-inactive"}`}
              >
                <span className="dh-patient-cell">
                  <span className="dh-avatar">{getInitials(patient.full_name)}</span>
                  <span className="dh-patient-text">
                    <span className="dh-patient-name">{patient.full_name}</span>
                    <span className="dh-patient-sub">
                      {age !== null ? `${age} год.` : "—"}
                      {!patient.is_active && " · неактивен"}
                      {patient.is_active && !patient.is_activated && " · не е активиран"}
                    </span>
                  </span>
                </span>

                <span>
                  {patientStage ? (
                    <span className={`dh-stage dh-stage-${stageTone(patientStage)}`}>{patientStage}</span>
                  ) : (
                    "—"
                  )}
                </span>

                <span className="dh-egfr">
                  {patient.baseline_egfr !== null ? Math.round(Number(patient.baseline_egfr)) : "—"}
                </span>

                <span className="dh-muted-cell">
                  {patient.ckd_etiology ? ETIOLOGY_LABELS[patient.ckd_etiology] : "—"}
                </span>

                <span className="dh-muted-cell">
                  {formatNextVisit(nextVisitByPatient.get(patient.id))}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}