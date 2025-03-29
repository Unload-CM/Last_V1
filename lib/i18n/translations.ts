'use client';

import { useState, useCallback } from 'react';

type Language = 'ko' | 'th' | 'en';

interface TranslationsType {
  [key: string]: {
    [key: string]: string;
  };
}

const DEFAULT_TRANSLATIONS: TranslationsType = {
  ko: {
    'employees.title': '직원 관리',
    'employees.addTitle': '새 직원 등록',
    'employees.requiredFieldsNote': '* 표시는 필수 입력 항목입니다',
    'employees.id': '사번',
    'employees.name': '이름',
    'employees.department': '부서',
    'employees.thaiName': '태국어 이름',
    'employees.nickname': '닉네임',
    'employees.isThai': '태국인 여부',
    'employees.isThaiDescription': '태국 국적 직원인 경우 체크해주세요',
    'employees.namePlaceholder': '이름을 입력하세요',
    'employees.departmentPlaceholder': '부서를 선택하세요',
    'employees.searchPlaceholder': '사원번호, 이름, 부서, 태국어 이름으로 검색',
    'employees.addNew': '직원 추가',
    'employees.noEmployees': '등록된 직원이 없습니다',
    'employees.actions': '관리',
    'common.add': '추가',
    'common.cancel': '취소',
    'issues.pleaseEnterComment': '댓글을 입력하세요'
  },
  th: {
    'employees.title': 'จัดการพนักงาน',
    'employees.addTitle': 'เพิ่มพนักงานใหม่',
    'employees.requiredFieldsNote': '* จำเป็นต้องกรอก',
    'employees.id': 'รหัสพนักงาน',
    'employees.name': 'ชื่อ',
    'employees.department': 'แผนก',
    'employees.thaiName': 'ชื่อภาษาไทย',
    'employees.nickname': 'ชื่อเล่น',
    'employees.isThai': 'พนักงานไทย',
    'employees.isThaiDescription': 'เลือกถ้าเป็นพนักงานสัญชาติไทย',
    'employees.namePlaceholder': 'กรุณากรอกชื่อ',
    'employees.departmentPlaceholder': 'กรุณาเลือกแผนก',
    'employees.searchPlaceholder': 'ค้นหาด้วยรหัสพนักงาน ชื่อ แผนก หรือชื่อไทย',
    'employees.addNew': 'เพิ่มพนักงาน',
    'employees.noEmployees': 'ไม่มีพนักงาน',
    'employees.actions': 'จัดการ',
    'common.add': 'เพิ่ม',
    'common.cancel': 'ยกเลิก',
    'issues.pleaseEnterComment': 'กรุณาใส่ข้อความ'
  },
  en: {
    'issues.pleaseEnterComment': 'Please enter a comment'
  }
};

let currentLanguage: Language = 'ko';

export function setLanguage(lang: Language) {
  currentLanguage = lang;
}

export function t(key: string): string {
  const translation = DEFAULT_TRANSLATIONS[currentLanguage]?.[key];
  if (!translation) {
    console.warn(`Missing translation for key: ${key} in language: ${currentLanguage}`);
    return key.split('.').pop() || key;
  }
  return translation;
}

// 부서 번역 데이터 (한국어)
export const departmentTranslations = {
  'production': '생산부',
  'quality': '품질관리부',
  'logistics': '물류창고',
  'engineering': '연구개발부',
  'management': '경영지원부',
  'entertainment': '오락부'
};

// 부서 태국어 번역 데이터
export const departmentTranslationsThai = {
  'production': 'แผนกผลิต',
  'quality': 'แผนกควบคุมคุณภาพ',
  'logistics': 'คลังสินค้า',
  'engineering': 'แผนกวิจัยและพัฒนา',
  'management': 'แผนกบริหาร',
  'entertainment': 'แผนกสันทนาการ',
  '생산부': 'แผนกผลิต',
  '품질관리부': 'แผนกควบคุมคุณภาพ',
  '물류창고': 'คลังสินค้า',
  '연구개발부': 'แผนกวิจัยและพัฒนา',
  '경영지원부': 'แผนกบริหาร',
  '오락부': 'แผนกสันทนาการ'
};

// 부서 영어 키로 변환
export const departmentToKey: Record<string, string> = {
  '생산부': 'production',
  '품질관리부': 'quality',
  '물류창고': 'logistics',
  '연구개발부': 'engineering',
  '경영지원부': 'management',
  '오락부': 'entertainment'
};

// 직책 번역 데이터 (한국어)
export const positionTranslations = {
  'manager': '관리자',
  'employee': '사원',
  'director': '이사',
  'assistant': '보조'
};

