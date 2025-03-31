import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { optimizeImage } from '../media/imageOptimizer';
import { optimizeVideo } from '../media/videoOptimizer';
import fs from 'fs/promises';
import path from 'path';

// formidable에서 사용하는 타입 정의
export interface File {
  filepath: string;
  originalFilename: string | null;
  mimetype?: string | null;
  size: number;
}

/**
 * NextJS API 라우트에서 파일 업로드를 처리합니다.
 * @param req NextJS API 요청 객체
 * @param res NextJS API 응답 객체
 * @returns 업로드된 파일 정보
 */
export const handleFileUpload = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{
  fields: formidable.Fields;
  files: formidable.Files;
}> => {
  return new Promise((resolve, reject) => {
    // Upload 디렉토리 생성
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'temp');
    fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

    const form = formidable({
      multiples: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB 제한
      uploadDir,
      filename: (name, ext, part) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        return `${part.name || 'unknown'}-${uniqueSuffix}${ext}`;
      },
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('파일 업로드 오류:', err);
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
};

/**
 * 업로드된 파일을 최적화합니다.
 * @param file 업로드된 파일 정보
 * @returns 최적화된 파일 정보
 */
export const processUploadedFile = async (file: File) => {
  try {
    // 파일 읽기
    const buffer = await fs.readFile(file.filepath);
    
    // MIME 타입 확인
    const mime = file.mimetype || '';
    const filename = file.originalFilename || 'unnamed';
    
    // 원본 임시 파일 정리
    await fs.unlink(file.filepath).catch(() => {});
    
    // 이미지인 경우
    if (mime.startsWith('image/')) {
      return await optimizeImage(buffer, filename);
    }
    // 동영상인 경우
    else if (mime.startsWith('video/')) {
      return await optimizeVideo(buffer, filename);
    }
    // 지원하지 않는 파일 타입
    else {
      throw new Error('지원하지 않는 파일 타입입니다');
    }
  } catch (error) {
    console.error('파일 처리 오류:', error);
    throw error;
  }
}; 