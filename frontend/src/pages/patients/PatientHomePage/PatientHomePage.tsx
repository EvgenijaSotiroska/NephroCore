import {useState} from "react";
import {usePatientProfile} from "../../../hooks/usePatientProfile";
import {useTrends} from "../../../hooks/useTrends";
import {useVisits} from "../../../hooks/useVisits";
import {useAppointments} from "../../../hooks/useAppointments";
import {useNextAppointment} from "../../../hooks/useNextAppointment";
import {useExplainResults} from "../../../hooks/useAi";
import type {ParameterTrend} from "../../../api/types/trends";
import type {VisitResponse} from "../../../api/types/result";
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

// ==================== Helpers ====================

function firstName(fullName: string): string {
    return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function getValue(visit: VisitResponse, key: string): number | null {
    const v = visit.lab_result?.[key] as number | null | undefined;
    return v === null || v === undefined ? null : v;
}

type Status = "ok" | "low" | "high" | "none";

const STATUS_LABEL: Record<Status, string> = {
    ok: "Во норма",
    low: "Ниско",
    high: "Високо",
    none: "",
};

function getStatus(value: number, p: ParameterTrend): Status {
    const lo = p.normal_range_low;
    const hi = p.normal_range_high;
    if (lo === null && hi === null) return "none";
    if (lo !== null && value < lo) return "low";
    if (hi !== null && value > hi) return "high";
    return "ok";
}

// The normal band is drawn in the middle of the bar, with equal space on both sides.
const BAR_PAD = 0.6;
const BAND_LEFT = (BAR_PAD / (1 + 2 * BAR_PAD)) * 100;
const BAND_WIDTH = (1 / (1 + 2 * BAR_PAD)) * 100;

function dotPosition(value: number, lo: number, hi: number): number {
    const span = hi - lo;
    const min = lo - span * BAR_PAD;
    const max = hi + span * BAR_PAD;
    return Math.min(1, Math.max(0, (value - min) / (max - min))) * 100;
}

// ==================== Result tile ====================

interface ResultTileProps {
    param: ParameterTrend;
    value: number;
    previous: number | null;
}

function ResultTile({param, value, previous}: ResultTileProps) {
    const status = getStatus(value, param);
    const flagged = status === "low" || status === "high";

    const lo = param.normal_range_low;
    const hi = param.normal_range_high;
    const showBar = lo !== null && hi !== null && hi > lo;

    let delta: { text: string; tone: "good" | "warn" | "neutral" } | null = null;
    if (previous !== null) {
        const diff = value - previous;
        const threshold = 0.5 * Math.pow(10, -param.decimals);
        if (Math.abs(diff) < threshold) {
            delta = {text: "без промена", tone: "neutral"};
        } else {
            const improving = param.higher_is_worse ? diff < 0 : diff > 0;
            delta = {
                text: `${diff > 0 ? "↑ +" : "↓ "}${diff.toFixed(param.decimals)}`,
                tone: improving ? "good" : "warn",
            };
        }
    }

    return (
        <div className={`ph-tile ${flagged ? "ph-tile-flagged" : ""}`}>
            <div className="ph-tile-top">
                <span className="ph-tile-label">{param.label}</span>
                {status !== "none" && (
                    <span className={`ph-status ph-status-${status}`}>{STATUS_LABEL[status]}</span>
                )}
            </div>

            <div className="ph-tile-value-row">
                <span className="ph-tile-value">{value.toFixed(param.decimals)}</span>
                <span className="ph-tile-unit">{param.unit}</span>
            </div>

            {showBar && (
                <div
                    className="ph-range"
                    role="img"
                    aria-label={`Референтен опсег ${lo}–${hi} ${param.unit}`}
                >
                    <div className="ph-range-band" style={{left: `${BAND_LEFT}%`, width: `${BAND_WIDTH}%`}}/>
                    <div
                        className={`ph-range-dot ${flagged ? "ph-range-dot-flagged" : ""}`}
                        style={{left: `${dotPosition(value, lo, hi)}%`}}
                    />
                </div>
            )}

            {delta && <span className={`ph-delta ph-delta-${delta.tone}`}>{delta.text}</span>}
        </div>
    );
}

// ==================== Visit card ====================

interface VisitCardProps {
    visit: VisitResponse;
    previous: VisitResponse | null;
    parameters: ParameterTrend[];
    isLatest: boolean;
}

function VisitCard({visit, previous, parameters, isLatest}: VisitCardProps) {
    const [open, setOpen] = useState(isLatest);

    const categories = Array.from(new Set(parameters.map((p) => p.category)));
    const sections = categories
        .map((category) => ({
            category,
            items: parameters
                .filter((p) => p.category === category)
                .flatMap((param) => {
                    const value = getValue(visit, param.key);
                    if (value === null) return [];
                    return [{param, value, previous: previous ? getValue(previous, param.key) : null}];
                }),
        }))
        .filter((s) => s.items.length > 0);

    const allItems = sections.flatMap((s) => s.items);
    const flaggedCount = allItems.filter((i) => {
        const s = getStatus(i.value, i.param);
        return s === "low" || s === "high";
    }).length;

    const summary =
        allItems.length === 0
            ? "Нема внесени вредности"
            : flaggedCount === 0
                ? "Сите вредности се во референтниот опсег"
                : `${flaggedCount} ${flaggedCount === 1 ? "вредност е" : "вредности се"} надвор од референтниот опсег`;

    return (
        <li className={`ph-visit ${isLatest ? "ph-visit-latest" : ""}`}>
            <span className="ph-visit-dot" aria-hidden="true"/>

            <div className="ph-visit-card">
                <button
                    type="button"
                    className="ph-visit-header"
                    aria-expanded={open}
                    onClick={() => setOpen((o) => !o)}
                >
                    <div className="ph-visit-heading">
            <span className="ph-visit-date">
              {formatLongDate(visit.visit_date)}
                {isLatest && <span className="ph-latest-tag">Последен преглед</span>}
            </span>
                        <span className={`ph-visit-summary ${flaggedCount > 0 ? "ph-visit-summary-flagged" : ""}`}>
              {summary}
            </span>
                    </div>

                    <div className="ph-visit-header-right">
                        <span className={`ph-stage ph-stage-${stageTone(visit.ckd_stage)}`}>{visit.ckd_stage}</span>
                        <span className={`ph-chevron ${open ? "ph-chevron-open" : ""}`} aria-hidden="true">
              ▾
            </span>
                    </div>
                </button>

                {open && (
                    <div className="ph-visit-body">
                        {visit.notes && (
                            <blockquote className="ph-notes">
                                <span className="ph-notes-label">Белешка од лекарот</span>
                                {visit.notes}
                            </blockquote>
                        )}

                        {sections.map((section) => (
                            <section key={section.category} className="ph-section">
                                <h4 className="ph-section-title">{section.category}</h4>
                                <div className="ph-tile-grid">
                                    {section.items.map((item) => (
                                        <ResultTile
                                            key={item.param.key}
                                            param={item.param}
                                            value={item.value}
                                            previous={item.previous}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}

                        {previous && allItems.length > 0 && (
                            <p className="ph-compare-hint">
                                Промените се во однос на прегледот од {formatLongDate(previous.visit_date)}.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
}

// ==================== Stat card ====================

function StatCard({label, value, hint, tone}: {
    label: string;
    value: string;
    hint?: string;
    tone?: "good" | "warn" | "alert";
}) {
    return (
        <div className="ph-stat">
            <span className="ph-stat-label">{label}</span>
            <span className={`ph-stat-value ${tone ? `ph-stat-${tone}` : ""}`}>{value}</span>
            {hint && <span className="ph-stat-hint">{hint}</span>}
        </div>
    );
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
        explanation,
        loading: explainLoading,
        error: explainError,
        generate: generateExplanation
    } = useExplainResults(patientId);

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
                                        onClick={() => void generateExplanation()}
                                        disabled={explainLoading}
                                    >
                                        {explainLoading ? "Се генерира…" : "Генерирај анализа"}
                                    </button>
                                </div>

                                {explainError && <p className="ph-explain-error">{explainError}</p>}

                                {explanation ? (
                                    <div className="ph-explain-box">
                                        <div className="ph-explain-box-header">🤖 AI Објаснување на резултатите</div>
                                        <p className="ph-explain-text">{explanation}</p>
                                    </div>
                                ) : (
                                    <p className="ph-muted">
                                        Добијте едноставно објаснување на вашите најнови резултати.
                                    </p>
                                )}
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
        </div>
    );
}