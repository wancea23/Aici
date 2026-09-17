// The word typed to confirm a deletion. Shown by the form and checked again on the server,
// so both sides read it from here. Compared without diacritics, so STERGE and ȘTERGE both pass.
export const CONFIRM_WORD = "STERGE";

export function confirmMatches(value: string) {
  return value.trim().normalize("NFD").replace(/[̀-̦ͯ]/g, "").toUpperCase() === CONFIRM_WORD;
}
