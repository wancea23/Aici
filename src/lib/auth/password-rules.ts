// Citizen password rules, shown live in the sign up form and checked again on the server.
// Staff keep the longer minimum from the c5 research instead.
export const CITIZEN_MIN_LENGTH = 8;

export function citizenPasswordChecks(password: string) {
  const pw = password.normalize("NFKC");
  return [
    { label: `cel puțin ${CITIZEN_MIN_LENGTH} caractere`, ok: [...pw].length >= CITIZEN_MIN_LENGTH },
    { label: "o literă mare", ok: /\p{Lu}/u.test(pw) },
    { label: "o literă mică", ok: /\p{Ll}/u.test(pw) },
    { label: "un caracter special", ok: /[^\p{L}\p{N}]/u.test(pw) },
  ];
}
