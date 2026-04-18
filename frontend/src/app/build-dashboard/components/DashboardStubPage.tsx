import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  children?: ReactNode;
};

/** Shared shell for workspace routes: clear heading, readable copy, room for future UI. */
export function DashboardStubPage({ title, description, children }: Props) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-8 border-b border-white/[0.06] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">{description}</p>
      </header>
      {children ? <div className="space-y-4">{children}</div> : null}
    </div>
  );
}
