import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="marketing-page marketing-page-compact">
      <header className="marketing-nav compact-nav">
        <Link className="marketing-brand" href="/">
          <span aria-hidden="true" className="brand-die">
            ✦
          </span>
          <span>
            MYBOARD<span>.AI</span>
            <small>Ваша идея. Ваша игра.</small>
          </span>
        </Link>
      </header>

      <section className="compact-hero">
        <div className="compact-hero-copy">
          <p className="hero-kicker">AI-СТУДИЯ НАСТОЛЬНЫХ ИГР</p>
          <h1>
            Создайте игру <em>своей мечты</em>
          </h1>
          <p>
            Расскажите идею — о городе, семье, друзьях или особенном событии. AI поможет превратить
            её в оригинальную настольную игру с полем, карточками, правилами и собственным стилем.
          </p>
          <Link className="marketing-primary-cta" href="/login">
            <span aria-hidden="true">✦</span> Создай свою игру!
          </Link>
        </div>

        <div className="compact-game-art">
          <Image
            alt="Оригинальный набор городской настольной игры: поле, карточки, фишки и коробка"
            className="compact-game-image"
            priority
            sizes="(max-width: 900px) 100vw, 56vw"
            src="/images/game-kit-preview.png"
            width={1440}
            height={1440}
          />
        </div>
      </section>
    </main>
  );
}
