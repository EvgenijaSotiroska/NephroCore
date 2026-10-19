import "./Footer.css";

interface FooterProps {
  onLogin: () => void;
  onRegister: () => void;
}

// These links scroll to the sections of the home page (their ids are set in components/home).
const PLATFORM_LINKS = [
  { href: "#features", label: "Функции" },
  { href: "#stages", label: "KDIGO стадиуми" },
  { href: "#doctors", label: "За доктори" },
  { href: "#patients", label: "За пациенти" },
  { href: "#chatbot", label: "Асистент" },
];

export default function Footer({ onLogin, onRegister }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__logo">
            <span className="site-footer__logo-icon" aria-hidden="true">
              🫁
            </span>
            NephroCore
          </span>
          <p>
            AI-поддржана нефролошка платформа за доктори и пациенти. Изградена врз KDIGO упатства.
          </p>
        </div>

        <nav className="site-footer__column" aria-label="Платформа">
          <h4>Платформа</h4>
          {PLATFORM_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-footer__column">
          <h4>Профил</h4>
          <button type="button" onClick={onLogin}>
            Најава
          </button>
          <button type="button" onClick={onRegister}>
            Регистрација
          </button>
        </div>

        <div className="site-footer__column">
          <h4>Важно</h4>
          <p className="site-footer__note">
            NephroCore не е медицински уред и не заменува лекар. При итни случаи јавете се на 194 или 112.
          </p>
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} NephroCore · Сите права задржани</span>
        <span>Направено со грижа за бубрезите 🫁</span>
      </div>
    </footer>
  );
}
