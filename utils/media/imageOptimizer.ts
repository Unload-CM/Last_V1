import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

/**
 * 이미지 파일을 최적화하고 다양한 크기로 저장합니다.
 * @param file 업로드된 파일 객체
 * @param filename 저장할 파일 이름
 * @returns 원본, 최적화, 썸네일 이미지 경로
 */
export async function optimizeImage(
  buffer: Buffer,
  filename: string
): Promise<{
  originalPath: string;
  optimizedPath: string;
  thumbnailPath: string;
  originalSize: number;
  optimizedSize: number;
  thumbnailSize: number;
  width: number;
  height: number;
}> {
  // 파일 확장자 추출
  const ext = path.extname(filename).toLowerCase();
  const baseName = path.basename(filename, ext);
  const timestamp = Date.now();
  const safeFileName = `${baseName}-${timestamp}`;

  // 저장 경로 설정
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const originalDir = path.join(uploadDir, 'original');
  const optimizedDir = path.join(uploadDir, 'optimized');
  const thumbnailDir = path.join(uploadDir, 'thumbnails');

  // 디렉토리 생성 (존재하지 않을 경우)
  await fs.mkdir(originalDir, { recursive: true });
  await fs.mkdir(optimizedDir, { recursive: true });
  await fs.mkdir(thumbnailDir, { recursive: true });

  // 원본 이미지 저장
  const originalPath = path.join(originalDir, `${safeFileName}${ext}`);
  await fs.writeFile(originalPath, buffer);
  const originalSize = buffer.length;

  // 이미지 메타데이터 가져오기
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // 최적화된 이미지 생성 (웹용)
  const optimizedBuffer = await sharp(buffer)
    .resize(1200, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const optimizedPath = path.join(optimizedDir, `${safeFileName}.webp`);
  await fs.writeFile(optimizedPath, optimizedBuffer);
  const optimizedSize = optimizedBuffer.length;

  // 썸네일 생성
  const thumbnailBuffer = await sharp(buffer)
    .resize(300, 300, { fit: 'inside' })
    .webp({ quality: 70 })
    .toBuffer();

  const thumbnailPath = path.join(thumbnailDir, `${safeFileName}.webp`);
  await fs.writeFile(thumbnailPath, thumbnailBuffer);
  const thumbnailSize = thumbnailBuffer.length;

  // 상대 경로로 변환 (public 폴더 기준)
  const publicOriginalPath = `/uploads/original/${safeFileName}${ext}`;
  const publicOptimizedPath = `/uploads/optimized/${safeFileName}.webp`;
  const publicThumbnailPath = `/uploads/thumbnails/${safeFileName}.webp`;

  return {
    originalPath: publicOriginalPath,
    optimizedPath: publicOptimizedPath,
    thumbnailPath: publicThumbnailPath,
    originalSize,
    optimizedSize,
    thumbnailSize,
    width,
    height,
  };
} 