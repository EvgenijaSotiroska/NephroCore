import { useAppointments } from "../../../hooks/useAppointments";
import { usePatients } from "../../../hooks/usePatients";
import { useSymptoms } from "../../../hooks/useSymptoms";
import { formatTime, formatTodayLong, toDateKey, todayIso } from "../../../utils/date";
import PatientsRegisterCard from "../../../components/doctor/PatientsRegisterCard/PatientsRegisterCard";
import RecentSymptomsCard from "../../../components/doctor/RecentSymptomsCard/RecentSymptomsCard";
import StageDistributionCard from "../../../components/doctor/StageDistributionCard/StageDistributionCard";
import TodayScheduleCard from "../../../components/doctor/TodayScheduleCard/TodayScheduleCard";
import "./DoctorHomePage.css";
import { useDoctorProfile } from "../../../hooks/useDoctorProfile";

const DAY_MS = 24 * 60 * 60 * 1000;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Добро утро";
  if (hour < 18) return "Добар ден";
  return "Добра вечер";
}

interface StatTileProps {
  label: string;
  value: number;
  hint: string;
  icon: string;
  tone: "teal" | "blue" | "purple" | "red";
}

function StatTile({ label, value, hint, icon, tone }: StatTileProps) {
  return (
    <div className="dh-stat">
      <div className="dh-stat-top">
        <span className="dh-stat-label">{label}</span>
        <span className={`dh-stat-icon dh-stat-icon-${tone}`} aria-hidden="true">
          {icon}
        </span>
      </div>
      <span className={`dh-stat-value dh-stat-value-${tone}`}>{value}</span>
      <span className="dh-stat-hint">{hint}</span>
    </div>
  );
}

export default function DoctorHomePage() {
  const { patients, loading: patientsLoading, error: patientsError } = usePatients();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { symptoms, loading: symptomsLoading } = useSymptoms();
  const { profile: doctor } = useDoctorProfile();

  if (patientsLoading || appointmentsLoading) {
    return (
      <div className="dh-page">
        <div className="dh-container">
          <div className="dh-state">Се вчитува контролната табла…</div>
        </div>
      </div>
    );
  }

  if (patientsError) {
    return (
      <div className="dh-page">
        <div className="dh-container">
          <div className="dh-state dh-state-error">{patientsError}</div>
        </div>
      </div>
    );
  }

  const now = Date.now();
  const today = todayIso();

  const todaysAppointments = appointments
    .filter((a) => toDateKey(a.scheduled_at) === today && a.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const upcoming = appointments.filter(
    (a) => a.status === "scheduled" && new Date(a.scheduled_at).getTime() >= now
  );

  const nextToday = todaysAppointments.find(
    (a) => a.status === "scheduled" && new Date(a.scheduled_at).getTime() >= now
  );

  const upcomingThisWeek = upcoming.filter(
    (a) => new Date(a.scheduled_at).getTime() <= now + 7 * DAY_MS
  ).length;

  const newSymptoms = symptoms.filter((s) => new Date(s.created_at).getTime() >= now - 7 * DAY_MS);
  const severeSymptoms = newSymptoms.filter((s) => s.intensity === "large").length;

  // Inactive patients stay in the register but are not counted as current patients.
  const activePatients = patients.filter((p) => p.is_active);
  const activated = activePatients.filter((p) => p.is_activated).length;

  return (
    <div className="dh-page">
      {/* ============ Hero (full width) ============ */}
      <header className="dh-hero">
        <div className="dh-hero-overlay" />
        <div className="dh-hero-inner">
          <div className="dh-hero-text">
            <span className="dh-hero-badge">{formatTodayLong()}</span>
                        <h1 className="dh-hero-title">
              <span className="dh-hero-name">
                {greeting()}
                {doctor && `, д-р ${doctor.first_name}`}
              </span>
            </h1>
            <p className="dh-hero-subtitle">
              Имате {todaysAppointments.length}{" "}
              {todaysAppointments.length === 1 ? "контрола" : "контроли"} денес и{" "}
              {newSymptoms.length} {newSymptoms.length === 1 ? "нов симптом" : "нови симптоми"} од
              пациентите.
            </p>
          </div>
        </div>
      </header>

      <div className="dh-container">
        {/* ============ Stat row ============ */}
        <div className="dh-stats">
          <StatTile
            label="Активни пациенти"
            value={activePatients.length}
            hint={`${activated} со активиран профил`}
            icon="👥"
            tone="teal"
          />
          <StatTile
            label="Контроли денес"
            value={todaysAppointments.length}
            hint={nextToday ? `Следна во ${formatTime(nextToday.scheduled_at)}` : "Нема повеќе за денес"}
            icon="📅"
            tone="blue"
          />
          <StatTile
            label="Термини наскоро"
            value={upcomingThisWeek}
            hint="во следните 7 дена"
            icon="🗓️"
            tone="purple"
          />
          <StatTile
            label="Нови симптоми"
            value={newSymptoms.length}
            hint={severeSymptoms > 0 ? `${severeSymptoms} со силен интензитет` : "во последните 7 дена"}
            icon="🩺"
            tone="red"
          />
        </div>

        {/* ============ Main grid ============ */}
        <div className="dh-grid">
          <div className="dh-col">
            <RecentSymptomsCard symptoms={symptoms} patients={patients} loading={symptomsLoading} />
            <PatientsRegisterCard patients={patients} appointments={appointments} />
          </div>

          <aside className="dh-col">
            <TodayScheduleCard appointments={todaysAppointments} patients={patients} />
            <StageDistributionCard patients={activePatients} />
          </aside>
        </div>
      </div>
    </div>
  );
}