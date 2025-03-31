/**
 * 저장된 파일 정보 인터페이스
 */
export interface StoredFile {
  // 파일 식별자 (경로나 ID)
  id: string;
  
  // 원본 파일명
  originalName: string;
  
  // 파일 타입 (MIME 타입)
  mimeType: string;
  
  // 파일 크기 (바이트)
  size: number;
  
  // 파일 URL (액세스용)
  url: string;
  
  // 추가 메타데이터 (선택 사항)
  metadata?: Record<string, any>;
}

/**
 * 스토리지 서비스 인터페이스
 * 파일을 저장하고 관리하는 기능을 정의합니다.
 */
export interface StorageService {
  /**
   * 파일을 스토리지에 저장합니다.
   * @param buffer 파일 데이터
   * @param fileName 파일 이름
   * @param mimeType 파일 MIME 타입
   * @param options 추가 옵션
   * @returns 저장된 파일 정보
   */
  saveFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    options?: {
      path?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<StoredFile>;
  
  /**
   * 파일을 스토리지에서 조회합니다.
   * @param fileId 파일 식별자
   * @returns 파일 데이터와 메타데이터
   */
  getFile(fileId: string): Promise<{
    data: Buffer;
    metadata: StoredFile;
  } | null>;
  
  /**
   * 파일이 존재하는지 확인합니다.
   * @param fileId 파일 식별자
   * @returns 존재 여부
   */
  fileExists(fileId: string): Promise<boolean>;
  
  /**
   * 파일을 스토리지에서 삭제합니다.
   * @param fileId 파일 식별자
   * @returns 삭제 성공 여부
   */
  deleteFile(fileId: string): Promise<boolean>;
} 