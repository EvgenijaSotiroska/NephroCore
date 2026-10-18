import { useMemo } from "react";
import type { PatientProfile } from "../../../api/types/patient";
import { CKD_STAGE_ORDER } from "../../../api/types/ckdStage";
import { STAGE_EGFR_RANGE_LABEL } from "../../../constants";
import { stageFromEgfr, stageTone } from "../../../utils/patient";
import "./StageDistributionCard.css";

interface StageDistributionCardProps {
  patients: PatientProfile[];
}

export default function StageDistributionCard({ patients }: StageDistributionCardProps) {
  const counts = useMemo(() => {
    const result = Object.fromEntries(CKD_STAGE_ORDER.map((stage) => [stage, 0])) as Record<
      (typeof CKD_STAGE_ORDER)[number],
      number
    >;
    patients.forEach((patient) => {
      const stage = stageFromEgfr(patient.baseline_egfr);
      if (stage) result[stage] += 1;
    });
    return result;
  }, [patients]);

  const max = Math.max(1, ...Object.values(counts));

  return (
    <section className="dh-card">
      <div className="dh-card-head">
        <div>
          <span className="dh-eyebrow">Преглед</span>
          <h2 className="dh-card-title">Распределба по стадиум</h2>
        </div>
      </div>

      <ul className="dh-dist">
        {CKD_STAGE_ORDER.map((stage) => (
          <li key={stage} className="dh-dist-row">
            <span className={`dh-dist-stage dh-stage-${stageTone(stage)}`}>{stage}</span>

            <span className="dh-dist-bar-wrap">
              <span
                className={`dh-dist-bar dh-dist-bar-${stageTone(stage)}`}
                style={{ width: `${(counts[stage] / max) * 100}%` }}
              />
            </span>

            <span className="dh-dist-count">{counts[stage]}</span>
            <span className="dh-dist-range">eGFR {STAGE_EGFR_RANGE_LABEL[stage]}</span>
          </li>
        ))}
      </ul>

      <p className="dh-dist-note">Според почетниот eGFR на пациентите.</p>
    </section>
  );
}