import "./StatTile.css";

interface StatTileProps {
  label: string;
  value: number;
  hint: string;
}

export default function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="dh-stat">
      <span className="dh-stat-label">{label}</span>
      <span className="dh-stat-value">{value}</span>
      <span className="dh-stat-hint">{hint}</span>
    </div>
  );
}
