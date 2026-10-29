-- How many incident reports were made each month?
-- Reports without a usable incident date are left out and counted in data_quality.sql.
WITH dated AS (
    SELECT
        dgir_number,
        strftime(incident_date, '%Y-%m') AS month
    FROM incidents
    WHERE date_status = 'usable'
)
SELECT
    month,
    COUNT(DISTINCT dgir_number) AS reports
FROM dated
GROUP BY month
ORDER BY month;
