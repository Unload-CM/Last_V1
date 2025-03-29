-- 부서 데이터 삽입
INSERT INTO departments (name, label, "createdAt", "updatedAt", "thaiLabel")
VALUES 
  ('MANAGEMENT', '경영부', NOW(), NOW(), 'แผนกบริหาร'),
  ('ADMIN', '관리부', NOW(), NOW(), 'แผนกธุรการ'),
  ('PRODUCTION', '생산부', NOW(), NOW(), 'แผนกการผลิต'),
  ('QUALITY', '품질부', NOW(), NOW(), 'แผนกควบคุมคุณภาพ'),
  ('FACILITY', '설비부', NOW(), NOW(), 'แผนกซ่อมบำรุง'),
  ('SUPPORT', '지원부', NOW(), NOW(), 'แผนกสนับสนุน'),
  ('MATERIAL', '자재부', NOW(), NOW(), 'แผนกวัสดุ')
ON CONFLICT (name) DO NOTHING;

-- 상태 데이터 삽입
INSERT INTO statuses (name, label, "createdAt", "updatedAt", "thaiLabel")
VALUES 
  ('OPEN', '미해결', NOW(), NOW(), 'ยังไม่ได้แก้ไข'),
  ('IN_PROGRESS', '진행중', NOW(), NOW(), 'กำลังดำเนินการ'),
  ('RESOLVED', '해결됨', NOW(), NOW(), 'แก้ไขแล้ว'),
  ('CLOSED', '종료', NOW(), NOW(), 'ปิด')
ON CONFLICT (name) DO NOTHING;

-- 우선순위 데이터 삽입
INSERT INTO priorities (name, label, "createdAt", "updatedAt", "thaiLabel")
VALUES 
  ('CRITICAL', '심각', NOW(), NOW(), 'วิกฤต'),
  ('HIGH', '높음', NOW(), NOW(), 'สูง'),
  ('MEDIUM', '중간', NOW(), NOW(), 'ปานกลาง'),
  ('LOW', '낮음', NOW(), NOW(), 'ต่ำ')
ON CONFLICT (name) DO NOTHING;

-- 카테고리 데이터 삽입
INSERT INTO categories (name, label, "createdAt", "updatedAt", "thaiLabel")
VALUES 
  ('MACHINERY', '기계 고장', NOW(), NOW(), 'เครื่องจักรเสีย'),
  ('QUALITY', '품질 문제', NOW(), NOW(), 'ปัญหาคุณภาพ'),
  ('SAFETY', '안전 문제', NOW(), NOW(), 'ปัญหาความปลอดภัย'),
  ('MATERIAL', '자재 부족', NOW(), NOW(), 'ขาดวัสดุ'),
  ('OTHER', '기타', NOW(), NOW(), 'อื่นๆ')
ON CONFLICT (name) DO NOTHING; 