// 직책 태국어 번역 데이터
export const positionTranslationsThai = {
  'manager': 'ผู้จัดการ',
  'employee': 'พนักงาน',
  'director': 'กรรมการ',
  'assistant': 'ผู้ช่วย'
};

// 직책 영어 키로 변환
export const positionToKey: Record<string, string> = {
  '관리자': 'manager',
  '사원': 'employee',
  '이사': 'director',
  '보조': 'assistant'
};

// 직원 관리 페이지 번역
export const employeeTranslations = {
  'title': '사원 관리',
  'addNew': '신규 등록',
  'searchPlaceholder': '사원번호, 이름, 부서, 태국어 이름으로 검색',
  'employeeId': '사원번호로 검색',
  'id': '사원번호',
  'name': '이름',
  'department': '부서',
  'position': '직책',
  'contact': '연락처',
  'email': '이메일',
  'actions': '관리',
  'editTitle': '사원 정보 수정',
  'addTitle': '신규 사원 등록',
  'requiredFieldsNote': '* 표시된 항목은 필수 입력 사항입니다.',
  'namePlaceholder': '이름을 입력하세요',
  'departmentPlaceholder': '부서 선택',
  'positionPlaceholder': '직책 선택',
  'contactPlaceholder': '010-0000-0000',
  'emailPlaceholder': 'example@tcm.com',
  'requiredFields': '이름, 부서, 직책은 필수 입력 항목입니다.',
  'fetchError': '사원 목록을 불러오는데 실패했습니다.',
  'confirmDelete': '정말 삭제하시겠습니까?',
  'deleteSuccess': '사원이 삭제되었습니다.',
  'deleteFailed': '사원 삭제에 실패했습니다.',
  'updateSuccess': '수정되었습니다.',
  'createSuccess': '등록되었습니다.',
  'saveFailed': '저장에 실패했습니다.'
};

// 직원 관리 페이지 태국어 번역
export const employeeTranslationsThai = {
  'title': 'จัดการพนักงาน',
  'addNew': 'เพิ่มพนักงานใหม่',
  'searchPlaceholder': 'ค้นหาตามชื่อ แผนก ตำแหน่ง',
  'id': 'รหัสพนักงาน',
  'name': 'ชื่อ',
  'department': 'แผนก',
  'position': 'ตำแหน่ง',
  'contact': 'ติดต่อ',
  'email': 'อีเมล',
  'actions': 'จัดการ',
  'editTitle': 'แก้ไขข้อมูลพนักงาน',
  'addTitle': 'เพิ่มพนักงานใหม่',
  'requiredFieldsNote': '* ช่องที่จำเป็นต้องกรอก',
  'namePlaceholder': 'กรอกชื่อ',
  'departmentPlaceholder': 'เลือกแผนก',
  'positionPlaceholder': 'เลือกตำแหน่ง',
  'contactPlaceholder': '000-000-0000',
  'emailPlaceholder': 'example@tcm.com',
  'requiredFields': 'กรุณากรอกชื่อ แผนก และตำแหน่ง',
  'fetchError': 'ไม่สามารถโหลดรายชื่อพนักงานได้',
  'confirmDelete': 'คุณแน่ใจหรือไม่ที่จะลบ?',
  'deleteSuccess': 'ลบพนักงานเรียบร้อยแล้ว',
  'deleteFailed': 'ไม่สามารถลบพนักงานได้',
  'updateSuccess': 'อัปเดตข้อมูลเรียบร้อยแล้ว',
  'createSuccess': 'เพิ่มพนักงานเรียบร้อยแล้ว',
  'saveFailed': 'ไม่สามารถบันทึกข้อมูลได้'
};

// 공통 번역
export const commonTranslations = {
  'edit': '수정',
  'delete': '삭제',
  'cancel': '취소',
  'add': '등록',
  'update': '수정',
  'processing': '처리 중...'
};

// 공통 태국어 번역
export const commonTranslationsThai = {
  'edit': 'แก้ไข',
  'delete': 'ลบ',
  'cancel': 'ยกเลิก',
  'add': 'เพิ่ม',
  'update': 'อัปเดต',
  'processing': 'กำลังประมวลผล...'
};

/**
 * 한글 이름을 영어 키로 변환하는 유틸리티 함수
 */
export function convertToEnglishKey(koreanName: string, type: 'department' | 'position' | 'status' | 'priority' | 'category'): string {
  if (!koreanName) return '';
  
  let result = '';
  
  switch (type) {
    case 'department':
      result = departmentToKey[koreanName] || koreanName.toLowerCase().replace(/\s+/g, '_');
      break;
    case 'position':
      result = positionToKey[koreanName] || koreanName.toLowerCase().replace(/\s+/g, '_');
      break;
    default:
      result = koreanName.toLowerCase().replace(/\s+/g, '_');
  }
  
  return result;
}

