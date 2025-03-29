-- Issue 테이블에 createdById 열 추가
ALTER TABLE "Issue" ADD COLUMN "createdById" INTEGER;

-- createdById에 외래 키 제약 조건 추가
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- createdById에 인덱스 추가
CREATE INDEX "Issue_createdById_idx" ON "Issue"("createdById");

-- _prisma_migrations 테이블의 id 20250320022757_add_created_by 행 삭제
DELETE FROM "_prisma_migrations" WHERE id = '20250320022757_add_created_by'; 