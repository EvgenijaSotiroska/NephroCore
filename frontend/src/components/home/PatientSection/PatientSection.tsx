import "../sections.css";
import "./PatientSection.css";

// If the picture cannot be loaded, the gradient behind it is shown instead.
const PATIENT_IMAGE =
  "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1200&q=80";

const ITEMS = [
  {
    icon: "🗺️",
    title: "Водич низ терапијата",
    text: "Секогаш знаете каде се наоѓате — стадиум, следен термин и листа на лекови со објаснување на целта.",
  },
  {
    icon: "📝",
    title: "Внесување симптоми",
    text: "Замор, отоци, промени — известете го докторот помеѓу контролите, не само на преглед.",
  },
  {
    icon: "⏰",
    title: "Потсетници за лекови",
    text: "Кој лек, кога и зошто — апликацијата ја објаснува целта на секој лек со едноставен јазик.",
  },
];

export default function PatientSection() {
  return (
    <section id="patients" className="hs-section hs-section--tinted">
      <div className="hs-container hs-split">
        <div
          className="hs-media"
          style={{
            backgroundImage: `url(${PATIENT_IMAGE}), linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)`,
          }}
        >
          <div className="hs-float-card hp-card">
            <small>Потсетник · пример</small>
            💊 <strong>Периндоприл</strong> · 1 таблета
            <small>Лек за притисок · наутро</small>
          </div>
        </div>

        <div>
          <span className="hs-eyebrow hs-eyebrow--blue" style={{ marginBottom: 12 }}>
            За пациентот
          </span>
          <h2 className="hs-title">Разберете ја вашата состојба</h2>

          <ul className="hp-list">
            {ITEMS.map((item) => (
              <li key={item.title} className="hp-item">
                <span className="hp-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <div>
                  <h3 className="hp-item-title">{item.title}</h3>
                  <p className="hp-item-text">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
