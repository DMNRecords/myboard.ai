"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createProjectAction } from "./actions";

const gameTypes = [
  {
    id: "board",
    icon: "◈",
    title: "Игра с полем",
    text: "Путешествие по клеткам, события и фишки"
  },
  {
    id: "adventure",
    icon: "⚔",
    title: "Приключение",
    text: "Квест, роли, испытания и сюжет"
  },
  {
    id: "cards",
    icon: "♠",
    title: "Карточная",
    text: "Колода, комбинации и быстрые раунды"
  },
  {
    id: "party",
    icon: "✦",
    title: "Для компании",
    text: "Общение, задания и много смеха"
  },
  {
    id: "strategy",
    icon: "♜",
    title: "Стратегия",
    text: "Ресурсы, выборы и планирование"
  }
] as const;

const styles = [
  { id: "classic", title: "Классика", icon: "♔" },
  { id: "retro", title: "Ретро", icon: "✺" },
  { id: "comic", title: "Мультик", icon: "☻" },
  { id: "anime", title: "Аниме", icon: "✧" },
  { id: "future", title: "Футуризм", icon: "◌" },
  { id: "noir", title: "Нуар", icon: "◐" }
] as const;

const playerOptions = ["1–2", "2–4", "3–6", "6+"] as const;
const audienceOptions = [
  { id: "family", title: "Семейная", icon: "♥" },
  { id: "friends", title: "Для компании", icon: "☻" },
  { id: "adults", title: "18+", icon: "✦" },
  { id: "humor", title: "Юмор", icon: "☼" }
] as const;

const stepTitles = ["Расскажите идею", "Выберите формат", "Задайте настроение"];

export function GameCreatorWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [idea, setIdea] = useState("");
  const [gameType, setGameType] = useState("board");
  const [style, setStyle] = useState("classic");
  const [players, setPlayers] = useState("2–4");
  const [audience, setAudience] = useState("family");
  const [language, setLanguage] = useState("ru");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function nextStep() {
    if (step === 0 && !idea.trim()) {
      setError("Сначала опишите, какую игру вы хотите создать.");
      return;
    }

    setError(null);
    setStep((current) => Math.min(current + 1, 2));
  }

  function makeMagic() {
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("idea", idea);
        formData.set("gameType", gameType);
        formData.set("style", style);
        formData.set("players", players);
        formData.set("audience", audience);
        formData.set("language", language);
        const result = await createProjectAction(formData);

        if (result.status === "error" || !result.projectId) {
          setError(result.message);
          return;
        }

        router.push(`/projects/${result.projectId}?autogenerate=1`);
      } catch {
        setError("Не удалось начать создание игры. Проверьте соединение и попробуйте ещё раз.");
      }
    });
  }

  return (
    <section className="game-creator" aria-label="Мастер создания игры">
      <div className="creator-progress" aria-label={`Шаг ${step + 1} из 3`}>
        {stepTitles.map((title, index) => (
          <div
            className={index <= step ? "creator-step creator-step-active" : "creator-step"}
            key={title}
          >
            <span>{index + 1}</span>
            <strong>{title}</strong>
          </div>
        ))}
      </div>

      {step === 0 ? (
        <div className="creator-stage creator-stage-idea">
          <div>
            <span className="section-kicker">ВАША ИДЕЯ</span>
            <h2>Какую игру вы хотите?</h2>
            <p>
              Опишите тему, настроение или повод. Можно просто: «Хочу игру о нашем городе для
              семьи».
            </p>
          </div>
          <label className="creator-idea-input">
            <span>Идея игры</span>
            <textarea
              maxLength={2000}
              onChange={(event) => setIdea(event.target.value)}
              placeholder="Например: весёлая семейная игра о путешествии по Алматы, с интересными местами и заданиями"
              value={idea}
            />
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="creator-stage">
          <div>
            <span className="section-kicker">ФОРМАТ ИГРЫ</span>
            <h2>На что будет похожа игра?</h2>
            <p>AI возьмёт формат как ориентир, но сделает оригинальные правила и компоненты.</p>
          </div>
          <div className="game-type-grid">
            {gameTypes.map((type) => (
              <button
                className={gameType === type.id ? "choice-card choice-card-active" : "choice-card"}
                key={type.id}
                onClick={() => setGameType(type.id)}
                type="button"
              >
                <span aria-hidden="true">{type.icon}</span>
                <strong>{type.title}</strong>
                <small>{type.text}</small>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="creator-stage creator-stage-settings">
          <div>
            <span className="section-kicker">НАСТРОЕНИЕ ИГРЫ</span>
            <h2>Выберите стиль и компанию</h2>
            <p>Это влияет на визуалы, тон правил и первый комплект компонентов.</p>
          </div>
          <div className="style-choice-grid">
            {styles.map((styleOption) => (
              <button
                className={
                  style === styleOption.id ? "style-choice style-choice-active" : "style-choice"
                }
                key={styleOption.id}
                onClick={() => setStyle(styleOption.id)}
                type="button"
              >
                <span aria-hidden="true" className={`style-swatch style-swatch-${styleOption.id}`}>
                  {styleOption.icon}
                </span>
                {styleOption.title}
              </button>
            ))}
          </div>
          <div className="creator-setting-row">
            <fieldset>
              <legend>Количество игроков</legend>
              <div className="pill-options">
                {playerOptions.map((option) => (
                  <button
                    className={
                      players === option ? "pill-option pill-option-active" : "pill-option"
                    }
                    key={option}
                    onClick={() => setPlayers(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Для кого игра</legend>
              <div className="audience-options">
                {audienceOptions.map((option) => (
                  <button
                    className={
                      audience === option.id
                        ? "audience-option audience-option-active"
                        : "audience-option"
                    }
                    key={option.id}
                    onClick={() => setAudience(option.id)}
                    type="button"
                  >
                    <span aria-hidden="true">{option.icon}</span>
                    {option.title}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <label className="creator-language">
            Язык правил
            <select onChange={(event) => setLanguage(event.target.value)} value={language}>
              <option value="ru">Русский</option>
              <option value="kk">Қазақша</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
      ) : null}

      {error ? (
        <p className="creator-error" role="alert">
          {error}
        </p>
      ) : null}
      <footer className="creator-controls">
        {step > 0 ? (
          <button
            className="creator-back"
            onClick={() => setStep((current) => current - 1)}
            type="button"
          >
            ← Назад
          </button>
        ) : (
          <span />
        )}
        {step < 2 ? (
          <button className="marketing-primary-cta" onClick={nextStep} type="button">
            Продолжить <span aria-hidden="true">→</span>
          </button>
        ) : (
          <button className="magic-button" disabled={isPending} onClick={makeMagic} type="button">
            <span aria-hidden="true">✦</span>
            {isPending ? "AI начинает магию…" : "Сделать магию!"}
          </button>
        )}
      </footer>
    </section>
  );
}
