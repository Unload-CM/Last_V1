import { NextApiRequest, NextApiResponse } from 'next';
import { handleFileUpload, processUploadedFile } from '@/utils/upload/fileUploadHandler';

export const config = {
  api: {
    bodyParser: false, // formidable 사용을 위해 기본 파서 비활성화
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다' });
  }

  try {
    // 파일 업로드 처리
    const { files } = await handleFileUpload(req, res);
    const results = [];

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