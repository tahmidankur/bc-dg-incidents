import type { CountRow, MaterialCountRow, Meta, SiteData } from "../types";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path} (HTTP ${response.status}).`);
  }
  return (await response.json()) as T;
}

export async function loadSiteData(): Promise<SiteData> {
  const [counts, materialCounts, meta] = await Promise.all([
    fetchJson<CountRow[]>("/data/counts.json"),
    fetchJson<MaterialCountRow[]>("/data/material_counts.json"),
    fetchJson<Meta>("/data/meta.json"),
  ]);
  return { counts, materialCounts, meta };
}
