import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { DEFAULT_FILTERS } from "./lib/filters";
import { loadSiteData } from "./lib/loadData";
import AboutData from "./pages/AboutData";
import Overview from "./pages/Overview";
import type { Filters, SiteData } from "./types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: SiteData };

function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  // Retry bumps this number, which runs the effect below again.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadSiteData()
      .then((data) => {
        if (!cancelled) setLoadState({ status: "ready", data });
      })
      .catch((error: Error) => {
        if (!cancelled)
          setLoadState({ status: "error", message: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function retry() {
    setLoadState({ status: "loading" });
    setAttempt(attempt + 1);
  }

  return (
    <>
      <Header />
      <main className="page">
        {loadState.status === "loading" && <p>Loading the report counts…</p>}
        {loadState.status === "error" && (
          <div role="alert" className="notice">
            <p>The data didn't load. {loadState.message}</p>
            <button type="button" onClick={retry}>
              Retry
            </button>
          </div>
        )}
        {loadState.status === "ready" && (
          <Routes>
            <Route
              path="/"
              element={
                <Overview
                  data={loadState.data}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              }
            />
            <Route
              path="/about"
              element={<AboutData data={loadState.data} />}
            />
          </Routes>
        )}
      </main>
      {loadState.status === "ready" && <Footer meta={loadState.data.meta} />}
    </>
  );
}

export default App;
