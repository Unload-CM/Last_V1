// 인터페이스만 유지하고 mongoose 의존성 제거
export interface ITranslation {
  key: string;
  language: 'ko' | 'th' | 'en';
  translation: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

// 샘플 번역 데이터
export const sampleTranslations: ITranslation[] = [
  {
    key: 'welcome',
    language: 'ko',
    translation: '환영합니다',
    category: 'common',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'welcome',
    language: 'en',
    translation: 'Welcome',
    category: 'common',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'dashboard',
    language: 'ko',
    translation: '대시보드',
    category: 'navigation',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'dashboard',
    language: 'en',
    translation: 'Dashboard',
    category: 'navigation',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]; 