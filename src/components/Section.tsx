import type { ReactNode } from "react";

// A group of things on a page, with an optional heading. Cards inside it
// that sit next to each other wrap into a row.
export function Section({ title, children }: { title?: string | null; children?: ReactNode }) {
  return (
    <section className="section">
      {title && <h2>{title}</h2>}
      <div className="section-body">{children}</div>
    </section>
  );
}
