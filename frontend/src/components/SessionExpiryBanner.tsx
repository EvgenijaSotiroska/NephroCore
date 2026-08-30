import { useSessionExpiry } from "../hooks/useSessionExpiry";

export function SessionExpiryBanner() {
  const { expiringSoon, minutesRemaining } = useSessionExpiry();

  if (!expiringSoon) return null;

  return (
    <div style={{ background: "#fff3cd", padding: "0.5rem 1rem", textAlign: "center" }}>
      Your session expires in {minutesRemaining} minute{minutesRemaining === 1 ? "" : "s"} — save any
      unsaved work and log back in.
    </div>
  );
}
