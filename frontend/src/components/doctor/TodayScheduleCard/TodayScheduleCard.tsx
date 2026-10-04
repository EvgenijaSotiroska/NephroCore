import { Link } from "react-router";
import type { AppointmentResponse } from "../../../api/types/appointment";
import type { PatientProfile } from "../../../api/types/patient";
import { APPOINTMENT_STATUS_LABELS } from "../../../constants";
import { formatTime } from "../../../utils/date";
import { getPatientName } from "../../../utils/patient";
import "./TodayScheduleCard.css";

interface TodayScheduleCardProps {
  appointments: AppointmentResponse[]; // today's, sorted by time
  patients: PatientProfile[];
}

export default function TodayScheduleCard({ appointments, patients }: TodayScheduleCardProps) {
  const now = Date.now();
  const nextId = appointments.find(
    (a) => a.status === "scheduled" && new Date(a.scheduled_at).getTime() >= now
  )?.id;

  const count = appointments.length;

  return (
    <section className="dh-card">
      <div className="dh-card-head">
        <div>
          <span className="dh-eyebrow">Денес</span>
          <h2 className="dh-card-title">Распоред</h2>
        </div>
        <Link to="/appointments" className="dh-link">
          {count} {count === 1 ? "термин" : "термини"}
        </Link>
      </div>

      {count === 0 ? (
        <p className="dh-muted">Нема закажани термини за денес.</p>
      ) : (
        <ul className="dh-schedule">
          {appointments.map((appointment) => {
            const isNext = appointment.id === nextId;
            return (
              <li
                key={appointment.id}
                className={`dh-schedule-item ${isNext ? "dh-schedule-item-next" : ""}`}
              >
                <span className="dh-schedule-time">{formatTime(appointment.scheduled_at)}</span>

                <div className="dh-schedule-body">
                  <span className="dh-schedule-name">
                    {getPatientName(patients, appointment.patient_id)}
                  </span>
                  <span className="dh-schedule-meta">
                    {appointment.appointment_type ?? "Преглед"} · {appointment.duration_minutes} мин
                  </span>
                </div>

                <span
                  className={`dh-schedule-status dh-schedule-status-${
                    isNext ? "next" : appointment.status
                  }`}
                >
                  {isNext ? "Следно" : APPOINTMENT_STATUS_LABELS[appointment.status]}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}