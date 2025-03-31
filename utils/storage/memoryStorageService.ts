import { StorageService, StoredFile } from './storageInterface';
import { storageConfig } from './storageConfig';
import crypto from 'crypto';
import path from 'path';

/**
 * 메모리 기반 스토리지 서비스 구현 (서버리스 환경용)
 * 주의: 이 구현은 서버 재시작 시 모든 데이터가 삭제됩니다.
 */
export class MemoryStorageService implements StorageService {
  private static instance: MemoryStorageService;
  
  // 메모리 스토리지 (파일 ID -> 파일 데이터)
  private storage: Map<string, Buffer> = new Map();
  
  // 메타데이터 스토리지 (파일 ID -> 메타데이터)
  private metadata: Map<string, StoredFile> = new Map();
  
  // 현재 사용 중인 메모리 크기 (바이트)
  private currentMemoryUsage: number = 0;
  
  // 최대 메모리 사용량 (바이트)
  private readonly maxMemoryUsage: number;
  
  // 생성 시간
  private readonly createdAt: number;
  
  constructor() {
    this.maxMemoryUsage = storageConfig.maxMemoryUsage || 300 * 1024 * 1024; // 기본 300MB
    this.createdAt = Date.now();
    console.log(`[MemoryStorageService] 초기화 완료, 최대 메모리: ${this.maxMemoryUsage / (1024 * 1024)}MB`);
  }
  
  /**
   * 싱글톤 인스턴스를 반환합니다.
   */
  public static getInstance(): MemoryStorageService {
    if (!MemoryStorageService.instance) {
      MemoryStorageService.instance = new MemoryStorageService();
    }
    return MemoryStorageService.instance;
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
   * 데이터 URL을 생성합니다.
   */
  private createDataUrl(buffer: Buffer, mimeType: string): string {
    // 대용량 파일인 경우 Base64 인코딩 안함
    if (buffer.length > 10 * 1024 * 1024) { // 10MB 이상
      // 고유 식별자만 반환
      const id = crypto.randomBytes(16).toString('hex');
      return `memory:${id}`;
    }
    
    // Data URL 형식: data:mimetype;base64,데이터
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }
  
  /**
   * 오래된 파일을 정리하여 메모리를 확보합니다.
   */
  private async cleanupOldFiles(requiredBytes: number): Promise<boolean> {
    // 정리할 필요가 없는 경우
    if (this.currentMemoryUsage + requiredBytes <= this.maxMemoryUsage) {
      return true;
    }
    
    // 메타데이터 배열로 변환하여 생성 시간 기준으로 정렬
    const metaEntries = Array.from(this.metadata.entries())
      .map(([id, meta]) => ({ id, meta }))
      .sort((a, b) => {
        const timeA = a.meta.metadata?.createdAt as number || 0;
        const timeB = b.meta.metadata?.createdAt as number || 0;
        return timeA - timeB; // 오래된 것 먼저 삭제
      });
    
    let freedBytes = 0;
    const targetBytes = requiredBytes - (this.maxMemoryUsage - this.currentMemoryUsage);
    
    for (const { id } of metaEntries) {
      if (freedBytes >= targetBytes) break;
      
      const file = this.storage.get(id);
      if (file) {
        freedBytes += file.length;
        this.storage.delete(id);
        this.metadata.delete(id);
        this.currentMemoryUsage -= file.length;
      }
      
      if (this.currentMemoryUsage + requiredBytes <= this.maxMemoryUsage) {
        return true;
      }
    }
    
    // 충분한 공간을 확보했는지 확인
    return this.currentMemoryUsage + requiredBytes <= this.maxMemoryUsage;
  }
  
  /**
   * 파일을 메모리에 저장합니다.
   */
  async saveFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    options?: { path?: string; metadata?: Record<string, any> }
  ): Promise<StoredFile> {
    // 메모리 공간 확인 및 확보
    const success = await this.cleanupOldFiles(buffer.length);
    if (!success) {
      throw new Error('메모리 부족: 필요한 공간을 확보할 수 없습니다.');
    }
    
    const uniqueId = this.generateUniqueId(fileName);
    const url = this.createDataUrl(buffer, mimeType);
    
    // 메타데이터 설정
    const metaData: StoredFile = {
      id: uniqueId,
      originalName: fileName,
      mimeType,
      size: buffer.length,
      url,
      metadata: {
        ...options?.metadata,
        createdAt: Date.now()
      }
    };
    
    // 스토리지에 저장
    this.storage.set(uniqueId, buffer);
    this.metadata.set(uniqueId, metaData);
    this.currentMemoryUsage += buffer.length;
    
    return metaData;
  }
  
  /**
   * 파일을 메모리에서 읽어옵니다.
   */
  async getFile(fileId: string): Promise<{ data: Buffer; metadata: StoredFile } | null> {
    const buffer = this.storage.get(fileId);
    const metadata = this.metadata.get(fileId);
    
    if (!buffer || !metadata) {
      return null;
    }
    
    return { data: buffer, metadata };
  }
  
  /**
   * 파일이 메모리에 존재하는지 확인합니다.
   */
  async fileExists(fileId: string): Promise<boolean> {
    return this.storage.has(fileId);
  }
  
  /**
   * 파일을 메모리에서 삭제합니다.
   */
  async deleteFile(fileId: string): Promise<boolean> {
    const buffer = this.storage.get(fileId);
    
    if (buffer) {
      this.currentMemoryUsage -= buffer.length;
      this.storage.delete(fileId);
      this.metadata.delete(fileId);
      return true;
    }
    
    return false;
  }
} 