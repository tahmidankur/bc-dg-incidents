-- How many incident reports name each Ministry of Environment region?
-- NULL means the region was not recorded. Counts are not adjusted for population or activity.
SELECT
    region,
    COUNT(DISTINCT dgir_number) AS reports
FROM incidents
GROUP BY region
ORDER BY reports DESC, region NULLS LAST;
