"use client";

import classNames from "classnames";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

interface NavigationProps {
  /** Whether the navigation bar should span the entire width of the screen
   * or be constrained to the width of the container.
   */
  width?: "full" | "container";

  /** Whether the navigation bar should show the "Start graphing" button. */
  showStartGraphing?: boolean;

  children?: React.ReactNode;
}

export function Navigation({
  width = "container",
  showStartGraphing = true,
  children,
}: NavigationProps) {
  return (
    <nav className="bg-gray-900">
      <div
        className={classNames("mx-auto", {
          "container px-16": width === "container",
          "pl-6 pr-3": width === "full",
        })}
      >
        <div className="flex items-center py-3">
          <Link href="/" className="text-gray-100 font-bold text-xl">
            Mr. Pullen's Graphing Calculator
          </Link>
          <div className="space-x-2 ml-auto flex">
            {children}
            <ThemeToggle />
            {showStartGraphing && (
              <Link
                href="/app"
                className="flex items-center text-gray-300 text-md border border-gray-500 px-4 rounded"
              >
                Start graphing
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
