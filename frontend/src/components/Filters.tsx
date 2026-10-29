import { DEFAULT_FILTERS, categoryOptions, yearOptions } from "../lib/filters";
import type { CountRow, Filters as FilterValues, Meta } from "../types";

type Option = { value: string; label: string };

type SelectFieldProps = {
  id: string;
  label: string;
  allLabel: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

function SelectField(props: SelectFieldProps) {
  return (
    <div className="field">
      <label htmlFor={props.id}>{props.label}</label>
      <select
        id={props.id}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      >
        <option value="">{props.allLabel}</option>
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function asOptions(labels: string[]): Option[] {
  return labels.map((label) => ({ value: label, label }));
}

type FiltersProps = {
  meta: Meta;
  counts: CountRow[];
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
};

function Filters({ meta, counts, filters, onChange }: FiltersProps) {
  function update(key: keyof FilterValues, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <form
      className="filters"
      aria-label="Filters"
      onSubmit={(event) => event.preventDefault()}
    >
      <SelectField
        id="filter-year"
        label="Year"
        allLabel="All years"
        value={filters.year}
        options={yearOptions(meta)}
        onChange={(value) => update("year", value)}
      />
      <SelectField
        id="filter-region"
        label="Region"
        allLabel="All regions"
        value={filters.region}
        options={asOptions(categoryOptions(counts, "region"))}
        onChange={(value) => update("region", value)}
      />
      <SelectField
        id="filter-sector"
        label="Sector"
        allLabel="All sectors"
        value={filters.sector}
        options={asOptions(categoryOptions(counts, "sector"))}
        onChange={(value) => update("sector", value)}
      />
      <SelectField
        id="filter-event-type"
        label="Event type"
        allLabel="All event types"
        value={filters.eventType}
        options={asOptions(categoryOptions(counts, "event_type"))}
        onChange={(value) => update("eventType", value)}
      />
      <button type="button" onClick={() => onChange(DEFAULT_FILTERS)}>
        Reset filters
      </button>
    </form>
  );
}

export default Filters;
