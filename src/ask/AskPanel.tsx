// The Ask panel: staff type a question about their shows, and Claude answers
// with Doorlist's own components, drawn by json-render as the answer streams
// in. A follow-up question changes the answer on screen, and anything the
// user has picked in it (a filter, a form field) stays as it was.
import { useEffect, useMemo, useRef, useState } from "react";
import { JSONUIProvider, Renderer, createStateStore, useUIStream } from "@json-render/react";
import { handlers, registry } from "./registry";
import { whenDiscountRequested, type DiscountRequest } from "./actions";
import { DiscountDialog } from "../components/DiscountDialog";

// Copies the starting values Claude sets for filters and form fields into
// the answer's state. A value is only copied when it's new or Claude has
// changed it, so a follow-up never undoes what the user picked.
function useStartingValues(state: Record<string, unknown> | undefined, store: ReturnType<typeof createStateStore>) {
  const copied = useRef(new Map<string, string>());
  useEffect(() => {
    for (const [group, values] of Object.entries(state ?? {})) {
      if (!values || typeof values !== "object") continue;
      for (const [name, value] of Object.entries(values)) {
        const path = `/${group}/${name}`;
        if (copied.current.get(path) === JSON.stringify(value)) continue;
        copied.current.set(path, JSON.stringify(value));
        store.set(path, value);
      }
    }
  }, [state, store]);
  return () => copied.current.clear();
}

export function AskPanel({ onClose }: { onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string[]>([]);
  const [discount, setDiscount] = useState<(DiscountRequest & { title: string }) | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const { spec, isStreaming, error, send, clear } = useUIStream({ api: "/api/ask" });
  const store = useMemo(() => createStateStore({}), []);
  const forgetStartingValues = useStartingValues(spec?.state, store);
  // There's an answer to draw once its root element has arrived.
  const hasAnswer = Boolean(spec?.root && spec.elements?.[spec.root]);
  // How many lines of the answer Doorlist's checks left out (see checkedLines).
  const leftOut = Number((spec?.state?.doorlist as { leftOut?: number } | undefined)?.leftOut ?? 0);

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

  function ask() {
    if (!question.trim()) return;
    setAsked((a) => [...a, question]);
    setCreated(null);
    setQuestion("");
    // With an answer on screen, the question is a follow-up that changes it.
    void send(question, { previousSpec: hasAnswer ? spec : undefined });
  }

  function startAgain() {
    clear();
    setAsked([]);
    setCreated(null);
    forgetStartingValues();
    store.update({ "/filters": {}, "/form": {} });
  }

  return (
    <aside className="drawer" aria-label="Ask Doorlist">
      <div className="drawer-head">
        <h2>Ask Doorlist</h2>
        <div className="row">
          {asked.length > 0 && <button className="button secondary" onClick={startAgain} disabled={isStreaming}>Start again</button>}
          <button className="button secondary" onClick={onClose}>Close</button>
        </div>
      </div>
      <div className="drawer-body">
        {asked.map((q, i) => <div key={i} className="question">{q}</div>)}
        {isStreaming && !spec?.root && <div className="thinking">Working it out…</div>}
        {error && <div className="answer-text">Ask couldn't get an answer just now ({error.message}). Try again in a moment.</div>}
        {!isStreaming && !error && asked.length > 0 && !hasAnswer && (
          <div className="answer-text">I couldn't put an answer together for that one. Try asking it another way.</div>
        )}
        {hasAnswer && (
          <JSONUIProvider registry={registry} store={store} handlers={handlers(() => undefined, () => ({}))}>
            <Renderer spec={spec} registry={registry} loading={isStreaming} />
          </JSONUIProvider>
        )}
        {!isStreaming && hasAnswer && leftOut > 0 && (
          <p className="part-note">
            Doorlist left out {leftOut === 1 ? "one part" : `${leftOut} parts`} of this answer that it couldn't show.
          </p>
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
      <form className="drawer-foot" onSubmit={(e) => { e.preventDefault(); ask(); }}>
        <input aria-label="Question" placeholder={hasAnswer ? "Ask a follow-up…" : "Ask about your shows…"} value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button className="button" disabled={isStreaming}>Ask</button>
      </form>
    </aside>
  );
}
