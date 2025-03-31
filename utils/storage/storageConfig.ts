// 스토리지 타입 정의
export type StorageType = 'local' | 'memory' | 'vercel';

// 스토리지 설정값
interface StorageConfig {
  // 스토리지 방식
  type: StorageType;
  
  // 파일이 저장되는 기본 경로 (로컬 스토리지 사용 시)
  basePath?: string;
  
  // 최대 파일 크기 (바이트 단위)
  maxFileSize: number;
  
  // 메모리 스토리지 사용 시 최대 메모리 사용량 (바이트 단위)
  maxMemoryUsage?: number;
  
  // 파일 URL 생성 시 사용되는 베이스 URL
  baseUrl: string;
}

// 환경 변수에서 스토리지 타입 결정
const determineStorageType = (): StorageType => {
  // VERCEL 환경인 경우 메모리 스토리지 사용
  if (process.env.VERCEL === '1') {
    return 'memory';
  }
  
  // 환경 변수에서 설정된 경우
  const envType = process.env.STORAGE_TYPE as StorageType;
  if (envType && ['local', 'memory', 'vercel'].includes(envType)) {
    return envType;
  }
  
  // 기본값은 로컬 스토리지
  return 'local';
};

// 스토리지 설정 생성
const createStorageConfig = (): StorageConfig => {
  const type = determineStorageType();
  
  // 스토리지 타입에 따른 설정
  switch (type) {
    case 'local':
      return {
        type: 'local',
        basePath: process.env.STORAGE_PATH || './public/uploads',
        maxFileSize: 100 * 1024 * 1024, // 100MB
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000/uploads'
      };
      
    case 'memory':
      return {
        type: 'memory',
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxMemoryUsage: 300 * 1024 * 1024, // 300MB
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'data:' // 데이터 URL 사용
      };
      
    case 'vercel':
      return {
        type: 'vercel',
        maxFileSize: 50 * 1024 * 1024, // 50MB
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || '/'
      };
      
    default:
      return {
        type: 'local',
        basePath: './public/uploads',
        maxFileSize: 100 * 1024 * 1024, // 100MB
        baseUrl: '/uploads'
      };
  }
};

// 스토리지 설정 내보내기
export const storageConfig = createStorageConfig(); 