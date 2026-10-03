import { useEffect, useMemo, useState } from "react";
import type { PatientProfile } from "../../../api/types/patient";
import type {
  AppointmentResponse,
  AppointmentStatus,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from "../../../api/types/appointment";
import "./AppointmentModal.css";

interface AppointmentModalProps {
  isOpen: boolean;
  mode: "create" | "edit";

  patients: PatientProfile[];
  appointment?: AppointmentResponse | null;

  creating?: boolean;
  updating?: boolean;
  deleting?: boolean;

  onClose: () => void;

  onCreate: (
    payload: CreateAppointmentRequest
  ) => Promise<AppointmentResponse | null>;

  onUpdate: (
    appointmentId: string,
    payload: UpdateAppointmentRequest
  ) => Promise<AppointmentResponse | null>;

  onDelete: (
    appointmentId: string
  ) => Promise<boolean>;
}

const APPOINTMENT_TYPES = [
  "Контрола",
  "Преглед",
  "Консултација",
  "Лабораториска контрола",
  "Друго",
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

const STATUSES: {
  value: AppointmentStatus;
  label: string;
}[] = [
  {
    value: "scheduled",
    label: "Закажан",
  },
  {
    value: "completed",
    label: "Завршен",
  },
  {
    value: "cancelled",
    label: "Откажан",
  },
  {
    value: "no_show",
    label: "Не се појавил",
  },
];

function getTodayDate(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTimeFromAppointment(dateString: string): string {
  const date = new Date(dateString);

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function getDateFromAppointment(dateString: string): string {
  const date = new Date(dateString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createLocalDateTime(
  date: string,
  time: string
): string {
  return `${date}T${time}:00`;
}

function createTimeOptions(): string[] {
  const options: string[] = [];

  for (let hour = 7; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      options.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(
          2,
          "0"
        )}`
      );
    }
  }

  return options;
}

const TIME_OPTIONS = createTimeOptions();

export default function AppointmentModal({
  isOpen,
  mode,
  patients,
  appointment,
  creating = false,
  updating = false,
  deleting = false,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: AppointmentModalProps) {
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [appointmentType, setAppointmentType] =
    useState("Контрола");
  const [status, setStatus] =
    useState<AppointmentStatus>("scheduled");
  const [notes, setNotes] = useState("");

  const isEdit = mode === "edit";

  const selectedPatient = useMemo(
    () =>
      patients.find(
        (patient) => patient.id === patientId
      ),
    [patients, patientId]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === "edit" && appointment) {
      setPatientId(appointment.patient_id);
      setDate(getDateFromAppointment(appointment.scheduled_at));
      setTime(getTimeFromAppointment(appointment.scheduled_at));
      setDuration(appointment.duration_minutes);
      setAppointmentType(
        appointment.appointment_type || "Контрола"
      );
      setStatus(appointment.status);
      setNotes(appointment.notes || "");

      return;
    }

    setPatientId("");
    setDate(getTodayDate());
    setTime("09:00");
    setDuration(30);
    setAppointmentType("Контрола");
    setStatus("scheduled");
    setNotes("");
  }, [isOpen, mode, appointment]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!patientId || !date || !time) {
      return;
    }

    const scheduledAt = createLocalDateTime(date, time);

    if (isEdit && appointment) {
      const payload: UpdateAppointmentRequest = {
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        appointment_type: appointmentType || null,
        status,
        notes: notes.trim() || null,
      };

      const result = await onUpdate(
        appointment.id,
        payload
      );

      if (result) {
        onClose();
      }

      return;
    }

    const payload: CreateAppointmentRequest = {
      patient_id: patientId,
      scheduled_at: scheduledAt,
      duration_minutes: duration,
      appointment_type: appointmentType || null,
      notes: notes.trim() || null,
    };

    const result = await onCreate(payload);

    if (result) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!appointment) {
      return;
    }

    const confirmed = window.confirm(
      "Дали сте сигурни дека сакате да го избришете овој термин?"
    );

    if (!confirmed) {
      return;
    }

    const success = await onDelete(appointment.id);

    if (success) {
      onClose();
    }
  };

  const isSaving = creating || updating;

  return (
    <div
      className="appointment-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="appointment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-modal-title"
      >
        <div className="appointment-modal__header">
          <div>
            <h2 id="appointment-modal-title">
              {isEdit
                ? "Уреди термин"
                : "Закажи термин"}
            </h2>

            <p>
              {isEdit
                ? "Изменете ги информациите за терминот."
                : "Внесете ги информациите за новиот термин."}
            </p>
          </div>

          <button
            type="button"
            className="appointment-modal__close"
            onClick={onClose}
            aria-label="Затвори"
          >
            ×
          </button>
        </div>

        <form
          className="appointment-form"
          onSubmit={handleSubmit}
        >
          <div className="appointment-form__group">
            <label htmlFor="appointment-patient">
              Пациент
            </label>

            <select
              id="appointment-patient"
              value={patientId}
              onChange={(event) =>
                setPatientId(event.target.value)
              }
              required
              disabled={isSaving || deleting}
            >
              <option value="">
                Изберете пациент
              </option>

              {patients.map((patient) => (
                <option
                  key={patient.id}
                  value={patient.id}
                >
                  {patient.full_name}
                </option>
              ))}
            </select>

            {selectedPatient && (
              <span className="appointment-form__hint">
                Избран пациент: {selectedPatient.full_name}
              </span>
            )}
          </div>

          <div className="appointment-form__row">
            <div className="appointment-form__group">
              <label htmlFor="appointment-date">
                Датум
              </label>

              <input
                id="appointment-date"
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                required
                disabled={isSaving || deleting}
              />
            </div>

            <div className="appointment-form__group">
              <label htmlFor="appointment-time">
                Време
              </label>

              <select
                id="appointment-time"
                value={time}
                onChange={(event) =>
                  setTime(event.target.value)
                }
                required
                disabled={isSaving || deleting}
              >
                {TIME_OPTIONS.map((option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="appointment-form__row">
            <div className="appointment-form__group">
              <label htmlFor="appointment-duration">
                Траење
              </label>

              <select
                id="appointment-duration"
                value={duration}
                onChange={(event) =>
                  setDuration(Number(event.target.value))
                }
                disabled={isSaving || deleting}
              >
                {DURATIONS.map((minutes) => (
                  <option
                    key={minutes}
                    value={minutes}
                  >
                    {minutes} минути
                  </option>
                ))}
              </select>
            </div>

            <div className="appointment-form__group">
              <label htmlFor="appointment-type">
                Тип на термин
              </label>

              <select
                id="appointment-type"
                value={appointmentType}
                onChange={(event) =>
                  setAppointmentType(event.target.value)
                }
                disabled={isSaving || deleting}
              >
                {APPOINTMENT_TYPES.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isEdit && (
            <div className="appointment-form__group">
              <label htmlFor="appointment-status">
                Статус
              </label>

              <select
                id="appointment-status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as AppointmentStatus
                  )
                }
                disabled={isSaving || deleting}
              >
                {STATUSES.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="appointment-form__group">
            <label htmlFor="appointment-notes">
              Забелешки
            </label>

            <textarea
              id="appointment-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Дополнителни забелешки..."
              disabled={isSaving || deleting}
            />
          </div>

          <div className="appointment-form__footer">
            {isEdit ? (
              <button
                type="button"
                className="appointment-form__delete"
                onClick={handleDelete}
                disabled={isSaving || deleting}
              >
                {deleting
                  ? "Бришење..."
                  : "Избриши термин"}
              </button>
            ) : (
              <span />
            )}

            <div className="appointment-form__footer-right">
              <button
                type="button"
                className="appointment-form__cancel"
                onClick={onClose}
                disabled={isSaving || deleting}
              >
                Откажи
              </button>

              <button
                type="submit"
                className="appointment-form__submit"
                disabled={
                  isSaving ||
                  deleting ||
                  !patientId ||
                  !date ||
                  !time
                }
              >
                {isSaving
                  ? isEdit
                    ? "Зачувување..."
                    : "Закажување..."
                  : isEdit
                    ? "Зачувај промени"
                    : "Закажи термин"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}