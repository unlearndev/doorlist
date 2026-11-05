import { useEffect, useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { ShowPage } from "./pages/ShowPage";
import { SignIn } from "./pages/SignIn";
import { AskPanel } from "./ask/AskPanel";
import { ROLE_NAMES, SessionContext, type Staff } from "./session";

function useHashRoute() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const onChange = () => setHash(location.hash);
    addEventListener("hashchange", onChange);
    return () => removeEventListener("hashchange", onChange);
  }, []);
  return hash.replace(/^#\/?/, "");
}

export function App() {
  const route = useHashRoute();
  const [staff, setStaff] = useState<Staff | null | undefined>(undefined);
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => {
    fetch("/api/me").then(async (r) => setStaff(r.ok ? await r.json() : null));
  }, []);

  if (staff === undefined) return null;
  if (staff === null) return <SignIn onSignedIn={setStaff} />;

  async function signOut() {
    await fetch("/api/sign-out", { method: "POST" });
    setAskOpen(false);
    setStaff(null);
  }

  const open = (id: string) => (location.hash = `/shows/${id}`);
  const showId = route.startsWith("shows/") ? route.slice(6) : null;
  return (
    <SessionContext.Provider value={staff}>
      <div className={`app${askOpen ? " with-drawer" : ""}`}>
        <nav className="sidebar">
          <div className="brand">
            <img className="brand-mark" src="/favicon.svg" alt="" /> Doorlist
          </div>
          <div className="venue">The Kestrel Rooms, Leeds</div>
          <div className="nav" style={{ marginTop: 24 }}>
            <a href="#/">Shows</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setAskOpen(true); }}>Ask Doorlist</a>
          </div>
          <div className="who">
            <div>{staff.name}</div>
            <div className="venue">{ROLE_NAMES[staff.role]}</div>
            <button className="link" onClick={signOut}>Sign out</button>
          </div>
        </nav>
        <main className="main">{showId ? <ShowPage key={showId} id={showId} /> : <Dashboard onOpen={open} />}</main>
        {askOpen && <AskPanel onClose={() => setAskOpen(false)} />}
      </div>
    </SessionContext.Provider>
  );
}
