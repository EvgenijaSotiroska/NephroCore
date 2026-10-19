import type { PatientProfile } from "../../../api/types/patient";
import type { AppointmentResponse } from "../../../api/types/appointment";
import { APPOINTMENT_STATUS_LABELS } from "../../../constants";
import { formatTime, formatWeekdayDayMonth } from "../../../utils/date";
import "./DayAppointments.css";

function getPatientName(
  patients: PatientProfile[],
  patientId: string
): string {
  return (
    patients.find(
      (patient) => patient.id === patientId
    )?.full_name ?? "Непознат пациент"
  );
}

interface DayAppointmentsProps {
  selectedDate: string;
  appointments: AppointmentResponse[];
  patients: PatientProfile[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (appointment: AppointmentResponse) => void;
}

export default function DayAppointments({
  selectedDate,
  appointments,
  patients,
  loading,
  onCreate,
  onEdit,
}: DayAppointmentsProps) {
  return (
    <div className="appointments-card">
                <div className="appointments-card__header">
                  <div>
                    <span className="appointments-card__label">
                      ДЕНЕШНИ ТЕРМИНИ
                    </span>

                    <h2>
                      {formatWeekdayDayMonth(
                        selectedDate
                      )}
                    </h2>
                  </div>

                  <span className="appointments-card__count">
                    {appointments.length}
                  </span>
                </div>

                {loading ? (
                  <div className="appointments-card__empty">
                    <div className="spinner" />

                    <h3>
                      Се вчитуваат термините...
                    </h3>
                  </div>
                ) : appointments.length ===
                  0 ? (
                  <div className="appointments-card__empty">
                    <div className="empty-icon">
                      +
                    </div>

                    <h3>
                      Нема закажани термини
                    </h3>

                    <p>
                      За овој ден нема внесено
                      закажани термини.
                    </p>

                    <button
                      type="button"
                      className="appointments-card__empty-button"
                      onClick={onCreate}
                    >
                      Закажи термин
                    </button>
                  </div>
                ) : (
                  <div className="appointments-list">
                    {appointments.map(
                      (appointment) => (
                        <div
                          key={appointment.id}
                          className="appointment-item"
                        >
                          <div className="appointment-item__time">
                            {formatTime(
                              appointment.scheduled_at
                            )}
                          </div>

                          <div className="appointment-item__line" />

                          <div className="appointment-item__content">
                            <div className="appointment-item__top">
                              <h3>
                                {getPatientName(
                                  patients,
                                  appointment.patient_id
                                )}
                              </h3>

                              <span
                                className={`appointment-status appointment-status--${appointment.status}`}
                              >
                                {APPOINTMENT_STATUS_LABELS[
                                  appointment.status
                                ]}
                              </span>
                            </div>

                            {appointment.appointment_type && (
                              <p className="appointment-item__type">
                                {appointment.appointment_type}
                              </p>
                            )}

                            <div className="appointment-item__details">
                              <span>
                                {appointment.duration_minutes}{" "}
                                мин.
                              </span>

                              {appointment.notes && (
                                <span>
                                  Има забелешка
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              className="appointment-item__edit"
                              onClick={() =>
                                onEdit(appointment)
                              }
                            >
                              Уреди
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
  );
}
