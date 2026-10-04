import { useMemo, useState } from "react";
import { useAppointments } from "../../../hooks/useAppointments";
import { usePatients } from "../../../hooks/usePatients";
import type { PatientProfile } from "../../../api/types/patient";
import type { AppointmentResponse } from "../../../api/types/appointment";
import AppointmentModal from "../../../components/appointments/AppointmentModal/AppointmentModal";
import {
  APPOINTMENT_STATUS_LABELS,
  MK_MONTHS,
  MK_WEEKDAYS_SHORT_MON_FIRST,
} from "../../../constants";
import {
  formatTime,
  formatWeekdayDayMonth,
  toDateKey,
} from "../../../utils/date";
import "./AppointmentsPage.css";

function getToday(): Date {
  const today = new Date();

  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
}

function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);

  const mondayFirstOffset =
    (firstDay.getDay() + 6) % 7;

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const previousMonthDays = new Date(
    year,
    month,
    0
  ).getDate();

  const days: Date[] = [];

  for (let i = mondayFirstOffset - 1; i >= 0; i--) {
    days.push(
      new Date(
        year,
        month - 1,
        previousMonthDays - i
      )
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  let nextDay = 1;

  while (days.length < 42) {
    days.push(
      new Date(year, month + 1, nextDay)
    );

    nextDay++;
  }

  return days;
}

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

export default function AppointmentsPage() {
  const today = useMemo(() => getToday(), []);

  const [currentMonth, setCurrentMonth] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  );

  const [selectedDate, setSelectedDate] = useState(
    toDateKey(today)
  );

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentResponse | null>(null);

  const {
    appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    creating,
    updating,
    deleting,
  } = useAppointments();

  const {
    patients,
    loading: patientsLoading,
  } = usePatients();

  const calendarDays = useMemo(
    () =>
      getCalendarDays(
        currentMonth.getFullYear(),
        currentMonth.getMonth()
      ),
    [currentMonth]
  );

  const selectedDayAppointments = useMemo(() => {
    return appointments
      .filter(
        (appointment) =>
          toDateKey(
            appointment.scheduled_at
          ) === selectedDate
      )
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime()
      );
  }, [appointments, selectedDate]);

  const appointmentCountByDate = useMemo(() => {
    const counts = new Map<string, number>();

    appointments.forEach((appointment) => {
      const dateKey = toDateKey(
        appointment.scheduled_at
      );

      counts.set(
        dateKey,
        (counts.get(dateKey) ?? 0) + 1
      );
    });

    return counts;
  }, [appointments]);

  const openCreateModal = () => {
    setEditingAppointment(null);
    setIsModalOpen(true);
  };

  const openEditModal = (
    appointment: AppointmentResponse
  ) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeAppointmentModal = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1
        )
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1
        )
    );
  };

  const goToToday = () => {
    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setSelectedDate(toDateKey(today));
  };

  const isSameDate = (
    first: Date,
    second: Date
  ): boolean => {
    return (
      first.getFullYear() ===
        second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  };

  const isCurrentMonth = (
    date: Date
  ): boolean => {
    return (
      date.getFullYear() ===
        currentMonth.getFullYear() &&
      date.getMonth() ===
        currentMonth.getMonth()
    );
  };

  return (
    <main className="doctor-home">
      <div className="doctor-home__container">

        {/* =========================
            HEADER
        ========================= */}

        <header className="doctor-home__header">
          <div>
            <h1>
              Добредојдовте
            </h1>

            <p className="doctor-home__subtitle">
              Прегледајте ги и управувајте со вашите
              закажани термини.
            </p>
          </div>

          <button
            type="button"
            className="doctor-home__primary-button"
            onClick={openCreateModal}
          >
            <span>+</span>
            Закажи термин
          </button>
        </header>

        {/* =========================
            ERROR
        ========================= */}

        {appointmentsError && (
          <div className="doctor-home__error">
            {appointmentsError}
          </div>
        )}

        {/* =========================
            MAIN LAYOUT
        ========================= */}

        <section className="doctor-home__layout">

          {/* =========================
              CALENDAR
          ========================= */}

          <div className="calendar-card">
            <div className="calendar-card__header">
              <div>
                <h2>
                  {MK_MONTHS[currentMonth.getMonth()]}{" "}
                  {currentMonth.getFullYear()}
                </h2>

                <p>
                  Изберете ден за да ги видите
                  термините.
                </p>
              </div>

              <div className="calendar-card__actions">
                <button
                  type="button"
                  className="calendar-card__today"
                  onClick={goToToday}
                >
                  Денес
                </button>

                <button
                  type="button"
                  className="calendar-card__nav"
                  onClick={goToPreviousMonth}
                  aria-label="Претходен месец"
                >
                  ‹
                </button>

                <button
                  type="button"
                  className="calendar-card__nav"
                  onClick={goToNextMonth}
                  aria-label="Следен месец"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="calendar__weekdays">
              {MK_WEEKDAYS_SHORT_MON_FIRST.map((day) => (
                <div
                  key={day}
                  className="calendar__weekday"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar__grid">
              {calendarDays.map((date) => {
                const dateKey = toDateKey(date);

                const appointmentCount =
                  appointmentCountByDate.get(
                    dateKey
                  ) ?? 0;

                const selected =
                  dateKey === selectedDate;

                const currentDay =
                  isSameDate(date, today);

                const outside =
                  !isCurrentMonth(date);

                return (
                  <button
                    key={dateKey}
                    type="button"
                    className={[
                      "calendar__day",
                      outside
                        ? "calendar__day--outside"
                        : "",
                      currentDay
                        ? "calendar__day--today"
                        : "",
                      selected
                        ? "calendar__day--selected"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      setSelectedDate(dateKey)
                    }
                  >
                    <span className="calendar__day-number">
                      {date.getDate()}
                    </span>

                    {appointmentCount > 0 && (
                      <span className="calendar__appointments">
                        <span className="calendar__dot" />

                        {appointmentCount === 1
                          ? "1 термин"
                          : `${appointmentCount} термини`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =========================
              APPOINTMENTS
          ========================= */}

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
                {selectedDayAppointments.length}
              </span>
            </div>

            {appointmentsLoading ||
            patientsLoading ? (
              <div className="appointments-card__empty">
                <div className="spinner" />

                <h3>
                  Се вчитуваат термините...
                </h3>
              </div>
            ) : selectedDayAppointments.length ===
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
                  onClick={openCreateModal}
                >
                  Закажи термин
                </button>
              </div>
            ) : (
              <div className="appointments-list">
                {selectedDayAppointments.map(
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
                            openEditModal(
                              appointment
                            )
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
        </section>

        {/* =========================
            CREATE / EDIT MODAL
        ========================= */}

        <AppointmentModal
          isOpen={isModalOpen}
          mode={
            editingAppointment
              ? "edit"
              : "create"
          }
          patients={patients}
          appointment={editingAppointment}
          creating={creating}
          updating={updating}
          deleting={deleting}
          onClose={closeAppointmentModal}
          onCreate={createAppointment}
          onUpdate={updateAppointment}
          onDelete={deleteAppointment}
        />

      </div>
    </main>
  );
}