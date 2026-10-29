-- How many incident reports mention each substance class?
-- One report can mention several classes, so these add up to more than the number of reports.
SELECT
    material_class,
    COUNT(DISTINCT dgir_number) AS reports
FROM incident_materials
GROUP BY material_class
ORDER BY reports DESC, material_class;
