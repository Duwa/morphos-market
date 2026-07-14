"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn rounded px-4 py-2 bg-ink text-white border-transparent print:hidden"
    >
      Print / save as PDF
    </button>
  );
}
