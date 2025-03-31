import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { storageService } from '../storage/storageFactory';
import { StoredFile } from '../storage/storageInterface';
import { optimizeImage } from '../media/imageOptimizer';
import { optimizeVideo } from '../media/videoOptimizer';

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
    // 임시 업로드 디렉토리 생성
    const uploadDir = path.join(process.cwd(), 'tmp');
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
 * 업로드된 파일을 최적화하고 저장합니다.
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
      return await processAndStoreImage(buffer, filename, mime);
    }
    // 동영상인 경우
    else if (mime.startsWith('video/')) {
      return await processAndStoreVideo(buffer, filename, mime);
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

/**
 * 이미지를 최적화하고 저장합니다.
 */
async function processAndStoreImage(buffer: Buffer, filename: string, mimeType: string) {
  // 이미지 최적화
  const result = await optimizeImage(buffer, filename);
  
  // 원본 이미지 저장
  const originalFile = await storageService.saveFile(
    buffer,
    filename,
    mimeType,
    {
      path: 'images/original',
      metadata: {
        originalName: filename,
        optimized: false
      }
    }
  );
  
  // 최적화된 이미지 저장을 위한 버퍼 생성 (실제로는 별도 구현 필요)
  const optimizedBuffer = Buffer.alloc(result.optimizedSize);
  const optimizedFile = await storageService.saveFile(
    optimizedBuffer,
    `optimized_${filename}`,
    'image/webp',
    {
      path: 'images/optimized',
      metadata: {
        originalName: filename,
        optimized: true,
        width: result.width,
        height: result.height
      }
    }
  );
  
  // 썸네일 저장을 위한 버퍼 생성 (실제로는 별도 구현 필요)
  const thumbnailBuffer = Buffer.alloc(result.thumbnailSize);
  const thumbnailFile = await storageService.saveFile(
    thumbnailBuffer,
    `thumb_${filename}`,
    'image/webp',
    {
      path: 'images/thumbnails',
      metadata: {
        originalName: filename,
        optimized: true,
        width: result.width / 4,
        height: result.height / 4
      }
    }
  );
  
  return {
    originalPath: originalFile.url,
    optimizedPath: optimizedFile.url,
    thumbnailPath: thumbnailFile.url,
    originalSize: result.originalSize,
    optimizedSize: result.optimizedSize,
    thumbnailSize: result.thumbnailSize,
    width: result.width,
    height: result.height
  };
}

/**
 * 비디오를 처리하고 저장합니다.
 */
async function processAndStoreVideo(buffer: Buffer, filename: string, mimeType: string) {
  // 비디오 최적화
  const result = await optimizeVideo(buffer, filename);
  
  // 원본 비디오 저장
  const originalFile = await storageService.saveFile(
    buffer,
    filename,
    mimeType,
    {
      path: 'videos/original',
      metadata: {
        originalName: filename,
        optimized: false
      }
    }
  );
  
  // 최적화된 비디오 저장 (실제로는 별도 구현 필요)
  const optimizedBuffer = Buffer.alloc(result.optimizedSize);
  const optimizedFile = await storageService.saveFile(
    optimizedBuffer,
    `optimized_${filename}`,
    mimeType,
    {
      path: 'videos/optimized',
      metadata: {
        originalName: filename,
        optimized: true
      }
    }
  );
  
  // 썸네일 생성 (실제로는 FFmpeg 등으로 생성해야 함)
  const thumbnailBuffer = Buffer.alloc(1024); // 더미 버퍼
  const thumbnailFile = await storageService.saveFile(
    thumbnailBuffer,
    `thumb_${filename}.jpg`,
    'image/jpeg',
    {
      path: 'videos/thumbnails',
      metadata: {
        originalName: filename,
        optimized: true
      }
    }
  );
  
  return {
    originalPath: originalFile.url,
    optimizedPath: optimizedFile.url,
    thumbnailPath: thumbnailFile.url,
    originalSize: result.originalSize,
    optimizedSize: result.optimizedSize,
    duration: result.duration
  };
} 