import "../sections.css";
import "./DoctorSection.css";

// If the picture cannot be loaded, the gradient behind it is shown instead.
const DOCTOR_IMAGE =
  "https://images.unsplash.com/photo-1602052577122-f73b9710adba?auto=format&fit=crop&w=1200&q=80";

const STEPS = [
  {
    title: "Внесете нов лабораториски резултат",
    text: "eGFR, креатинин, калиум, фосфати, хемоглобин — еден образец, целосна историја.",
  },
  {
    title: "AI анализа базирана на KDIGO",
    text: "Claude го анализира резултатот во контекст на целиот профил, со цитирање на релевантни делови од упатствата.",
  },
  {
    title: "Визуелен тренд низ посетите",
    text: "Графиконите на промените низ времето — забележете наклон на опаѓање порано отколку со рачна анализа.",
  },
];

export default function DoctorSection({ onRegister }: { onRegister: () => void }) {
  return (
    <section id="doctors" className="hs-section">
      <div className="hs-container hs-split">
        <div>
          <span className="hs-eyebrow hs-eyebrow--blue" style={{ marginBottom: 12 }}>
            За доктори
          </span>
          <h2 className="hs-title">Тренд пред резултат</h2>

          <ol className="hd-steps">
            {STEPS.map((step, index) => (
              <li key={step.title} className="hd-step">
                <span className="hd-step-number">{index + 1}</span>
                <div>
                  <h3 className="hd-step-title">{step.title}</h3>
                  <p className="hd-step-text">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <button type="button" className="hs-button" onClick={onRegister}>
            Регистрирајте се како доктор
          </button>
        </div>

        <div
          className="hs-media"
          style={{
            backgroundImage: `url(${DOCTOR_IMAGE}), linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%)`,
          }}
        >
          <div className="hs-float-card hd-card">
            <small>AI анализа · пример</small>
            „eGFR падна од 46 на 27 за 14 месеци. Ова е брза прогресија и бара планирање на следните чекори.“
            <span className="hd-card-source">📖 [Извор 1] KDIGO 2024, PDF стр. 21</span>
          </div>
        </div>
      </div>
    </section>
  );
}
