import type { SVGProps } from "react";

/** Explicit size + block avoids flex/layout bugs where SVGs expand to fill the viewport. */
const icon = "block h-5 w-5 max-h-5 max-w-5 shrink-0 overflow-hidden";

const svgBase = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  "aria-hidden": true as const,
};

export function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

export function IconSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}

export function IconChat(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <path d="M21 12a8 8 0 01-8 8H8l-5 3v-3H5a8 8 0 118-8z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconStudio(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <path
        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Clock — chat / session history. */
export function IconHistory(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Simple list-style feed icon (replaces arc paths that broke in some SVG renderers). */
export function IconFeed(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <circle cx="5" cy="7" r="1.5" fill="currentColor" stroke="none" />
      <path d="M10 7h10" strokeLinecap="round" />
      <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M10 12h10" strokeLinecap="round" />
      <circle cx="5" cy="17" r="1.5" fill="currentColor" stroke="none" />
      <path d="M10 17h7" strokeLinecap="round" />
    </svg>
  );
}

export function IconCharacters(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBarChart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <path d="M12 20V10M18 20V4M6 20v-4" strokeLinecap="round" />
    </svg>
  );
}

export function IconCode(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSettings(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconPaperclip(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <path
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSliders(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" strokeLinecap="round" />
    </svg>
  );
}

export function IconSparkles(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <path d="M9.937 15.5L12 21l2.063-5.5L21 12l-5.5-2.063L12 4l-2.063 5.5L4 12l5.5 2.063z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function IconArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMic(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} {...svgBase} {...props}>
      <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" strokeLinejoin="round" />
      <path d="M19 11a7 7 0 01-14 0M12 18v3M8 21h8" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="block h-4 w-4 max-h-4 max-w-4 shrink-0 overflow-hidden"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
      {...props}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMore(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={icon} width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
