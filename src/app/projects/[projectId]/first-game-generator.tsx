"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { generateFirstGameAction } from "./ai-actions";

const errorMessages = {
  aiFailed: "AI пока не смог собрать концепцию. Попробуйте ещё раз через минуту.",
  aiKey: "AI-провайдер отклонил ключ. Нужно проверить настройки сервера.",
  aiLimit: "У бесплатного AI закончился временный лимит. Повторите позже.",
  aiModerated: "Опишите безопасную оригинальную идею игры и попробуйте снова.",
  aiQuota: "На сегодня исчерпан лимит AI для бета-версии. Попробуйте завтра.",
  aiSetup: "AI временно не настроен. Нужно проверить подключение провайдера."
} as const;

export function FirstGameGenerator({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("projectId", projectId);
        const result = await generateFirstGameAction(formData);

        if (result.status === "error") {
          setError(errorMessages[result.notice]);
          return;
        }

        router.replace(
          `/projects/${projectId}?notice=${result.usedStarter ? "aiStarter" : "aiGenerated"}`
        );
        router.refresh();
      } catch {
        setError("Соединение с AI прервалось. Нажмите кнопку ещё раз — идея сохранена.");
      }
    });
  }

  return (
    <div className="first-generation-control">
      {isPending ? (
        <div aria-live="polite" className="first-generation-status" role="status">
          <span aria-hidden="true" className="loading-orb" />
          <div>
            <strong>AI создаёт концепцию игры</strong>
            <p>
              Придумывает правила, поле и карточки. Это может занять до минуты — не закрывайте
              страницу.
            </p>
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="generation-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="cta" disabled={isPending} onClick={generate} type="button">
        {isPending ? "AI работает…" : "Создать игру с AI"}
      </button>
    </div>
  );
}
