import { useState } from "react";
import type { Staff } from "../session";

export function SignIn({ onSignedIn }: { onSignedIn: (staff: Staff) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const res = await fetch("/api/sign-in", { method: "POST", body: JSON.stringify({ email, password }) });
    const body = await res.json();
    if (!res.ok) return setError(body.error);
    onSignedIn(body);
  }

  return (
    <div className="sign-in">
      <form className="card sign-in-card" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <div className="brand dark">
          <img className="brand-mark" src="/favicon.svg" alt="" /> Doorlist
        </div>
        <p className="muted">The Kestrel Rooms, Leeds</p>
        <label>
          Email
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="button">Sign in</button>
      </form>
    </div>
  );
}
