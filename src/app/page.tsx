import Image from "next/image";
import Link from "next/link";

const styles = [
  {
    name: "Нуар",
    detail: "Тайны, контрасты и городские истории",
    emoji: "🌒",
    className: "style-noir"
  },
  { name: "Ретро", detail: "Тёплые цвета и ностальгия", emoji: "📻", className: "style-retro" },
  {
    name: "Комикс",
    detail: "Динамика, герои и яркие события",
    emoji: "💥",
    className: "style-comic"
  },
  {
    name: "Футуризм",
    detail: "Смелые формы и мир будущего",
    emoji: "🛸",
    className: "style-future"
  }
];

const creationSteps = [
  {
    number: "01",
    title: "Расскажите идею",
    text: "Например: «Хочу игру о Темиртау в стиле нуар».",
    icon: "✦"
  },
  {
    number: "02",
    title: "AI создаёт основу",
    text: "Концепция, правила, поле, карточки и компоненты в одном стиле.",
    icon: "◌"
  },
  {
    number: "03",
    title: "Настройте детали",
    text: "Меняйте текст, баланс, изображения и оформление в конструкторе.",
    icon: "✎"
  },
  {
    number: "04",
    title: "Играйте и печатайте",
    text: "Сохраните версию игры и подготовьте комплект к печати.",
    icon: "▣"
  }
];

export default function HomePage() {
  return (
    <main className="marketing-page">
      <header className="marketing-nav">
        <Link className="marketing-brand" href="/">
          <span aria-hidden="true" className="brand-die">
            ✦
          </span>
          <span>
            MYBOARD<span>.AI</span>
            <small>Ваша идея. Ваша игра.</small>
          </span>
        </Link>
        <nav aria-label="Основная навигация" className="marketing-links">
          <a href="#how-it-works">Как это работает</a>
          <a href="#styles">Стили</a>
          <Link href="/projects">Мои игры</Link>
        </nav>
        <Link className="marketing-nav-cta" href="/login">
          Создать игру <span aria-hidden="true">→</span>
        </Link>
      </header>

      <section className="marketing-hero">
        <div className="hero-copy">
          <p className="hero-kicker">AI-СТУДИЯ НАСТОЛЬНЫХ ИГР</p>
          <h1>
            Превратите <em>свою историю</em> в игру
          </h1>
          <p className="hero-lead">
            Опишите город, людей, повод или мечту. MYBOARD.AI поможет собрать оригинальную игру — от
            первой идеи до поля, карточек и печатного комплекта.
          </p>
          <div className="hero-actions">
            <Link className="marketing-primary-cta" href="/login">
              <span aria-hidden="true">✦</span> Создать свою игру
            </Link>
            <a className="marketing-text-link" href="#how-it-works">
              Посмотреть, как это работает <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="hero-trust">
            <span>✓ Оригинальные механики</span>
            <span>✓ Русский, қазақша, English</span>
          </div>
        </div>
        <div className="hero-art">
          <Image
            alt="Друзья играют в оригинальную настольную игру, созданную в MYBOARD.AI"
            className="hero-image"
            priority
            sizes="(max-width: 900px) 100vw, 62vw"
            src="/images/myboard-hero-studio.png"
            width={1680}
            height={936}
          />
          <div className="hero-floating-card hero-floating-card-top">
            <span>Стили игры</span>
            <strong>Нуар · Ретро · Комикс</strong>
          </div>
          <div className="hero-floating-card hero-floating-card-bottom">
            <span className="mini-die" aria-hidden="true">
              ⚄
            </span>
            <p>
              <strong>Идея → первая версия</strong>
              <br />с AI-дизайнером
            </p>
          </div>
        </div>
      </section>

      <section className="creation-section" id="how-it-works">
        <div className="section-heading">
          <p className="section-kicker">ПРОСТОЙ ПУТЬ</p>
          <h2>От вашей идеи — к вечеру за игрой</h2>
          <p>
            Не нужно быть гейм‑дизайнером. Вы рассказываете — студия помогает собрать целый мир.
          </p>
        </div>
        <ol className="creation-steps">
          {creationSteps.map((step) => (
            <li key={step.number}>
              <div className="step-icon" aria-hidden="true">
                {step.icon}
              </div>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="studio-section" id="styles">
        <div className="studio-copy">
          <p className="section-kicker">ЕДИНЫЙ ВИЗУАЛЬНЫЙ МИР</p>
          <h2>Один стиль для всей игры</h2>
          <p>
            Выберите атмосферу — и она станет ориентиром для обложки, коробки, поля, карточек,
            жетонов и будущих иллюстраций. В конструкторе стиль можно уточнять и менять.
          </p>
          <div className="style-promise">
            <span aria-hidden="true">✦</span>
            <p>
              AI не копирует чужие игры: он создаёт оригинальные правила, названия, события и
              оформление по вашей идее.
            </p>
          </div>
          <Link className="marketing-secondary-cta" href="/login">
            Начать с идеи <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="style-grid" aria-label="Примеры визуальных стилей">
          {styles.map((style) => (
            <article className={`style-card ${style.className}`} key={style.name}>
              <span aria-hidden="true">{style.emoji}</span>
              <h3>{style.name}</h3>
              <p>{style.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ai-flow-section">
        <div className="ai-flow-intro">
          <p className="section-kicker">ПЕРВАЯ ВЕРСИЯ ИГРЫ</p>
          <h2>Сначала — идея. Затем — целая игра.</h2>
          <p>
            Например: «Сделай атмосферную городскую игру о Темиртау в стиле нуар». В ответ вы
            получите проект с концепцией, полем, тематическими карточками и предложением механик,
            который можно редактировать.
          </p>
        </div>
        <div className="ai-flow-preview" aria-label="Пример AI-конструктора">
          <aside>
            <span className="preview-label">ВАША ИДЕЯ</span>
            <p>Игра о Темиртау: городские истории, расследования и ночной нуар.</p>
            <span className="preview-label">AI СОБИРАЕТ</span>
            <ul>
              <li>✓ Концепцию и цель игры</li>
              <li>✓ Маршрут игрового поля</li>
              <li>✓ Тематические карточки</li>
              <li>✓ Единый визуальный стиль</li>
            </ul>
          </aside>
          <div className="preview-board" aria-hidden="true">
            <div className="preview-board-header">
              <span>Темиртау после заката</span>
              <i>НОЧНОЙ МАРШРУТ</i>
            </div>
            <div className="preview-board-path">
              {Array.from({ length: 16 }, (_, index) => (
                <span key={index}>
                  {index === 0 ? "СТАРТ" : index === 15 ? "ФИНАЛ" : index + 1}
                </span>
              ))}
            </div>
            <div className="preview-board-cards">
              <span>СЛУХИ</span>
              <span>МЕСТА</span>
              <span>ВЫБОР</span>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-final-cta">
        <p className="section-kicker">ВАША ИГРА ЖДЁТ</p>
        <h2>Какая история станет вашей игрой?</h2>
        <Link className="marketing-primary-cta" href="/login">
          Рассказать идею <span aria-hidden="true">→</span>
        </Link>
      </section>
      <footer className="marketing-footer">
        <span>MYBOARD.AI · Ваша идея. Ваша игра.</span>
        <span>Создаём оригинальные настольные игры с AI</span>
      </footer>
    </main>
  );
}
