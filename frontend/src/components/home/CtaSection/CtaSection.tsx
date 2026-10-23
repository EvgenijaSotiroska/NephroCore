import "../sections.css";
import "./CtaSection.css";

// Fill in an address to show the "Контактирајте нè" button. While it is empty the button is hidden.
const CONTACT_EMAIL = "";

interface CtaSectionProps {
  onRegister: () => void;
}

export default function CtaSection({ onRegister }: CtaSectionProps) {
  return (
    <section className="hs-section hx-section">
      <div className="hs-container hx-container">
        <img className="hx-icon" src="/kidney.svg" alt="" />

        <h2 className="hs-title">
          Започнете со следење
          <br />
          на бубрежната функција
        </h2>
        <p className="hs-subtitle">
          NephroCore е достапен за нефролози и нивните пациенти. Без претплата во Beta фазата.
        </p>

        <div className="hx-buttons">
          <button type="button" className="hs-button" onClick={onRegister}>
            Регистрирајте се — бесплатно
          </button>

          {CONTACT_EMAIL && (
            <a className="hs-button hs-button--light" href={`mailto:${CONTACT_EMAIL}`}>
              Контактирајте нè
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
