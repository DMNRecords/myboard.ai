import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page-shell">
      <header className="site-header">
        <span className="brand">MYBOARD.AI</span>
        <span className="stage-label">Stage 1 · App shell</span>
      </header>

      <main className="hero">
        <span className="eyebrow">Настольная игра начинается с идеи</span>
        <h1>Расскажите историю. Мы поможем превратить её в игру.</h1>
        <p className="lead">
          MYBOARD.AI поможет придумать оригинальную настольную игру, её правила, компоненты и
          материалы для печати.
        </p>
        <Link className="cta" href="/login">
          Создать игру
        </Link>
      </main>

      <footer className="site-footer">MYBOARD.AI · персональные игры с ИИ</footer>
    </div>
  );
}
