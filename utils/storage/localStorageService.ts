import fs from 'fs/promises';
import path from 'path';
import { StorageService, StoredFile } from './storageInterface';
import { storageConfig } from './storageConfig';
import crypto from 'crypto';

/**
 * 로컬 파일 시스템을 사용하는 스토리지 서비스 구현
 */
export class LocalStorageService implements StorageService {
  private basePath: string;
  private baseUrl: string;
  
  constructor() {
    this.basePath = storageConfig.basePath || './public/uploads';
    this.baseUrl = storageConfig.baseUrl;
    this.ensureDirectoryExists('');
  }
  
  /**
   * 디렉토리가 존재하는지 확인하고, 없으면 생성합니다.
   */
  private async ensureDirectoryExists(relativePath: string): Promise<void> {
    const dirPath = path.join(this.basePath, relativePath);
    
    try {
      await fs.access(dirPath);
    } catch (error) {
      // 디렉토리가 없으면 생성
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
  
  /**
   * 고유한 파일 ID를 생성합니다.
   */
  private generateUniqueId(fileName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 20);
      
    return `${baseName}_${timestamp}_${randomString}${extension}`;
  }
  
  /**
   * 파일을 로컬 파일 시스템에 저장합니다.
   */
  async saveFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    options?: { path?: string; metadata?: Record<string, any> }
  ): Promise<StoredFile> {
    const relativePath = options?.path || '';
    await this.ensureDirectoryExists(relativePath);
    
    const uniqueId = this.generateUniqueId(fileName);
    const filePath = path.join(relativePath, uniqueId);
    const fullPath = path.join(this.basePath, filePath);
    
    // 파일 저장
    await fs.writeFile(fullPath, buffer);
    
    // URL 생성 (경로 구분자 통일)
    const url = `${this.baseUrl}/${filePath.replace(/\\/g, '/')}`;
    
    // 메타데이터 파일 저장 (선택 사항)
    const metadata = options?.metadata || {};
    const metadataFile = `${fullPath}.meta.json`;
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
    
    return {
      id: filePath,
      originalName: fileName,
      mimeType,
      size: buffer.length,
      url,
      metadata
    };
  }
  
  /**
   * 파일을 로컬 파일 시스템에서 읽어옵니다.
   */
  async getFile(fileId: string): Promise<{ data: Buffer; metadata: StoredFile } | null> {
    try {
      const fullPath = path.join(this.basePath, fileId);
      
      // 파일 데이터 읽기
      const data = await fs.readFile(fullPath);
      
      // 메타데이터 읽기 시도
      let metadata: Record<string, any> = {};
      try {
        const metadataContent = await fs.readFile(`${fullPath}.meta.json`, 'utf-8');
        metadata = JSON.parse(metadataContent);
      } catch {
        // 메타데이터 파일이 없어도 계속 진행
      }
      
      const fileName = path.basename(fileId);
      
      return {
        data,
        metadata: {
          id: fileId,
          originalName: metadata.originalName || fileName,
          mimeType: metadata.mimeType || 'application/octet-stream',
          size: data.length,
          url: `${this.baseUrl}/${fileId.replace(/\\/g, '/')}`,
          metadata
        }
      };
    } catch (error) {
      // 파일이 없거나 읽기 오류
      return null;
    }
  }
  
  /**
   * 파일이 로컬 파일 시스템에 존재하는지 확인합니다.
   */
  async fileExists(fileId: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, fileId);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 파일을 로컬 파일 시스템에서 삭제합니다.
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, fileId);
      
      // 파일 삭제
      await fs.unlink(fullPath);
      
      // 메타데이터 파일도 삭제 시도
      try {
        await fs.unlink(`${fullPath}.meta.json`);
      } catch {
        // 메타데이터 파일이 없어도 계속 진행
      }
      
      return true;
    } catch {
      return false;
    }
  }
} 