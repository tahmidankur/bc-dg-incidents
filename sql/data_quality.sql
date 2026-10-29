-- How often is each field missing or unusable?
-- Every percentage uses the same denominator: all incident reports after cleaning.
WITH total AS (
    SELECT COUNT(*) AS all_reports FROM incidents
),
reports_with_class AS (
    SELECT DISTINCT dgir_number FROM incident_materials
),
issues AS (
    SELECT 1 AS position, 'Incident date' AS field, 'Not recorded' AS issue,
        COUNT(*) FILTER (WHERE date_status = 'missing') AS reports
    FROM incidents
    UNION ALL
    SELECT 2, 'Incident date', 'Not a valid date',
        COUNT(*) FILTER (WHERE date_status = 'unparseable')
    FROM incidents
    UNION ALL
    SELECT 3, 'Incident date', 'Before November 2020 or after the snapshot',
        COUNT(*) FILTER (WHERE date_status = 'out_of_range')
    FROM incidents
    UNION ALL
    SELECT 4, 'Location', 'Not recorded',
        COUNT(*) FILTER (WHERE location_status = 'missing')
    FROM incidents
    UNION ALL
    SELECT 5, 'Location', 'Not a valid coordinate',
        COUNT(*) FILTER (WHERE location_status = 'invalid')
    FROM incidents
    UNION ALL
    SELECT 6, 'Location', 'Outside the B.C. area',
        COUNT(*) FILTER (WHERE location_status = 'outside_bc')
    FROM incidents
    UNION ALL
    SELECT 7, 'Region', 'Not recorded',
        COUNT(*) FILTER (WHERE region IS NULL)
    FROM incidents
    UNION ALL
    SELECT 8, 'Sector', 'Not recorded',
        COUNT(*) FILTER (WHERE sector IS NULL)
    FROM incidents
    UNION ALL
    SELECT 9, 'Sector', 'Recorded as Unknown',
        COUNT(*) FILTER (WHERE sector = 'Unknown')
    FROM incidents
    UNION ALL
    SELECT 10, 'Event type', 'Not recorded',
        COUNT(*) FILTER (WHERE event_type IS NULL)
    FROM incidents
    UNION ALL
    SELECT 11, 'Event type', 'Recorded as Unknown',
        COUNT(*) FILTER (WHERE event_type = 'Unknown')
    FROM incidents
    UNION ALL
    SELECT 12, 'Substance class', 'Not recorded',
        COUNT(*) FILTER (WHERE dgir_number NOT IN (SELECT dgir_number FROM reports_with_class))
    FROM incidents
)
SELECT
    field,
    issue,
    reports,
    -- NULLIF gives NULL instead of dividing by zero when there are no reports.
    ROUND(100 * reports / NULLIF(all_reports, 0), 1) AS percent
FROM issues
CROSS JOIN total
ORDER BY position;
