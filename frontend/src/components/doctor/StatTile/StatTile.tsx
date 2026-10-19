import "./StatTile.css";

interface StatTileProps {
  label: string;
  value: number;
  hint: string;
  icon: string;
  tone: "teal" | "blue" | "purple" | "red";
}

export default function StatTile({ label, value, hint, icon, tone }: StatTileProps) {
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
