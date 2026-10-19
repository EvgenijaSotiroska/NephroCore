import { useMemo, useState } from "react";
import { MK_MONTHS, MK_WEEKDAYS_SHORT_MON_FIRST } from "../../../constants";
import { toDateKey } from "../../../utils/date";
import "./AppointmentCalendar.css";

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

interface AppointmentCalendarProps {
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  appointmentCountByDate: Map<string, number>;
}

export default function AppointmentCalendar({
  selectedDate,
  onSelectDate,
  appointmentCountByDate,
}: AppointmentCalendarProps) {
  const today = useMemo(() => getToday(), []);

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  );

  const goToPreviousMonth = () => {
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(toDateKey(today));
  };

  const isSameDate = (first: Date, second: Date): boolean => {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  };

  const isCurrentMonth = (date: Date): boolean => {
    return (
      date.getFullYear() === currentMonth.getFullYear() &&
      date.getMonth() === currentMonth.getMonth()
    );
  };

  return (
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
                          onSelectDate(dateKey)
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
  );
}
