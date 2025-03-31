'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { useTranslation } from '@/store/languageStore';

export default function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // URL 쿼리 파라미터에서 에러 메시지 확인
  useEffect(() => {
    const errorMessage = router.query.error;
    if (errorMessage) {
      console.log('URL에서 감지된 오류:', errorMessage);
      setError(typeof errorMessage === 'string' ? errorMessage : t('login.invalidCredentials'));
    }
  }, [router.query, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!employeeId || !password) {
      setError(t('login.errorRequiredFields'));
      setIsLoading(false);
      return;
    }

    console.log('로그인 시도:', { employeeId });

    try {
      const result = await signIn('credentials', {
        redirect: false,
        employeeId: employeeId, // email 대신 employeeId 사용
        password,
      });

      console.log('로그인 결과:', result);

      if (result?.error) {
        console.error('로그인 오류:', result.error);
        setError(result.error || t('login.invalidCredentials'));
      } else if (result?.ok) {
        console.log('로그인 성공');
        // 로그인 성공 시 로컬 스토리지에 사원번호 저장
        try {
          const storedAdminInfo = localStorage.getItem('adminInfo');
          let adminInfo = storedAdminInfo ? JSON.parse(storedAdminInfo) : {};
          
          adminInfo = {
            ...adminInfo,
            isLoggedIn: true,
            employeeId: employeeId,
            name: adminInfo.name || '관리자',
            role: adminInfo.role || 'admin'
          };
          
          localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
        } catch (storageError) {
          console.error('로컬 스토리지 저장 오류:', storageError);
        }
        
        router.push('/dashboard');
      } else {
        console.error('로그인 응답 불명확:', result);
        setError(t('login.error'));
      }
    } catch (err) {
      console.error('로그인 예외 발생:', err);
      setError(t('login.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* 로고 */}
      <div className="flex justify-center mb-6">
        <div className="w-32 h-32 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-bold text-xl">
          CoilMaster
        </div>
      </div>
      
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">{t('login.title')}</h2>
        <p className="mt-2 text-sm text-gray-600">{t('login.subtitle')}</p>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
            placeholder="CMADMIN1"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="0000"
          />
        </div>
        
        <div>
          <button 
            type="submit" 
            className="w-full py-2 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B82F6] transition-colors duration-200"
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : t('login.login')}
          </button>
        </div>
        
        <div className="text-sm text-center mt-4">
          <p className="text-gray-500">{t('login.defaultPassword')}</p>
        </div>
      </form>
      
      <div className="text-xs text-center text-gray-400 mt-16">
        © 2025 CoilMaster. All rights reserved. Developed by Cha brother
      </div>
    </div>
  );
} 