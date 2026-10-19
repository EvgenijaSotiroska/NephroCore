import {useState} from "react";
import {usePatientProfile} from "../../../hooks/usePatientProfile";
import {useTrends} from "../../../hooks/useTrends";
import {useVisits} from "../../../hooks/useVisits";
import {useAppointments} from "../../../hooks/useAppointments";
import {useNextAppointment} from "../../../hooks/useNextAppointment";
import {useExplainResults} from "../../../hooks/useAi";
import {
    ETIOLOGY_LABELS,
    STAGE_EGFR_RANGE_LABEL,
    STAGE_DESCRIPTION,
} from "../../../constants";
import {formatLongDate} from "../../../utils/date";
import {calculateAge, stageTone} from "../../../utils/patient";
import ProfileCard from "../../../components/patient/ProfileCard/ProfileCard";
import MedicationsCard from "../../../components/patient/MedicationsCard/MedicationsCard";
import NextVisitCard from "../../../components/patient/NextVisitCard/NextVisitCard";
import SymptomsCard from "../../../components/patient/SymptomsCard/SymptomsCard";
import "./PatientHomePage.css";
import AiAnalysisModal from "../../../components/ai/AiAnalysisModal/AiAnalysisModal";
import ChatPanel from "../../../components/patient/ChatPanel/ChatPanel";
import VisitCard from "../../../components/patient/VisitCard/VisitCard";
import StatCard from "../../../components/patient/StatCard/StatCard";

// ==================== Helpers ====================

function firstName(fullName: string): string {
    return fullName.trim().split(/\s+/)[0] ?? fullName;
}

// ==================== Page ====================

