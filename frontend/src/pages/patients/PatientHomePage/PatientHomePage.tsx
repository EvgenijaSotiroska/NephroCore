import {useState} from "react";
import {usePatientProfile} from "../../../hooks/usePatientProfile";
import {useTrends} from "../../../hooks/useTrends";
import {useVisits} from "../../../hooks/useVisits";
import type {CKDStage, ParameterTrend} from "../../../api/types/trends";
import type {PatientProfile} from "../../../api/types/patient";
import type {VisitResponse} from "../../../api/types/result";
import {useExplainResults} from "../../../hooks/useExplainResults";
import "./PatientHomePage.css";

// ==================== Labels & helpers ====================

const ETIOLOGY_LABELS: Record<string, string> = {
    diabetic_nephropathy: "Дијабетична нефропатија",
    hypertensive_nephropathy: "Хипертензивна нефропатија",
    glomerulonephritis: "Гломерулонефритис",
    polycystic_kidney_disease: "Полицистична болест на бубрезите",
    obstructive_uropathy: "Обструктивна уропатија",
    lupus_nephritis: "Лупус нефритис",
    iga_nephropathy: "IgA нефропатија",
    other: "Друго",
    unknown: "Непознато",
};

const STAGE_EGFR_RANGE_LABEL: Record<string, string> = {
    G1: "≥ 90",
    G2: "60–89",
    G3A: "45–59",
    G3B: "30–44",
    G4: "15–29",
    G5: "< 15",
};

const STAGE_DESCRIPTION: Record<CKDStage, string> = {
    G1: "Нормална или висока бубрежна функција",
    G2: "Благо намалена бубрежна функција",
    G3A: "Благо до умерено намалена бубрежна функција",
    G3B: "Умерено до тешко намалена бубрежна функција",
    G4: "Тешко намалена бубрежна функција",
    G5: "Бубрежна инсуфициенција",
};

const DIALYSIS_STATUS_LABELS: Record<string, string> = {
    pre_dialysis: "Пред дијализа",
    on_dialysis: "На дијализа",
    post_transplant: "По трансплантација",
};

const DIALYSIS_MODALITY_LABELS: Record<string, string> = {
    hd: "Хемодијализа",
    pd: "Перитонеална дијализа",
};

function calculateAge(dateOfBirth: string | null): number | null {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

function stageTone(stage: string | null | undefined): "good" | "warn" | "alert" {
    if (stage === "G1" || stage === "G2") return "good";
    if (stage === "G3A" || stage === "G3B") return "warn";
    return "alert";
}

function formatLongDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("mk-MK", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

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

// ==================== Profile ====================

function ProfileDetails({profile}: { profile: PatientProfile }) {
    const rows: { label: string; value: string | null }[] = [
        {
            label: "Датум на раѓање",
            value: profile.date_of_birth ? formatLongDate(profile.date_of_birth) : null,
        },
        {label: "Висина", value: profile.height_cm !== null ? `${profile.height_cm} cm` : null},
        {
            label: "Причина за ХБИ",
            value: profile.ckd_etiology ? ETIOLOGY_LABELS[profile.ckd_etiology] : null,
        },
        {
            label: "Датум на дијагноза",
            value: profile.diagnosis_date ? formatLongDate(profile.diagnosis_date) : null,
        },
        {
            label: "Почетна eGFR",
            value: profile.baseline_egfr !== null ? String(profile.baseline_egfr) : null,
        },
        {label: "Дијализа", value: DIALYSIS_STATUS_LABELS[profile.dialysis_status] ?? null},
        {
            label: "Вид на дијализа",
            value: profile.dialysis_modality ? DIALYSIS_MODALITY_LABELS[profile.dialysis_modality] : null,
        },
        {label: "Тековни лекови", value: profile.current_medications},
        {label: "Придружни болести", value: profile.comorbidities},
        {
            label: "Пушење",
            value: profile.smoking === null ? null : profile.smoking ? "Да" : "Не",
        },
    ];

    return (
        <details className="ph-profile">
            <summary className="ph-profile-summary">Мој профил</summary>
            <div className="ph-profile-rows">
                {rows
                    .filter((r) => r.value)
                    .map((row) => (
                        <div key={row.label} className="ph-profile-row">
                            <span className="ph-profile-label">{row.label}</span>
                            <span className="ph-profile-value">{row.value}</span>
                        </div>
                    ))}
            </div>
        </details>
    );
}

// ==================== Page ====================

export default function PatientHomePage() {
    const {profile, loading: profileLoading, error: profileError} = usePatientProfile();
    const patientId = profile?.id;

    const {data, isLoading: trendsLoading, error: trendsError, refetch} = useTrends(patientId);
    const {visits, loading: visitsLoading, error: visitsError, refresh} = useVisits(patientId);
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
                            refetch();
                            refresh();
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
            <div className="ph-container">
                {/* ============ Welcome ============ */}
                <div className="ph-welcome">
                    <div>
                        {eyebrow && <p className="ph-welcome-eyebrow">{eyebrow}</p>}
                        <h2 className="ph-welcome-title">Здраво, {firstName(profile.full_name)}</h2>
                        <p className="ph-welcome-subtitle">
                            {latestVisit
                                ? `Последен преглед: ${formatLongDate(latestVisit.visit_date)}`
                                : "Вашите резултати ќе се појават овде по првиот преглед."}
                        </p>
                    </div>

                    {stage && (
                        <div className={`ph-welcome-stage ph-stage-block ph-stage-${stageTone(stage)}`}>
                            <span className="ph-stage-block-code">{stage}</span>
                            <span className="ph-stage-block-range">eGFR {STAGE_EGFR_RANGE_LABEL[stage] ?? ""}</span>
                            <span className="ph-stage-block-desc">{STAGE_DESCRIPTION[stage]}</span>
                        </div>
                    )}
                </div>
                {latestVisit && (
                    <div className="ph-explain-section">
                        <button
                            type="button"
                            className="ph-explain-button"
                            onClick={generateExplanation}
                            disabled={explainLoading}
                        >
                            {explainLoading ? "Се генерира…" : "Генерирај анализа"}
                        </button>

                        {explainError && <p className="ph-explain-error">{explainError}</p>}

                        {explanation && (
                            <div className="ph-explain-box">
                                <div className="ph-explain-box-header">🤖 AI Објаснување на резултатите</div>
                                <p className="ph-explain-text">{explanation}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ============ Visits with their results ============ */}
                <h3 className="ph-heading">Мои прегледи</h3>

                {sortedVisits.length === 0 ? (
                    <div className="ph-state">
                        Сè уште нема евидентирани прегледи. Резултатите ќе се прикажат откако лекарот ќе ги внесе.
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

                <ProfileDetails profile={profile}/>
            </div>
        </div>
    );
}