import { createElement } from "react";
import type { IconNode } from "lucide";

// A lucide IconNode is a plain [tag, attrs][] description, not a React component, so it
// gets turned into real SVG children here instead of every caller repeating the mapping.
export default function Icon({ node, className }: { node: IconNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {node.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
}
