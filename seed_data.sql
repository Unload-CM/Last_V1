-- 부서 데이터 삽입
INSERT INTO departments (name, label, "createdAt", "updatedAt", "thaiLabel")
VALUES 
  ('MANAGEMENT', '경영부', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'แผนกบริหาร'),
  ('ADMIN', '관리부', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'แผนกธุรการ'),
  ('PRODUCTION', '생산부', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'แผนกการผลิต'),
  ('QUALITY', '품질부', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'แผนกควบคุมคุณภาพ'),
  ('FACILITY', '설비부', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'แผนกซ่อมบำรุง'),
  ('SUPPORT', '지원부', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'แผนกสนับสนุน'),
  ('MATERIAL', '자재부', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'แผนกวัสดุ')
ON CONFLICT (name) DO NOTHING;

-- 상태 데이터 삽입
INSERT INTO statuses (name, label, "createdAt", "updatedAt", "thaiLabel")
VALUES 
  ('OPEN', '미해결', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ยังไม่ได้แก้ไข'),
  ('IN_PROGRESS', '진행중', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'กำลังดำเนินการ'),
  ('RESOLVED', '해결됨', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'แก้ไขแล้ว'),
  ('CLOSED', '종료', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ปิด')
ON CONFLICT (name) DO NOTHING;

-- 우선순위 데이터 삽입
INSERT INTO priorities (name, label, "createdAt", "updatedAt", "thaiLabel")
VALUES 
  ('CRITICAL', '심각', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'วิกฤต'),
  ('HIGH', '높음', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'สูง'),
  ('MEDIUM', '중간', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ปานกลาง'),
  ('LOW', '낮음', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ต่ำ')
ON CONFLICT (name) DO NOTHING;

-- 카테고리 데이터 삽입
INSERT INTO categories (name, label, "createdAt", "updatedAt", "thaiLabel")
VALUES 
  ('MACHINERY', '기계 고장', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'เครื่องจักรเสีย'),
  ('QUALITY', '품질 문제', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ปัญหาคุณภาพ'),
  ('SAFETY', '안전 문제', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ปัญหาความปลอดภัย'),
  ('MATERIAL', '자재 부족', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ขาดวัสดุ'),
  ('OTHER', '기타', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'อื่นๆ')
ON CONFLICT (name) DO NOTHING;

-- 관리자 계정 생성
INSERT INTO employees ("employeeId", "koreanName", "isAdmin", "departmentId", "createdAt", "updatedAt", "password")
VALUES 
  ('admin', '관리자', TRUE, (SELECT id FROM departments WHERE name = 'MANAGEMENT'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '0000'),
  ('KIM001', '김철수', TRUE, (SELECT id FROM departments WHERE name = 'PRODUCTION'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '0000')
ON CONFLICT ("employeeId") DO NOTHING; 