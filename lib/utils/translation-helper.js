const koreanToEnglishMap = {
  // 상태
  '열림': 'open',
  '진행중': 'in_progress',
  '진행 중': 'in_progress',
  '해결됨': 'resolved',
  '종료': 'closed',

  // 우선순위
  '심각': 'critical',
  '높음': 'high',
  '중간': 'medium',
  '낮음': 'low',

  // 부서
  '생산부': 'production',
  '품질관리부': 'quality',
  '물류창고': 'logistics',
  '연구개발부': 'engineering',
  '경영지원부': 'management',
  '경영지': 'management_support',

  // 직책
  '관리자': 'manager',
  '사원': 'employee',

  // 카테고리
  '설비': 'equipment',
  '소프트웨어 오류': 'software_error',
  '재고 부족': 'inventory_shortage',
  '품질 문제': 'quality_issue',
  '안전 문제': 'safety_issue',
  'Machine': 'machine',
  'Man': 'man',
  'Material': 'material',
  'Method': 'method'
};

const categoryMap = {
  '상태': 'status',
  '우선순위': 'priority',
  '부서': 'department',
  '직책': 'position',
  '카테고리': 'category'
};

/**
 * 한글 입력을 영문 키값으로 변환
 */
function convertKoreanToEnglishKey(korean, category) {
  const englishKey = koreanToEnglishMap[korean];
  if (!englishKey) {
    // 매핑되지 않은 한글인 경우, 로마자 변환 후 소문자와 언더스코어로 변환
    return korean
      .replace(/\s+/g, '_')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
  }
  return englishKey;
}

/**
 * 새로운 번역 데이터 생성
 */
async function createTranslationEntry(prisma, korean, englishKey, category) {
  const translationKey = `${categoryMap[category] || category}.${englishKey}`;
  
  try {
    await prisma.translation.create({
      data: {
        key: translationKey,
        language: 'ko',
        translation: korean,
        category: categoryMap[category] || category
      }
    });

    console.log(`번역 추가 완료: ${korean} -> ${englishKey}`);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log(`번역이 이미 존재합니다: ${korean}`);
    } else {
      console.error(`번역 생성 중 오류:`, error);
    }
  }
}

module.exports = {
  convertKoreanToEnglishKey,
  createTranslationEntry,
  koreanToEnglishMap,
  categoryMap
}; 