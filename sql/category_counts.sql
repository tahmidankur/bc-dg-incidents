-- How many incident reports fall under each event type and each sector?
-- "Unknown" is a value the reporter chose. NULL means the field was left blank.
WITH event_types AS (
    SELECT 'event_type' AS category, event_type AS value, COUNT(DISTINCT dgir_number) AS reports
    FROM incidents
    GROUP BY event_type
),
sectors AS (
    SELECT 'sector' AS category, sector AS value, COUNT(DISTINCT dgir_number) AS reports
    FROM incidents
    GROUP BY sector
)
SELECT * FROM event_types
UNION ALL
SELECT * FROM sectors
ORDER BY category, reports DESC, value NULLS LAST;
