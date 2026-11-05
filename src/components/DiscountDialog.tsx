// Doorlist's own dialog for creating a discount code. Staff check the
// percentage here, and the server decides whether the code is created.
import { useState } from "react";

export function DiscountDialog({ showId, title, initialPercent = 10, onClose }: { showId: string; title: string; initialPercent?: number; onClose: (created?: string) => void }) {
  const [percent, setPercent] = useState(initialPercent);
  const [error, setError] = useState<string | null>(null);
  async function create() {
    setError(null);
    const res = await fetch(`/api/shows/${showId}/discounts`, { method: "POST", body: JSON.stringify({ percent }) });
    const body = await res.json();
    if (!res.ok) return setError(body.error);
    onClose(body.code);
  }
  return (
    <div className="dialog-backdrop">
      <div className="dialog" role="dialog" aria-label="Create a discount code">
        <h2>Discount code</h2>
        <p>For {title}</p>
        <label>
          Percent off
          <input type="number" value={percent} onChange={(e) => setPercent(Number(e.target.value))} />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button className="button secondary" onClick={() => onClose()}>Cancel</button>
          <button className="button" onClick={create}>Create code</button>
        </div>
      </div>
    </div>
  );
}
