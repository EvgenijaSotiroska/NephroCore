import "./StatCard.css";

export default function StatCard({label, value, hint, tone}: {
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