export default function PatientHomePage() {
    const {profile, loading: profileLoading, error: profileError} = usePatientProfile();
    const patientId = profile?.id;

    const {data, loading: trendsLoading, error: trendsError, refetch} = useTrends(patientId);
    const {visits, loading: visitsLoading, error: visitsError, refresh} = useVisits(patientId);
    const {appointment: nextAppointment} = useNextAppointment();
    const {appointments, loading: appointmentsLoading} = useAppointments();
    const {
        history: explanations,
        loading: explainLoading,
        historyLoading: explainHistoryLoading,
        error: explainError,
        generate: generateExplanation,
        loadHistory: loadExplanations
    } = useExplainResults(patientId);
    const [explainOpen, setExplainOpen] = useState(false);

    if (profileLoading || (patientId && (trendsLoading || visitsLoading))) {
        return (
            <div className="ph-page">
                <div className="ph-state">Се вчитуваат вашите податоци…</div>
            </div>
        );
    }

    if (profileError || !profile) {
        return (
            <div className="ph-page">
                <div className="ph-state ph-state-error">
                    <p>{profileError ?? "Не успеа да се вчита вашиот профил."}</p>
                </div>
            </div>
        );
    }

    if (trendsError || visitsError) {
        return (
            <div className="ph-page">
                <div className="ph-state ph-state-error">
                    <p>Не успеаа да се вчитаат вашите резултати.</p>
                    <button
                        type="button"
                        className="ph-retry"
                        onClick={() => {
                            void refetch();
                            void refresh();
                        }}
                    >
                        Обиди се повторно
                    </button>
                </div>
            </div>
        );
    }

    const parameters = data?.parameters ?? [];
    const stage = data?.current_ckd_stage ?? null;
    const age = calculateAge(profile.date_of_birth);

    const sortedVisits = [...visits].sort(
        (a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
    );
    const latestVisit = sortedVisits[0] ?? null;

    const eyebrow = [age !== null ? `${age} год.` : null, profile.ckd_etiology ? ETIOLOGY_LABELS[profile.ckd_etiology] : null]
        .filter(Boolean)
        .join(" · ");

    return (
        <div className="ph-page">
            {/* ============ Hero (full width) ============ */}
            <header className="ph-hero">
                <div className="ph-hero-overlay"/>
                <div className="ph-hero-inner">
                    <div className="ph-hero-text">
                        {eyebrow && <span className="ph-hero-badge">{eyebrow}</span>}
                        <h1 className="ph-hero-title">
                            Здраво, <span className="ph-hero-name">{firstName(profile.full_name)}</span>
                        </h1>
                        <p className="ph-hero-subtitle">
                            {latestVisit
                                ? `Последен преглед: ${formatLongDate(latestVisit.visit_date)}`
                                : "Вашите резултати ќе се појават овде по првиот преглед."}
                        </p>
                    </div>

                    {stage && (
                        <div className={`ph-stage-block ph-stage-${stageTone(stage)}`}>
                            <span className="ph-stage-block-code">{stage}</span>
                            <span className="ph-stage-block-range">eGFR {STAGE_EGFR_RANGE_LABEL[stage] ?? ""}</span>
                            <span className="ph-stage-block-desc">{STAGE_DESCRIPTION[stage]}</span>
                        </div>
                    )}
                </div>
            </header>

            <div className="ph-container">
                {/* ============ Stat row ============ */}
                <div className="ph-stats">
                    <StatCard
                        label="Фаза на ХБИ"
                        value={stage ?? "—"}
                        hint={stage ? `eGFR ${STAGE_EGFR_RANGE_LABEL[stage] ?? ""}` : undefined}
                        tone={stage ? stageTone(stage) : undefined}
                    />
                    <StatCard
                        label="Последен преглед"
                        value={latestVisit ? formatLongDate(latestVisit.visit_date) : "—"}
                    />
                    <StatCard
                        label="Резултати"
                        value={String(sortedVisits.length)}
                        hint="внесени лабораториски резултати"
                    />
                    <StatCard
                        label="Прегледи"
                        value={appointmentsLoading ? "—" : String(appointments.length)}
                        hint="вкупно термини"
                    />
                </div>

                <div className="ph-dashboard">
                    {/* ============ Left: profile + medications ============ */}
                    <aside className="ph-col-profile">
                        <ProfileCard profile={profile}/>
                        <MedicationsCard/>
                    </aside>

                    {/* ============ Middle: analysis + results ============ */}
                    <div className="ph-main ph-col-main">
                                                {latestVisit && (
                            <section className="ph-card">
                                <div className="ph-card-head">
                                    <h3 className="ph-card-title">AI анализа на резултатите</h3>
                                    <button
                                        type="button"
                                        className="ph-explain-button"
                                        onClick={() => {
                                            setExplainOpen(true);
                                            void loadExplanations();
                                        }}
                                    >
                                        Отвори анализа
                                    </button>
                                </div>

                                <p className="ph-muted">
                                    Добијте едноставно објаснување на вашите најнови резултати и вратете се на претходните.
                                </p>

                                <AiAnalysisModal
                                    isOpen={explainOpen}
                                    title="🤖 AI објаснување на резултатите"
                                    subtitle="Едноставно објаснување на вашите резултати. Не е замена за разговор со лекар."
                                    generateLabel="Генерирај ново објаснување"
                                    items={explanations}
                                    loading={explainLoading}
                                    historyLoading={explainHistoryLoading}
                                    error={explainError}
                                    onGenerate={() => void generateExplanation()}
                                    onClose={() => setExplainOpen(false)}
                                />
                            </section>
                        )}

                        <h3 className="ph-heading">Мои резултати</h3>

                        {sortedVisits.length === 0 ? (
                            <div className="ph-state">
                                Сè уште нема евидентирани резултати. Тие ќе се прикажат откако лекарот ќе ги внесе.
                            </div>
                        ) : (
                            <ol className="ph-timeline">
                                {sortedVisits.map((visit, index) => (
                                    <VisitCard
                                        key={visit.id}
                                        visit={visit}
                                        previous={sortedVisits[index + 1] ?? null}
                                        parameters={parameters}
                                        isLatest={index === 0}
                                    />
                                ))}
                            </ol>
                        )}
                    </div>

                    {/* ============ Right: next visit + symptoms ============ */}
                    <aside className="ph-side ph-col-side">
                        <NextVisitCard appointment={nextAppointment}/>
                        <SymptomsCard/>
                    </aside>
                </div>
            </div>
            <ChatPanel patientId={patientId}/>
        </div>
    );
}