"use client";

export function PrintButton() {
  return (
    <button className="cta" onClick={() => window.print()} type="button">
      Печать / Сохранить как PDF
    </button>
  );
}
