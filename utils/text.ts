// utils/text.ts
export function normCity(s: string | undefined) {
  return String(s ?? "")
    .normalize("NFD")                 // separa tildes
    .replace(/\p{Diacritic}/gu, "")   // quita tildes
    .toLowerCase()
    .trim();
}
