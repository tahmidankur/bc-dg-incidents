-- How many reports fall in each combination of month, region, sector and event type?
-- The site adds these rows up to apply its filters, so it never needs individual reports.
WITH labelled AS (
    SELECT
        CASE WHEN date_status = 'usable' THEN strftime(incident_date, '%Y-%m') END AS month,
        region,
        sector,
        event_type,
        location_status = 'usable' AS has_usable_location
    FROM incidents
)
SELECT
    month,
    region,
    sector,
    event_type,
    COUNT(*) AS reports,
    COUNT(*) FILTER (WHERE has_usable_location) AS reports_with_location
FROM labelled
GROUP BY month, region, sector, event_type
ORDER BY month NULLS LAST, region NULLS LAST, sector NULLS LAST, event_type NULLS LAST;
