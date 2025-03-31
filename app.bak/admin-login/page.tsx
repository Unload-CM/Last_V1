'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useTranslation } from '@/store/languageStore';

export default function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { t } = useTranslation();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 로그 추가: 번역 로드 상태 확인
  useEffect(() => {
    console.log('로그인 페이지 - 번역 함수 테스트:');
    console.log('login.title =', t('login.title'));
    console.log('login.subtitle =', t('login.subtitle'));
    console.log('employees.employeeId =', t('employees.employeeId'));
    
    // URL 파라미터 확인
    const callbackUrl = searchParams?.get('callbackUrl');
    console.log('현재 callbackUrl:', callbackUrl);
  }, [t, searchParams]);
  
  // 이미 로그인되어 있는 경우 홈페이지로 리다이렉트
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  // URL에서 에러 파라미터 확인
  useEffect(() => {
    const errorType = searchParams?.get('error');
    if (errorType) {
      switch (errorType) {
        case 'CredentialsSignin':
          setError(t('login.invalidCredentials'));
          break;
        default:
          setError(t('common.error'));
          break;
      }
    }
  }, [searchParams, t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!employeeId || !password) {
      setError(t('login.errorRequiredFields'));
      setIsLoading(false);
      return;
    }
    
    try {
      // callbackUrl 확인 - 이미지 경로를 포함하는 경우 기본값 사용
      let callbackUrl = searchParams?.get('callbackUrl') || '/';
      
      // 이미지 경로를 포함하는 callbackUrl 필터링
      if (callbackUrl.includes('/images/') || callbackUrl.includes('.png') || callbackUrl.includes('.jpg')) {
        console.log('이미지 경로가 포함된 callbackUrl 감지, 기본값으로 대체:', callbackUrl);
        callbackUrl = '/';
      }
      
      // 사원번호는 자동으로 대문자로 변환
      const result = await signIn('credentials', {
        redirect: false,
        email: employeeId.toUpperCase(), // 대문자로 변환하여 전송
        password,
        callbackUrl,
      });
      
      if (result?.error) {
        setError(t('login.invalidCredentials'));
      } else {
        // 성공 시 원래 접근하려던 페이지 또는 메인 페이지로 이동
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      setError(t('login.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // 이미 로그인된 경우 로딩 표시
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-primary border-r-transparent align-middle"></div>
          <p className="mt-2">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F0F7FF] to-[#E6F0FF]">
      <div className="w-[90%] sm:w-[450px] p-5 sm:p-6 bg-white rounded-lg shadow-md">
        <div>
          {/* 로고 */}
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-[#4B93FD] to-[#3B82F6] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
              <span className="text-2xl">CM</span>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              {t('login.title')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('login.subtitle')}
            </p>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                {t('employees.employeeId')}
              </label>
              <input
                id="employeeId"
                name="employeeId"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                placeholder="CMADMIN1"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                style={{textTransform: 'uppercase'}}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('login.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                placeholder="0000"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B82F6] transition-colors duration-200"
              >
                {isLoading ? t('common.loading') : t('login.login')}
              </button>
            </div>
            
            <div className="text-sm text-center mt-4">
              <p className="text-gray-500">{t('login.defaultPassword')}</p>
              {/* 
              <p className="text-gray-500 mt-1">{t('login.adminOnly')}</p>
              <p className="text-blue-500 mt-3">{t('login.availableAccounts')}</p>
              */}
            </div>
          </form>
          <div className="text-xs text-center text-gray-400 mt-16">
            © 2025 CoilMaster. All rights reserved. Developed by Cha brother
          </div>
        </div>
      </div>
    </div>
  );
} 