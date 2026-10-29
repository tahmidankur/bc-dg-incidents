// Shapes of the JSON files written by `python -m pipeline build`.
// null always means the field was not recorded in the source.

export type CountRow = {
  month: string | null;
  region: string | null;
  sector: string | null;
  event_type: string | null;
  reports: number;
  reports_with_location: number;
};

export type MaterialCountRow = {
  year: number | null;
  region: string | null;
  sector: string | null;
  event_type: string | null;
  material_class: string;
  reports: number;
};

type QualityRow = {
  field: string;
  issue: string;
  reports: number;
  percent: number | null;
};

export type Meta = {
  source: {
    file: string;
    sha256: string;
    snapshot_date: string;
    catalogue_page: string;
    licence_title: string;
    licence_url: string;
  };
  system_start: string;
  location_box: { latitude: number[]; longitude: number[] };
  first_month: string;
  last_month: string;
  partial_months: string[];
  partial_years: number[];
  rows_read: number;
  incidents: number;
  excluded_rows: { reason: string; rows: number }[];
  conflicting_dgirs: number;
  totals: {
    monthly_counts: { month: string; reports: number }[];
    region_counts: { region: string | null; reports: number }[];
    category_counts: {
      category: "event_type" | "sector";
      value: string | null;
      reports: number;
    }[];
    material_mentions: { material_class: string; reports: number }[];
    data_quality: QualityRow[];
  };
};

export type SiteData = {
  counts: CountRow[];
  materialCounts: MaterialCountRow[];
  meta: Meta;
};

// An empty string means "All".
export type Filters = {
  year: string;
  region: string;
  sector: string;
  eventType: string;
};

export type LabelCount = {
  label: string;
  reports: number;
};
