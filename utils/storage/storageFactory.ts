import { StorageService } from './storageInterface';
import { LocalStorageService } from './localStorageService';
import { MemoryStorageService } from './memoryStorageService';
import { storageConfig, StorageType } from './storageConfig';

/**
 * 스토리지 서비스를 제공하는 팩토리 클래스
 */
export class StorageFactory {
  /**
   * 환경에 맞는 스토리지 서비스를 반환합니다.
   * @returns StorageService 인스턴스
   */
  static getStorageService(): StorageService {
    console.log(`스토리지 타입: ${storageConfig.type}`);
    
    switch (storageConfig.type) {
      case 'local':
        return new LocalStorageService();
      case 'memory':
        return new MemoryStorageService();
      case 'vercel':
        // Vercel 환경에서는 메모리 스토리지 사용
        return new MemoryStorageService();
      default:
        console.warn(`알 수 없는 스토리지 타입: ${storageConfig.type}, 로컬 스토리지로 대체합니다.`);
        return new LocalStorageService();
    }
  }
}

// 싱글톤 스토리지 서비스 인스턴스 생성 및 export
export const storageService = StorageFactory.getStorageService(); 