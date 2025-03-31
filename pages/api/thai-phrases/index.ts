import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // HTTP 메소드에 따라 처리
  switch (req.method) {
    case 'GET':
      return getThaiPhrases(req, res);
    case 'POST':
      return createThaiPhrase(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// 태국어 문구 목록 조회
async function getThaiPhrases(req: NextApiRequest, res: NextApiResponse) {
  try {
    const phrases = await prisma.thaiPhrase.findMany({
      include: {
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return res.status(200).json(phrases);
  } catch (error) {
    console.error('태국어 문구 조회 중 오류:', error);
    return res.status(500).json({ 
      error: 'ไม่สามารถโหลดข้อความได้' // 문구를 불러올 수 없습니다
    });
  }
}

// 새로운 태국어 문구 추가
async function createThaiPhrase(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { text, tags } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: 'กรุณาใส่ข้อความ' // 문구를 입력해주세요
      });
    }

    // 태그 처리
    const tagObjects = await Promise.all(
      tags.map(async (tagName: string) => {
        return await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        });
      })
    );

    // 문구 생성
    const phrase = await prisma.thaiPhrase.create({
      data: {
        text,
        tags: {
          connect: tagObjects.map(tag => ({ id: tag.id }))
        }
      },
      include: {
        tags: true
      }
    });

    return res.status(201).json(phrase);
  } catch (error) {
    console.error('태국어 문구 생성 중 오류:', error);
    return res.status(500).json({ 
      error: 'ไม่สามารถบันทึกข้อความได้' // 문구를 저장할 수 없습니다
    });
  }
} 