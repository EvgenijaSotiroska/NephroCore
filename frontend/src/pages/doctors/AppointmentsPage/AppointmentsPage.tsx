import { useMemo, useState } from "react";
import { useAppointments } from "../../../hooks/useAppointments";
import { usePatients } from "../../../hooks/usePatients";
import type { AppointmentResponse } from "../../../api/types/appointment";
import AppointmentModal from "../../../components/doctor/AppointmentModal/AppointmentModal";
import AppointmentCalendar from "../../../components/doctor/AppointmentCalendar/AppointmentCalendar";
import DayAppointments from "../../../components/doctor/DayAppointments/DayAppointments";
import { toDateKey, todayIso } from "../../../utils/date";
import "./AppointmentsPage.css";

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(todayIso());

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

          <AppointmentCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            appointmentCountByDate={appointmentCountByDate}
          />

          {/* =========================
              APPOINTMENTS
          ========================= */}

          <DayAppointments
            selectedDate={selectedDate}
            appointments={selectedDayAppointments}
            patients={patients}
            loading={appointmentsLoading || patientsLoading}
            onCreate={openCreateModal}
            onEdit={openEditModal}
          />
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