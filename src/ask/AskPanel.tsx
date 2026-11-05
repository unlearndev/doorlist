// The Ask panel: staff type a question about their shows and Claude answers.
// This first version shows the answer as plain text.
import { useState } from "react";

export function AskPanel({ onClose }: { onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask() {
    if (!question.trim()) return;
    setAsked(question);
    setAnswer("");
    setBusy(true);
    const res = await fetch("/api/ask", { method: "POST", body: JSON.stringify({ question }) });
    const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      setAnswer((a) => a + value);
    }
    setBusy(false);
    setQuestion("");
  }

  return (
    <aside className="drawer" aria-label="Ask Doorlist">
      <div className="drawer-head">
        <h2>Ask Doorlist</h2>
        <button className="button secondary" onClick={onClose}>Close</button>
      </div>
      <div className="drawer-body">
        {asked && <div className="question">{asked}</div>}
        {busy && !answer && <div className="thinking">Working it out…</div>}
        <div className="answer-text">{answer}</div>
      </div>
      <form className="drawer-foot" onSubmit={(e) => { e.preventDefault(); void ask(); }}>
        <input aria-label="Question" placeholder="Ask about your shows…" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button className="button" disabled={busy}>Ask</button>
      </form>
    </aside>
  );
}
