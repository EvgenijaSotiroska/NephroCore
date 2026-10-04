import { useSessionExpiry } from "../hooks/useSessionExpiry";

export default function SessionExpiryBanner() {
  const { expiringSoon, minutesRemaining } = useSessionExpiry();

  if (!expiringSoon) return null;

  return (
    <div style={{ background: "#fff3cd", padding: "0.5rem 1rem", textAlign: "center" }}>
      Вашата сесија истекнува за {minutesRemaining}{" "}
      {minutesRemaining === 1 ? "минута" : "минути"} — зачувајте ја вашата работа и најавете се повторно.
    </div>
  );
}