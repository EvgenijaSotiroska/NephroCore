import { useState } from "react";
import "../sections.css";
import "./StagesSection.css";

interface Stage {
  code: string;
  name: string;
  range: string;
  color: string;
  width: number; // length of the bar, in percent
  description: string;
}

const STAGES: Stage[] = [
  {
    code: "G1",
    name: "Нормална функција",
    range: "≥ 90",
    color: "#00d68f",
    width: 100,
    description:
      "Бубрежната функција е нормална. За да се постави дијагноза хронична бубрежна болест мора да има други знаци на оштетување, на пример протеин во урината. Најважни се контрола на притисокот и шеќерот и редовно следење.",
  },
  {
    code: "G2",
    name: "Лесно намалена",
    range: "60–89",
    color: "#a3e635",
    width: 84,
    description:
      "Функцијата е лесно намалена. Често нема симптоми. Следењето на албумин во урината и на крвниот притисок помага рано да се забележи влошување.",
  },
  {
    code: "G3a",
    name: "Умерено намалена",
    range: "45–59",
    color: "#ffc400",
    width: 67,
    description:
      "Функцијата е умерено намалена. Почнува поблиско следење на анемија, калиум, фосфати и калциум, како и проверка на лековите.",
  },
  {
    code: "G3b",
    name: "Значително намалена",
    range: "30–44",
    color: "#ff8a00",
    width: 50,
    description:
      "Функцијата е значително намалена. Компликациите се почести, па се следат повеќе параметри и почесто.",
  },
  {
    code: "G4",
    name: "Тешко намалена",
    range: "15–29",
    color: "#ff6b6b",
    width: 33,
    description:
      "Функцијата е тешко намалена. Се подготвува следниот чекор: разговор и планирање за можно заместување на бубрежната функција.",
  },
  {
    code: "G5",
    name: "Бубрежна слабост",
    range: "< 15",
    color: "#c40000",
    width: 16,
    description:
      "Бубрежна слабост. Потребна е заместителна терапија (дијализа или трансплантација) или конзервативна грижа, според одлука на пациентот и лекарот.",
  },
];

const DEFAULT_STAGE = "G3b";

export default function StagesSection() {
  const [selectedCode, setSelectedCode] = useState(DEFAULT_STAGE);
  const selected = STAGES.find((stage) => stage.code === selectedCode) ?? STAGES[3];

  return (
    <section id="stages" className="hs-section hs-section--tinted">
      <div className="hs-container hk-container">
        <div className="hs-heading">
          <span className="hs-eyebrow">KDIGO стадиуми</span>
          <h2 className="hs-title">Хронична бубрежна болест</h2>
          <p className="hs-subtitle">Кликнете на стадиум за повеќе информации</p>
        </div>

        <ul className="hk-list">
          {STAGES.map((stage) => (
            <li key={stage.code}>
              <button
                type="button"
                className={`hk-row ${stage.code === selected.code ? "hk-row--active" : ""}`}
                onClick={() => setSelectedCode(stage.code)}
                aria-pressed={stage.code === selected.code}
              >
                <span className="hk-badge" style={{ background: stage.color }}>
                  {stage.code}
                </span>

                <span className="hk-main">
                  <span className="hk-line">
                    <span className="hk-name">{stage.name}</span>
                    <span className="hk-range">eGFR {stage.range}</span>
                  </span>
                  <span className="hk-bar">
                    <span
                      className="hk-bar-fill"
                      style={{ width: `${stage.width}%`, background: stage.color }}
                    />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="hk-detail">
          <span className="hk-badge" style={{ background: selected.color }}>
            {selected.code}
          </span>
          <div>
            <h3 className="hk-detail-title">{selected.name}</h3>
            <p className="hk-detail-text">
              eGFR {selected.range} ml/min/1.73m². {selected.description} NephroCore го следи
              стадиумот низ посетите и генерира AI анализа базирана на KDIGO упатства.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
