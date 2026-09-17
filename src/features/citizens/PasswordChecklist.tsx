import { citizenPasswordChecks } from "@/features/citizens/password-rules";

// The citizen password rules, ticked off while typing. Used by sign up and the new password page.
export default function PasswordChecklist({ password }: { password: string }) {
  return (
    <>
      <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
        {citizenPasswordChecks(password).map((check) => (
          <li
            key={check.label}
            className={
              "rounded-full border px-2 py-0.5 " +
              (check.ok ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-400")
            }
          >
            {check.ok ? "✓ " : ""}
            {check.label}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-slate-400">Verificăm și să nu apară în scurgeri de date publice.</p>
    </>
  );
}
