import Link from "next/link";

const taglines = {
  staff: "Acces pentru personalul primăriei",
  citizen: "See it. Report it. Fix it.",
};

export default function AuthCard({
  title,
  subtitle,
  audience = "staff",
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  audience?: keyof typeof taglines;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-surface px-margin pb-space-2xl pt-space-md">
      <div className="flex w-full max-w-sm flex-col items-center">
        <header className="mb-space-lg flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-space-xs">
            <span className="font-display text-display tracking-tight text-on-surface">Aici</span>
            {audience === "citizen" && (
              <span className="inline-flex items-center rounded-full bg-secondary-container px-2 py-0.5 font-label-md text-label-md text-on-secondary-fixed">
                Chișinău
              </span>
            )}
          </Link>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{taglines[audience]}</p>
        </header>

        <section className="flex w-full flex-col rounded-xl bg-surface-container-lowest p-space-lg shadow-md">
          <div className="mb-space-lg">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{title}</h1>
            {subtitle && <p className="mt-1.5 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{subtitle}</p>}
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
