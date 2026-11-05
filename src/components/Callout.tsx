export function Callout({ tone = "info", title, text }: { tone?: "info" | "warning" | "bad"; title: string; text?: string | null }) {
  return (
    <div className={`callout ${tone}`}>
      <div className="callout-title">{title}</div>
      {text && <div>{text}</div>}
    </div>
  );
}
