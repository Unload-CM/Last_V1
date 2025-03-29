const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('기존 카테고리 삭제 중...');
    // 기존 카테고리 삭제
    await prisma.category.deleteMany({});
    
    console.log('4M 체계의 카테고리 생성 중...');
    
    // 4M 체계의 카테고리 생성
    const categories = [
      {
        name: "man",
        label: "Man(인력)",
        thaiLabel: "คน",
        description: "인력과 관련된 문제",
        thaiDescription: "ปัญหาที่เกี่ยวข้องกับบุคลากร"
      },
      {
        name: "machine",
        label: "Machine(설비)",
        thaiLabel: "เครื่องจักร",
        description: "설비와 관련된 문제",
        thaiDescription: "ปัญหาที่เกี่ยวข้องกับเครื่องจักรและอุปกรณ์"
      },
      {
        name: "material",
        label: "Material(자재)",
        thaiLabel: "วัสดุ",
        description: "자재와 관련된 문제",
        thaiDescription: "ปัญหาที่เกี่ยวข้องกับวัสดุและวัตถุดิบ"
      },
      {
        name: "method",
        label: "Method(방법)",
        thaiLabel: "วิธีการ",
        description: "방법과 관련된 문제",
        thaiDescription: "ปัญหาที่เกี่ยวข้องกับวิธีการและกระบวนการ"
      }
    ];
    
    // 카테고리 추가
    for (const category of categories) {
      await prisma.category.create({
        data: category
      });
      console.log(`카테고리 "${category.label}" 추가됨`);
    }
    
    // 카테고리 확인
    const updatedCategories = await prisma.category.findMany();
    console.log('\n업데이트된 카테고리 목록:');
    console.table(updatedCategories);
    
    console.log('\n4M 체계 카테고리 업데이트 완료!');
  } catch (error) {
    console.error('카테고리 업데이트 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 