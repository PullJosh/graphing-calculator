"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      className="w-10 h-10 rounded hover:bg-gray-700"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <span className="sr-only">Color Theme</span>
      <SunMoonSvg icon={theme === "light" ? "sun" : "moon"} />
    </button>
  );
}

interface SunMoonSvgProps {
  icon: "sun" | "moon";
}

function SunMoonSvg({ icon }: SunMoonSvgProps) {
  const mainCircleRadius = icon === "sun" ? 6 : 10;
  const minorCircleRadius = icon === "sun" ? 4 : 8;
  const smallCircleX = icon === "sun" ? 30 : 25;
  const smallCircleY = icon === "sun" ? 10 : 15;

  const transition = "300ms ease-in-out all";

  return (
    <svg
      className="w-10 h-10 stroke-gray-100"
      fill="none"
      viewBox="0 0 40 40"
      strokeWidth={2}
    >
      <defs>
        <mask id="within-major-circle">
          <circle
            cx={20}
            cy={20}
            r={mainCircleRadius}
            fill="white"
            style={{ transition }}
          />
        </mask>
        <mask id="outside-minor-circle">
          <rect x={0} y={0} width={40} height={40} fill="white" />
          <circle
            cx={smallCircleX}
            cy={smallCircleY}
            r={minorCircleRadius}
            fill="black"
            style={{ transition }}
          />
        </mask>
      </defs>
      <circle
        cx={20}
        cy={20}
        r={mainCircleRadius}
        mask="url(#outside-minor-circle)"
        style={{ transition }}
      />
      <circle
        cx={smallCircleX}
        cy={smallCircleY}
        r={minorCircleRadius}
        mask="url(#within-major-circle)"
        style={{ transition }}
      />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1={0}
          y1={-1}
          x2={0}
          y2={0}
          style={{
            transform: `
              translate(20px, 20px)
              rotate(${angle}deg)
              translateY(${-((icon === "sun" ? 6 : 8) + 4)}px)
              scaleY(${icon === "sun" ? 4 : 0})
            `,
            transition,
          }}
        />
      ))}
    </svg>
  );
}
