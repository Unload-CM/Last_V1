-- 1️⃣ 임시 컬럼을 이용해 name과 label 값 교환
UPDATE "Category" SET name = label, label = name WHERE name IS NOT NULL AND label IS NOT NULL;
UPDATE "Department" SET name = label, label = name WHERE name IS NOT NULL AND label IS NOT NULL;
UPDATE "Priority" SET name = label, label = name WHERE name IS NOT NULL AND label IS NOT NULL;
UPDATE "Status" SET name = label, label = name WHERE name IS NOT NULL AND label IS NOT NULL;

TRUNCATE TABLE "Employee" RESTART IDENTITY CASCADE;

