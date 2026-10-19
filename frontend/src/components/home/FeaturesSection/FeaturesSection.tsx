import "../sections.css";
import "./FeaturesSection.css";

interface Feature {
  icon: string;
  tone: string;
  title: string;
  text: string;
}

const FEATURES: Feature[] = [
  {
    icon: "🧬",
    tone: "teal",
    title: "Профил на пациент",
    text: "Комплетна здравствена историја — коморбидитети, лекови, етиологија и пушење. Секој резултат се толкува во целосен контекст.",
  },
  {
    icon: "📊",
    tone: "blue",
    title: "Следење на трендови",
    text: "eGFR, креатинин, калиум, фосфати, хемоглобин, ПТХ — визуелно следење на промените низ времето, не само моменталната вредност.",
  },
  {
    icon: "🤖",
    tone: "purple",
    title: "AI анализа (Claude + KDIGO)",
    text: "Анализа поткрепена со официјалните KDIGO упатства преку RAG систем — со наведен документ и страница, за да може изворот да се провери.",
  },
  {
    icon: "💬",
    tone: "green",
    title: "Јазик за пациентот",
    text: "Резултатите се преведуваат во едноставен, разбирлив јазик — без медицинска терминологија, со реална слика за состојбата.",
  },
  {
    icon: "🩺",
    tone: "yellow",
    title: "Симптоми меѓу контролите",
    text: "Пациентот внесува симптоми помеѓу прегледите — замор, отоци, промени — давајќи му на докторот увид надвор од закажаните визити.",
  },
  {
    icon: "🗺️",
    tone: "pink",
    title: "Водич низ терапијата",
    text: "Пациентот секогаш знае каде се наоѓа — стадиум, следен термин и листа на лекови со објаснување на целта на секој лек.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="hs-section">
      <div className="hs-container">
        <div className="hs-heading">
          <span className="hs-eyebrow">Функционалности</span>
          <h2 className="hs-title">
            Сè што ви треба за
            <br />
            нефролошка грижа
          </h2>
        </div>

        <div className="hf-grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="hf-card">
              <span className={`hf-icon hf-icon--${feature.tone}`} aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className="hf-card-title">{feature.title}</h3>
              <p className="hf-card-text">{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
