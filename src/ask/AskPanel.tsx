// The Ask panel: staff type a question about their shows, and Claude answers
// with Doorlist's own components, drawn by json-render from the spec it sends.
import { useEffect, useState } from "react";
import { JSONUIProvider, Renderer, type Spec } from "@json-render/react";
import { handlers, registry } from "./registry";
import { whenDiscountRequested, type DiscountRequest } from "./actions";
import { DiscountDialog } from "../components/DiscountDialog";

export function AskPanel({ onClose }: { onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [discount, setDiscount] = useState<(DiscountRequest & { title: string }) | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  // A button in an answer can only open Doorlist's own discount dialog,
  // filled in. Staff check it there, and the server has the final say.
  useEffect(() => {
    whenDiscountRequested(async (request) => {
      const res = await fetch(`/api/shows/${request.showId}`);
      if (!res.ok) return;
      const { show } = await res.json();
      setCreated(null);
      setDiscount({ ...request, title: show.title });
    });
  }, []);

  async function ask() {
    if (!question.trim()) return;
    setAsked(question);
    setSpec(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ask", { method: "POST", body: JSON.stringify({ question }) });
      const body = await res.json();
      if (!res.ok) setMessage(body.error ?? "Something went wrong.");
      else if (body.spec) setSpec(body.spec);
      else setMessage(body.message);
    } finally {
      setBusy(false);
      setQuestion("");
    }
  }

  return (
    <aside className="drawer" aria-label="Ask Doorlist">
      <div className="drawer-head">
        <h2>Ask Doorlist</h2>
        <button className="button secondary" onClick={onClose}>Close</button>
      </div>
      <div className="drawer-body">
        {asked && <div className="question">{asked}</div>}
        {busy && <div className="thinking">Working it out…</div>}
        {message && <div className="answer-text">{message}</div>}
        {spec && (
          <JSONUIProvider registry={registry} initialState={spec.state ?? {}} handlers={handlers(() => undefined, () => ({}))}>
            <Renderer spec={spec} registry={registry} />
          </JSONUIProvider>
        )}
        {created && <p className="success">Created discount code {created}.</p>}
      </div>
      {discount && (
        <DiscountDialog
          showId={discount.showId}
          title={discount.title}
          initialPercent={discount.percent}
          onClose={(code) => {
            setDiscount(null);
            if (code) setCreated(code);
          }}
        />
      )}
      <form className="drawer-foot" onSubmit={(e) => { e.preventDefault(); void ask(); }}>
        <input aria-label="Question" placeholder="Ask about your shows…" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button className="button" disabled={busy}>Ask</button>
      </form>
    </aside>
  );
}
