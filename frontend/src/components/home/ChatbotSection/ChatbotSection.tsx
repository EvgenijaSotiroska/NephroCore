import "../sections.css";
import "./ChatbotSection.css";

const QUESTIONS = [
  "Што значи eGFR?",
  "Што се променило од последниот преглед?",
  "Што да го прашам лекарот?",
];

// An example conversation, only for the picture. It is not a real chat.
const EXAMPLE_MESSAGES = [
  { from: "user", text: "Што значи eGFR 43?" },
  {
    from: "assistant",
    text: "eGFR е број што покажува колку добро бубрезите ги филтрираат отпадните материи. Вредност од 43 значи значително намалено филтрирање (стадиум G3b). Што тоа значи за вас, најдобро ќе ви каже вашиот лекар.",
  },
  { from: "user", text: "Дали треба да го намалам внесот на протеини?" },
  {
    from: "assistant",
    text: "Тоа зависи од вашата состојба. Најдобро е да го прашате вашиот лекар или нутриционист — тие знаат што важи за вас.",
  },
];

export default function ChatbotSection() {
  return (
    <section id="chatbot" className="hs-section">
      <div className="hs-container hs-split">
        <div>
          <span className="hs-eyebrow" style={{ marginBottom: 12 }}>
            NephroCore chatbot
          </span>
          <h2 className="hs-title">
            Одговори на прашањата,
            <br />
            веднаш
          </h2>
          <p className="hs-text">
            Вграден асистент за едноставни и едукативни прашања — медицински термини, општи информации за
            состојбата и подготовка на прашања за лекарот. Не е замена за лекарски совет.
          </p>

          <div className="hc-chips">
            {QUESTIONS.map((question) => (
              <span key={question} className="hc-chip">
                {question}
              </span>
            ))}
          </div>
        </div>

        <div className="hc-window" aria-hidden="true">
          <div className="hc-header">
            <span className="hc-avatar">🤖</span>
            <div>
              <strong>NephroCore Асистент</strong>
              <small>Само едукативни прашања</small>
            </div>
            <span className="hc-online" />
          </div>

          <div className="hc-messages">
            {EXAMPLE_MESSAGES.map((message) => (
              <div key={message.text} className={`hc-bubble hc-bubble--${message.from}`}>
                {message.text}
              </div>
            ))}
          </div>

          <div className="hc-input">
            <span>Поставете прашање…</span>
            <span className="hc-send">→</span>
          </div>
        </div>
      </div>
    </section>
  );
}
