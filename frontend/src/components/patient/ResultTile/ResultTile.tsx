import type {ParameterTrend} from "../../../api/types/trends";
import {getStatus, type ResultStatus} from "../../../utils/patient";
import "./ResultTile.css";

const STATUS_LABEL: Record<ResultStatus, string> = {
    ok: "Во норма",
    low: "Ниско",
    high: "Високо",
    none: "",
};

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

interface ResultTileProps {
    param: ParameterTrend;
    value: number;
    previous: number | null;
}

export default function ResultTile({param, value, previous}: ResultTileProps) {
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
