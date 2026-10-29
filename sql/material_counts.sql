-- How many reports mention each substance class, split by year, region, sector and event type?
-- The site uses this to filter the substance class list the same way as the other charts.
WITH labelled AS (
    SELECT
        materials.material_class,
        CASE WHEN incidents.date_status = 'usable' THEN year(incidents.incident_date) END AS year,
        incidents.region,
        incidents.sector,
        incidents.event_type,
        incidents.dgir_number
    FROM incident_materials AS materials
    JOIN incidents USING (dgir_number)
)
SELECT
    year,
    region,
    sector,
    event_type,
    material_class,
    COUNT(DISTINCT dgir_number) AS reports
FROM labelled
GROUP BY year, region, sector, event_type, material_class
ORDER BY year NULLS LAST, region NULLS LAST, sector NULLS LAST, event_type NULLS LAST, material_class;
