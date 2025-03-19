// 기존 데이터를 새로운 형식으로 마이그레이션하는 스크립트
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateData() {
  try {
    console.log('데이터 마이그레이션을 시작합니다...');

    // 1. Status 데이터 마이그레이션
    const statuses = await prisma.status.findMany();
    console.log(`${statuses.length}개의 상태 데이터를 마이그레이션합니다.`);

    for (const status of statuses) {
      // 대문자를 소문자로 변환하고 언더스코어 유지
      const newName = status.name.toLowerCase();
      
      // Translation 테이블에 번역 데이터 추가
      await prisma.translation.upsert({
        where: {
          key_language: {
            key: `status.${newName}`,
            language: 'ko'
          }
        },
        update: {
          translation: status.label
        },
        create: {
          key: `status.${newName}`,
          language: 'ko',
          translation: status.label,
          category: 'status'
        }
      });

      // 설명이 있는 경우 설명도 번역 테이블에 추가
      if (status.description) {
        await prisma.translation.upsert({
          where: {
            key_language: {
              key: `status.${newName}.description`,
              language: 'ko'
            }
          },
          update: {
            translation: status.description
          },
          create: {
            key: `status.${newName}.description`,
            language: 'ko',
            translation: status.description,
            category: 'status_description'
          }
        });
      }

      // Status 테이블 업데이트
      await prisma.status.update({
        where: { id: status.id },
        data: {
          name: newName,
          // label과 description은 그대로 유지
        }
      });

      console.log(`상태 "${status.name}" → "${newName}" 마이그레이션 완료`);
    }

    // 2. Priority 데이터 마이그레이션
    const priorities = await prisma.priority.findMany();
    console.log(`${priorities.length}개의 우선순위 데이터를 마이그레이션합니다.`);

    for (const priority of priorities) {
      // 대문자를 소문자로 변환하고 언더스코어 유지
      const newName = priority.name.toLowerCase();
      
      // Translation 테이블에 번역 데이터 추가
      await prisma.translation.upsert({
        where: {
          key_language: {
            key: `priority.${newName}`,
            language: 'ko'
          }
        },
        update: {
          translation: priority.label
        },
        create: {
          key: `priority.${newName}`,
          language: 'ko',
          translation: priority.label,
          category: 'priority'
        }
      });

      // 설명이 있는 경우 설명도 번역 테이블에 추가
      if (priority.description) {
        await prisma.translation.upsert({
          where: {
            key_language: {
              key: `priority.${newName}.description`,
              language: 'ko'
            }
          },
          update: {
            translation: priority.description
          },
          create: {
            key: `priority.${newName}.description`,
            language: 'ko',
            translation: priority.description,
            category: 'priority_description'
          }
        });
      }

      // Priority 테이블 업데이트
      await prisma.priority.update({
        where: { id: priority.id },
        data: {
          name: newName,
          // label과 description은 그대로 유지
        }
      });

      console.log(`우선순위 "${priority.name}" → "${newName}" 마이그레이션 완료`);
    }

    console.log('데이터 마이그레이션이 성공적으로 완료되었습니다.');
  } catch (error) {
    console.error('데이터 마이그레이션 중 오류가 발생했습니다:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData(); 