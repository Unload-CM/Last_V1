// 카테고리 키값 마이그레이션 스크립트
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 한글 -> 영문 매핑 테이블
const koreanToEnglishMap = {
  '에폭시문제': 'epoxy_problem',
  '에폭시': 'epoxy_problem',
  '설비': 'equipment',
  '원자재': 'raw_material',
  '관리': 'management',
  '품질': 'quality_issue',
  '안전': 'safety_issue',
  '소프트웨어': 'software_error',
  '재고부족': 'inventory_shortage'
};

async function migrateCategoryKeys() {
  try {
    console.log('카테고리 키값 마이그레이션을 시작합니다...');

    // 모든 카테고리 조회
    const categories = await prisma.category.findMany();
    console.log(`${categories.length}개의 카테고리를 마이그레이션합니다.`);

    for (const category of categories) {
      // 이미 의미 있는 영문 키값인지 확인
      const isProperEnglishKey = /^[a-z][a-z0-9_]*$/.test(category.name) && 
                                 category.name !== 'category_6' && 
                                 !category.name.startsWith('category_');
      
      if (!isProperEnglishKey) {
        console.log(`의미 없는 키값 발견: "${category.name}"`);
        
        // Translation 테이블에서 해당 카테고리의 한글 번역 조회
        let koreanName = '';
        const translation = await prisma.translation.findFirst({
          where: {
            OR: [
              { key: `issue_category.${category.name}` },
              { key: `category.${category.name}` }
            ],
            language: 'ko'
          }
        });
        
        if (translation) {
          koreanName = translation.translation;
        }
        
        // 한글 이름을 영문 키값으로 변환
        let englishKey = '';
        
        // 매핑 테이블에서 찾기
        if (koreanName && koreanToEnglishMap[koreanName]) {
          englishKey = koreanToEnglishMap[koreanName];
        } 
        // 직접 매핑 (category_6 -> epoxy_problem)
        else if (category.name === 'category_6' || category.name === '') {
          englishKey = 'epoxy_problem';
        }
        // 일반적인 변환 로직
        else {
          // 한글 이름이 없으면 카테고리 이름 사용
          const nameToConvert = koreanName || category.name;
          
          // 매핑 테이블에서 찾기
          for (const [korean, english] of Object.entries(koreanToEnglishMap)) {
            if (nameToConvert.includes(korean)) {
              englishKey = english;
              break;
            }
          }
          
          // 매핑 테이블에 없으면 기본 변환
          if (!englishKey) {
            englishKey = nameToConvert
              .replace(/\s+/g, '_')
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, '');
            
            // 빈 문자열이 되면 기본값 설정
            if (!englishKey) {
              englishKey = 'category_' + category.id;
            }
          }
        }
        
        console.log(`변환: "${category.name}" → "${englishKey}" (한글: "${koreanName}")`);
        
        // 기존 Translation 항목 삭제
        await prisma.translation.deleteMany({
          where: {
            OR: [
              { key: `issue_category.${category.name}` },
              { key: `category.${category.name}` }
            ]
          }
        });
        
        // 설명 번역 항목도 삭제
        await prisma.translation.deleteMany({
          where: {
            OR: [
              { key: `category_description.${category.name}.description` },
              { key: `category.${category.name}.description` }
            ]
          }
        });
        
        // 새 Translation 항목 추가
        await prisma.translation.create({
          data: {
            key: `category.${englishKey}`,
            language: 'ko',
            translation: koreanName || '에폭시 문제', // 한글 이름이 없으면 기본값 설정
            category: 'issue_category'
          }
        });
        
        // 설명이 있는 경우 설명도 번역 테이블에 추가
        if (category.description) {
          await prisma.translation.create({
            data: {
              key: `category.${englishKey}.description`,
              language: 'ko',
              translation: category.description,
              category: 'category_description'
            }
          });
        }
        
        // 카테고리 테이블 업데이트
        await prisma.category.update({
          where: { id: category.id },
          data: {
            name: englishKey
          }
        });
        
        console.log(`카테고리 "${category.name}" 마이그레이션 완료`);
      } else {
        console.log(`이미 적절한 영문 키값: "${category.name}" - 변환 불필요`);
      }
    }

    console.log('카테고리 키값 마이그레이션이 성공적으로 완료되었습니다.');
  } catch (error) {
    console.error('마이그레이션 중 오류가 발생했습니다:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateCategoryKeys(); 