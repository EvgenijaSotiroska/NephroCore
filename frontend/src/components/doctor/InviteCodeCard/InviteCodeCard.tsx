import type { CreatePatientResponse } from "../../../api/types/patient.ts";
import { formatLongDate } from "../../../utils/date.ts";
import "./InviteCodeCard.css";

export default function InviteCodeCard({ result }: { result: CreatePatientResponse }) {
  return (
    <div className="patient-success">
      <p>
        Профилот за <strong>{result.full_name}</strong> е успешно креиран.
      </p>

      <p>
        Код за покана (споделете го со пациентот, истекува на{" "}
        {formatLongDate(result.invite_code_expires_at)}):
      </p>

      <code>{result.invite_code}</code>
    </div>
  );
}
