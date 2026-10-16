import type { ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, action }: {
  eyebrow?: string; title: string; description?: string; action?: ReactNode;
}) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>{eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">{eyebrow}</p>}
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">{description}</p>}
    </div>{action}
  </div>;
}
export function Button({ children, href, onClick, variant = "primary", type = "button" }: {
  children: ReactNode; href?: string; onClick?: () => void; variant?: "primary" | "secondary"; type?: "button" | "submit";
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${variant === "primary" ? "bg-[var(--accent)] text-black hover:bg-[#63f0f2]" : "border border-[var(--border)] bg-[#222] text-gray-200 hover:bg-[#2a2a2a]"}`;
  if (href) return <a href={href} className={cls}>{children}</a>;
  return <button type={type} onClick={onClick} className={cls}>{children}</button>;
}
