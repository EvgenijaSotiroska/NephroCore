import type { AppointmentStatus } from "../api/types/appointment";

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Закажан",
  completed: "Завршен",
  cancelled: "Откажан",
  no_show: "Не се појавил",
};


export const APPOINTMENT_STATUS_OPTIONS = (
  Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[]
).map((value) => ({ value, label: APPOINTMENT_STATUS_LABELS[value] }));

export const APPOINTMENT_TYPES = [
  "Контрола",
  "Преглед",
  "Консултација",
  "Лабораториска контрола",
  "Друго",
];

export const APPOINTMENT_DURATIONS = [15, 30, 45, 60, 90, 120];