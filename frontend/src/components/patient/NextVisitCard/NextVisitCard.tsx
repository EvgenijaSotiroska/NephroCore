import type { AppointmentResponse } from "../../../api/types/appointment";
import { daysUntil, formatShortMonth, formatTime, formatWeekday } from "../../../utils/date";
import "./NextVisitCard.css";

interface NextVisitCardProps {
  appointment: AppointmentResponse | null;
}

export default function NextVisitCard({ appointment }: NextVisitCardProps) {
  if (!appointment) {
    return (
      <section className="ph-card">
        <h3 className="ph-card-title">Следен преглед</h3>
        <div className="ph-empty">
          <span className="ph-empty-icon" aria-hidden="true">
            📅
          </span>
          Нема закажан преглед. Вашиот лекар ќе закаже следен термин.
        </div>
      </section>
    );
  }

  const when = new Date(appointment.scheduled_at);
  const days = daysUntil(appointment.scheduled_at);
  const countdown = days <= 0 ? "Денес" : days === 1 ? "Утре" : `За ${days} дена`;

  return (
    <section className="ph-card ph-card-accent">
      <h3 className="ph-card-title">Следен преглед</h3>
      <div className="ph-next">
        <div className="ph-next-date" aria-hidden="true">
          <span className="ph-next-day">{when.getDate()}</span>
          <span className="ph-next-month">{formatShortMonth(appointment.scheduled_at)}</span>
        </div>
        <div className="ph-next-info">
          <span className="ph-next-countdown">{countdown}</span>
          <span className="ph-next-time">
            {formatWeekday(appointment.scheduled_at)}, {formatTime(appointment.scheduled_at)}
          </span>
          {appointment.appointment_type && (
            <span className="ph-next-type">{appointment.appointment_type}</span>
          )}
          <span className="ph-next-type">Времетраење: {appointment.duration_minutes} мин</span>
        </div>
      </div>
    </section>
  );
}