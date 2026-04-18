import { NavLink } from "react-router-dom";
import { Logo } from "../../components/Logo";
import {
  IconBarChart,
  IconCharacters,
  IconChat,
  IconCode,
  IconHistory,
  IconMenu,
  IconSearch,
  IconSettings,
  IconStudio,
} from "./DashboardIcons";
import { DASHBOARD_INDEX_TITLE, DASHBOARD_SEGMENT_LABELS, type DashboardSegment } from "./dashboardRouteTitles";

const navFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const navPrimarySegments: { segment: DashboardSegment; Icon: typeof IconSearch }[] = [
  { segment: "search", Icon: IconSearch },
  { segment: "investigations", Icon: IconChat },
  { segment: "studio", Icon: IconStudio },
  { segment: "history", Icon: IconHistory },
  { segment: "cases", Icon: IconCharacters },
];

type Props = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function DashboardSidebar({ sidebarOpen, onToggleSidebar }: Props) {
  const title = "Workspace";
  const subtitle = "Prototype UI";
  const avatarLetter = "C";

  return (
    <aside
      aria-label="Cockpit navigation"
      className={`flex h-svh w-[320px] shrink-0 flex-col border-r border-white/[0.06] bg-zinc-950 text-zinc-300 transition-[transform,opacity] max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 ${
        sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full max-md:opacity-0 max-md:pointer-events-none"
      }`}
    >
      <div className="flex h-[77px] items-center justify-between gap-2 border-b border-white/[0.06] px-4">
        <NavLink
          to="/"
          className={`flex min-w-0 items-center gap-2 rounded-md text-white ${navFocus}`}
          aria-label="Cockpit home"
        >
          <Logo variant="onDark" className="h-9 w-9 shrink-0" />
          <span className="font-display text-lg font-semibold tracking-tight">Cockpit</span>
        </NavLink>
        <button
          type="button"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-white ${navFocus}`}
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
        >
          <IconMenu />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3">
        <nav aria-label="Workspace" className="flex flex-col gap-0.5">
          <ul className="list-none space-y-0.5 p-0">
            {navPrimarySegments.map((item) => {
              const { Icon, segment } = item;
              const label = DASHBOARD_SEGMENT_LABELS[segment];
              return (
                <li key={segment}>
                  <NavLink
                    to={segment}
                    className={({ isActive }) =>
                      `flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors ${navFocus} ${
                        isActive
                          ? "bg-white/10 text-white [&_svg]:text-white"
                          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100 [&_svg]:text-zinc-500"
                      }`
                    }
                  >
                    <Icon className="shrink-0" />
                    {label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="my-4 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3" aria-labelledby="saved-views-hint-title">
          <h2 id="saved-views-hint-title" className="sr-only">
            Saved views
          </h2>
          <p className="text-xs leading-relaxed text-zinc-400">
            Save a view once and reopen it from any investigation—no digging through menus.
          </p>
        </section>

        <nav aria-label="Workspace tools" className="flex flex-col gap-0.5">
          <ul className="list-none space-y-0.5 p-0">
            <li>
              <NavLink
                to="/build-dashboard"
                end
                className={({ isActive }) =>
                  `flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${navFocus} ${
                    isActive
                      ? "bg-white/10 text-white [&_svg]:text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200 [&_svg]:text-zinc-500"
                  }`
                }
              >
                <IconBarChart />
                {DASHBOARD_INDEX_TITLE}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="api"
                className={({ isActive }) =>
                  `flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors ${navFocus} ${
                    isActive
                      ? "bg-white/10 text-white [&_svg]:text-white"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200 [&_svg]:text-zinc-500"
                  }`
                }
              >
                <IconCode />
                {DASHBOARD_SEGMENT_LABELS.api}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="settings"
                className={({ isActive }) =>
                  `flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors ${navFocus} ${
                    isActive
                      ? "bg-white/10 text-white [&_svg]:text-white"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200 [&_svg]:text-zinc-500"
                  }`
                }
              >
                <IconSettings />
                {DASHBOARD_SEGMENT_LABELS.settings}
              </NavLink>
            </li>
          </ul>
        </nav>

        <section className="mt-6 px-0" aria-labelledby="folders-heading">
          <div className="flex items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <h2 id="folders-heading" className="m-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Folders
            </h2>
            <button
              type="button"
              className={`rounded p-1 hover:bg-white/5 hover:text-zinc-300 ${navFocus}`}
              aria-label="Add folder"
            >
              +
            </button>
          </div>
        </section>
      </div>

      <footer className="mt-auto border-t border-white/[0.06] p-3" aria-label="Account">
        <button
          type="button"
          className={`w-full rounded-lg border border-white/15 bg-transparent px-3 py-2.5 text-center text-sm font-medium text-zinc-300 transition-colors hover:border-white/25 hover:bg-white/5 hover:text-white ${navFocus}`}
        >
          Invite &amp; Earn
        </button>
        <div
          className="mt-3 flex min-h-14 items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5 text-left"
          role="status"
          aria-label={`${title}. ${subtitle}.`}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-200"
            aria-hidden
          >
            {avatarLetter.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-200">{title}</p>
            <p className="text-xs text-zinc-500">{subtitle}</p>
          </div>
        </div>
      </footer>
    </aside>
  );
}