/**
 * 부서 이름 번역 함수
 */
export function translateDepartment(key: string, language: string = 'ko'): string {
  if (language === 'th') {
    return departmentTranslationsThai[key] || key;
  }
  return departmentTranslations[key] || key;
}

/**
 * 직책 번역 함수
 */
export function translatePosition(key: string, language: string = 'ko'): string {
  if (language === 'th') {
    return positionTranslationsThai[key] || key;
  }
  return positionTranslations[key] || key;
}

// 상태 번역 데이터 (한국어)
export const statusTranslations = {
  'open': '열림',
  'in_progress': '진행 중',
  'resolved': '해결됨',
  'closed': '종료',
  'abandoned': '포기',
  'perfection': '완벽함'
};

// 상태 태국어 번역 데이터
export const statusTranslationsThai = {
  'open': 'เปิด',
  'in_progress': 'กำลังดำเนินการ',
  'resolved': 'แก้ไขแล้ว',
  'closed': 'ปิด',
  'abandoned': 'ยกเลิก',
  'perfection': 'ความสมบูรณ์แบบ'
};

// 상태 영어 키로 변환
export const statusToKey: Record<string, string> = {
  '열림': 'open',
  '진행 중': 'in_progress',
  '해결됨': 'resolved',
  '종료': 'closed',
  '포기': 'abandoned',
  '완벽함': 'perfection'
};

// 우선순위 번역 데이터 (한국어)
export const priorityTranslations = {
  'critical': '심각',
  'high': '높음',
  'medium': '중간',
  'low': '낮음',
  'urgent': '조지금'
};

// 우선순위 태국어 번역 데이터
export const priorityTranslationsThai = {
  'critical': 'วิกฤต',
  'high': 'สูง',
  'medium': 'กลาง',
  'low': 'ต่ำ',
  'urgent': 'เร่งด่วน'
};

// 우선순위 영어 키로 변환
export const priorityToKey: Record<string, string> = {
  '심각': 'critical',
  '높음': 'high',
  '중간': 'medium',
  '낮음': 'low',
  '조지금': 'urgent'
};

// 카테고리 번역 데이터 (한국어)
export const categoryTranslations = {
  'equipment': '설비',
  'software_error': '소프트웨어 오류',
  'inventory_shortage': '재고 부족',
  'quality_issue': '품질 문제',
  'safety_issue': '안전 문제',
  'raw_material': '원자재',
  'prediction': '예측시',
  'production_management': '생산관리',
  'quality_management': '품질관리',
  'inventory_management': '재고관리'
};

// 카테고리 태국어 번역 데이터
export const categoryTranslationsThai = {
  'equipment': 'อุปกรณ์',
  'software_error': 'ข้อผิดพลาดซอฟต์แวร์',
  'inventory_shortage': 'สินค้าคงคลังขาด',
  'quality_issue': 'ปัญหาคุณภาพ',
  'safety_issue': 'ปัญหาความปลอดภัย',
  'raw_material': 'วัตถุดิบ',
  'prediction': 'การพยากรณ์',
  'production_management': 'การจัดการการผลิต',
  'quality_management': 'การจัดการคุณภาพ',
  'inventory_management': 'การจัดการสินค้าคงคลัง'
};

// 카테고리 영어 키로 변환
export const categoryToKey: Record<string, string> = {
  '설비': 'equipment',
  '소프트웨어 오류': 'software_error',
  '재고 부족': 'inventory_shortage',
  '품질 문제': 'quality_issue',
  '안전 문제': 'safety_issue',
  '원자재': 'raw_material',
  '예측시': 'prediction',
  '생산관리': 'production_management',
  '품질관리': 'quality_management',
  '재고관리': 'inventory_management',
  '에폭시': 'epoxy'
};

/**
 * 번역을 추가하는 함수
 */
export async function addTranslation(key: string, name: string, type: string) {
  try {
    // 한국어 번역 추가
    const koreanTranslation = await fetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        language: 'ko',
        translation: name,
        category: type
      }),
    });

    if (!koreanTranslation.ok) {
      throw new Error('한국어 번역 추가 실패');
    }

    // 태국어 번역 추가
    const thaiTranslation = await fetch('/api/translations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        language: 'th',
        translation: name,
        category: type
      }),
    });

    if (!thaiTranslation.ok) {
      throw new Error('태국어 번역 추가 실패');
    }

    return true;
  } catch (error) {
    console.error('번역 추가 중 오류:', error);
    throw error;
  }
} 