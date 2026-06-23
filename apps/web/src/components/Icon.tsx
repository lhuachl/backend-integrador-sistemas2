import type { ReactNode } from "react";

const svgPaths: Record<string, ReactNode> = {
  home: <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  brain: [
    <circle key="1" cx="12" cy="12" r="9" />,
    <path key="2" d="M12 3v18" />,
    <path key="3" d="M3 12h18" />,
  ] as unknown as ReactNode,
  target: [
    <circle key="1" cx="12" cy="12" r="10" />,
    <circle key="2" cx="12" cy="12" r="6" />,
    <circle key="3" cx="12" cy="12" r="2" />,
  ] as unknown as ReactNode,
  users: [
    <path key="1" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />,
    <circle key="2" cx="9" cy="7" r="4" />,
    <path key="3" d="M23 21v-2a4 4 0 0 0-3-3.87" />,
    <path key="4" d="M16 3.13a4 4 0 0 1 0 7.75" />,
  ] as unknown as ReactNode,
  user: [
    <path key="1" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />,
    <circle key="2" cx="12" cy="7" r="4" />,
  ] as unknown as ReactNode,
  settings: [
    <circle key="1" cx="12" cy="12" r="3" />,
    <path key="2" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />,
  ] as unknown as ReactNode,
  search: [
    <circle key="1" cx="11" cy="11" r="8" />,
    <path key="2" d="M21 21l-4.35-4.35" />,
  ] as unknown as ReactNode,
  plus: [
    <path key="1" d="M12 5v14" />,
    <path key="2" d="M5 12h14" />,
  ] as unknown as ReactNode,
  chevronLeft: <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />,
};

interface IconProps {
  name: keyof typeof svgPaths;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      {svgPaths[name]}
    </svg>
  );
}
