import type { PatientProfile } from "../../../api/types/patient";
import {
  ETIOLOGY_LABELS,
  DIALYSIS_STATUS_LABELS,
  DIALYSIS_MODALITY_LABELS,
  PREVIOUS_CONDITIONS,
  GENETIC_RISK_FACTORS,
  COMORBIDITIES,
  CURRENT_MEDICATIONS,
} from "../../../constants";
import { formatLongDate } from "../../../utils/date";
import { formatCodedList } from "../../../utils/patient";
import "./ProfileCard.css";

interface ProfileCardProps {
  profile: PatientProfile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const items: { label: string; value: string | null }[] = [
    {
      label: "Датум на раѓање",
      value: profile.date_of_birth ? formatLongDate(profile.date_of_birth) : null,
    },
    {
      label: "Висина",
      value: profile.height_cm !== null ? `${Number(profile.height_cm)} cm` : null,
    },
    {
      label: "Причина за ХБИ",
      value: profile.ckd_etiology ? ETIOLOGY_LABELS[profile.ckd_etiology] : null,
    },
    {
      label: "Датум на дијагноза",
      value: profile.diagnosis_date ? formatLongDate(profile.diagnosis_date) : null,
    },
    {
      label: "Почетна eGFR",
      value: profile.baseline_egfr !== null ? String(Number(profile.baseline_egfr)) : null,
    },
    { label: "Дијализа", value: DIALYSIS_STATUS_LABELS[profile.dialysis_status] ?? null },
    {
      label: "Вид на дијализа",
      value: profile.dialysis_modality ? DIALYSIS_MODALITY_LABELS[profile.dialysis_modality] : null,
    },
    {
      label: "Пушење",
      value: profile.smoking === null ? null : profile.smoking ? "Да" : "Не",
    },
    {
      label: "Претходни заболувања",
      value: formatCodedList(profile.previous_conditions, PREVIOUS_CONDITIONS),
    },
    {
      label: "Генетски ризик фактори",
      value: formatCodedList(profile.genetic_risk_factors, GENETIC_RISK_FACTORS),
    },
    {
      label: "Придружни болести",
      value: formatCodedList(profile.comorbidities, COMORBIDITIES),
    },
    {
      label: "Тековни лекови",
      value: formatCodedList(profile.current_medications, CURRENT_MEDICATIONS),
    },
  ];

  const initials = profile.full_name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <section className="ph-card">
      <div className="ph-profile-head">
        <div className="ph-avatar" aria-hidden="true">
          {initials}
        </div>
        <div>
          <h3 className="ph-card-title ph-profile-name">{profile.full_name}</h3>
          <span className="ph-muted">Мој профил</span>
        </div>
      </div>

      <dl className="ph-profile-list">
        {items
          .filter((item) => item.value)
          .map((item) => (
            <div key={item.label} className="ph-profile-item">
              <dt className="ph-profile-label">{item.label}</dt>
              <dd className="ph-profile-value">{item.value}</dd>
            </div>
          ))}
      </dl>
    </section>
  );
}