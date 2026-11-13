"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { generateGameVisualAction } from "./asset-actions";

export function InitialVisualGenerator({
  projectId,
  kinds
}: {
  projectId: string;
  kinds: string[];
}) {
  const router = useRouter();
  const started = useRef(false);
  const [isPending, startTransition] = useTransition();
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (started.current || kinds.length === 0) return;
    started.current = true;
    startTransition(async () => {
      for (const kind of kinds) {
        const formData = new FormData();
        formData.set("projectId", projectId);
        formData.set("kind", kind);
        const result = await generateGameVisualAction(formData);
        if (result.status !== "success") break;
        setCompleted((value) => value + 1);
      }
      router.refresh();
    });
  }, [kinds, projectId, router, startTransition]);

  if (kinds.length === 0 || (!isPending && completed === 0)) return null;

  return (
    <section aria-live="polite" className="visual-progress">
      <div>
        <span aria-hidden="true" className="loading-orb" />
        <strong>AI оформляет комплект игры</strong>
      </div>
      <p>
        Готово {completed} из {kinds.length}. Можно смотреть и редактировать остальные части —
        визуалы появятся сами.
      </p>
      <span aria-hidden="true" className="visual-progress-track">
        <span style={{ width: `${(completed / kinds.length) * 100}%` }} />
      </span>
    </section>
  );
}
