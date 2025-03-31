import { NextApiRequest, NextApiResponse } from 'next';
import { handleFileUpload, processUploadedFile } from '@/utils/upload/fileUploadHandler';

// Vercel 배포를 위한 서버리스 함수 최적화 설정
export const config = {
  api: {
    bodyParser: false, // formidable 사용을 위해 기본 파서 비활성화
    responseLimit: false, // 응답 크기 제한 없음
    maxDuration: 5, // 함수 실행 최대 시간 (초)
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다' });
  }

  try {
    // 요청 헤더에서 Content-Length 확인하여 크기 제한 적용
    const contentLength = req.headers['content-length'];
    const maxSize = 30 * 1024 * 1024; // 30MB

    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        success: false,
        message: '파일 크기가 너무 큽니다. 최대 30MB까지 허용됩니다.',
      });
    }

    // 파일 업로드 처리
    const { files } = await handleFileUpload(req, res);
    
    // 결과를 저장할 배열 (타입 명시)
    const results: Array<{
      originalPath: string;
      optimizedPath: string;
      thumbnailPath: string;
      originalSize: number;
      optimizedSize?: number;
      thumbnailSize?: number;
      width?: number;
      height?: number;
      duration?: number;
    }> = [];

    // 각 파일 처리
    for (const fileKey in files) {
      const fileArray = Array.isArray(files[fileKey]) 
        ? files[fileKey] 
        : [files[fileKey]];
      
      for (const file of fileArray) {
        if (file) {  // null 체크 추가
          const result = await processUploadedFile(file);
          results.push(result);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: '파일 업로드 및 최적화 완료',
      files: results,
    });
  } catch (error) {
    console.error('업로드 처리 오류:', error);
    return res.status(500).json({
      success: false,
      message: '파일 업로드 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
} 