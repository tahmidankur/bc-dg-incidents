import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import countsJson from "../public/data/counts.json";
import materialCountsJson from "../public/data/material_counts.json";
import metaJson from "../public/data/meta.json";
import App from "./App";
import { formatNumber } from "./lib/format";

const files: Record<string, unknown> = {
  "/data/counts.json": countsJson,
  "/data/material_counts.json": materialCountsJson,
  "/data/meta.json": metaJson,
};

beforeEach(() => {
  vi.stubGlobal("fetch", async (path: string) => ({
    ok: true,
    status: 200,
    json: async () => files[path],
  }));
  // Recharts measures its container, which jsdom can't do.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

// Vitest globals are off, so Testing Library can't clean up between tests by itself.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderApp(path = "/") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("Overview filters", () => {
  it("updates the summary when a region is picked and Reset restores it", async () => {
    renderApp();
    const region = (await screen.findByLabelText(
      "Region",
    )) as HTMLSelectElement;
    const allReports = `${formatNumber(metaJson.incidents)} reports match.`;
    expect(screen.getByText(allReports, { exact: false })).toBeTruthy();

    fireEvent.change(region, { target: { value: "Northern" } });
    const northern = metaJson.totals.region_counts.find(
      (row) => row.region === "Northern",
    )!;
    expect(
      screen.getByText(`${formatNumber(northern.reports)} reports match.`, {
        exact: false,
      }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Reset filters" })[0],
    );
    expect(region.value).toBe("");
    expect(screen.getByText(allReports, { exact: false })).toBeTruthy();
  });

  it("shows a retry button when the data fails to load", async () => {
    vi.stubGlobal("fetch", async () => ({ ok: false, status: 404 }));
    renderApp();
    expect(await screen.findByRole("button", { name: "Retry" })).toBeTruthy();
  });
});

describe("About the data", () => {
  it("shows the demo banner, file hash and counting steps from meta.json", async () => {
    renderApp("/about");
    expect(await screen.findByText(metaJson.source.sha256)).toBeTruthy();
    expect(
      screen.getByText("Demo with synthetic data", { exact: false }),
    ).toBeTruthy();
    expect(
      screen.getByRole("row", {
        name: `Incident reports counted on this site ${formatNumber(metaJson.incidents)}`,
      }),
    ).toBeTruthy();
  });
});
