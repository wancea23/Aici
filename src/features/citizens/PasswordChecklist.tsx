import { ShieldCheck } from "lucide";
import Icon from "@/ui/Icon";
import { citizenPasswordChecks } from "@/features/citizens/password-rules";

// The citizen password rules, ticked off while typing. Used by sign up and the new password page.
export default function PasswordChecklist({ password }: { password: string }) {
  return (
    <>
      <ul className="mt-2 flex flex-wrap gap-1.5 font-label-md text-label-md">
        {citizenPasswordChecks(password).map((check) => (
          <li
            key={check.label}
            className={
              "rounded-full border px-2 py-0.5 " +
              (check.ok ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-outline")
            }
          >
            {check.ok ? "✓ " : ""}
            {check.label}
          </li>
        ))}
      </ul>
      <p className="mt-1.5 flex items-start gap-1 font-body-sm text-body-sm text-on-surface-variant">
        <Icon node={ShieldCheck} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Verificăm și să nu apară în scurgeri de date publice.
      </p>
    </>
  );
}
