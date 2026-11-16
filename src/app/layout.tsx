import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "MYBOARD.AI — ваша идея, ваша игра",
  description: "AI-студия оригинальных настольных игр: от идеи до поля, карточек и печати."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
