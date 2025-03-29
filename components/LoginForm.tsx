'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTranslation } from '@/store/languageStore';
import Image from 'next/image';

console.log('LoginForm loaded');

export default function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 디버깅 로그
  useEffect(() => {
    console.log('LoginForm - 번역 테스트:');
    console.log('login.title =', t('login.title'));
    console.log('login.password =', t('login.password'));
    console.log('login.defaultPassword =', t('login.defaultPassword'));
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!employeeId || !password) {
      setError(t('login.errorRequiredFields'));
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: employeeId, // 백엔드에서는 아직 email이란 이름으로 받고 있음
        password,
      });

      if (result?.error) {
        setError(t('login.invalidCredentials'));
      } else {
        // 로그인 성공 시 로컬 스토리지에 사원번호 저장
        // 기본 정보가 있다면 그 정보를 가져와서 업데이트
        try {
          const storedAdminInfo = localStorage.getItem('adminInfo');
          let adminInfo = storedAdminInfo ? JSON.parse(storedAdminInfo) : {};
          
          adminInfo = {
            ...adminInfo,
            isLoggedIn: true,
            employeeId: employeeId, // 사원번호 저장
            // 기본값으로 이름과 역할 설정 (나중에 서버에서 받아온 정보로 업데이트할 수 있음)
            name: adminInfo.name || '관리자',
            role: adminInfo.role || 'admin'
          };
          
          localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
        } catch (storageError) {
          console.error('로컬 스토리지 저장 오류:', storageError);
        }
        
        router.push('/');
        router.refresh();
      }
    } catch (err) {
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
          {/* 
          <div className="mt-2 p-3 bg-red-100 text-red-700 rounded-md">
            <p>{t('login.adminOnly')}</p>
            <p className="mt-1">{t('login.availableAccounts')}</p>
          </div>
          */}
        </div>
      </form>
      
      <div className="text-xs text-center text-gray-400 mt-16">
        © 2025 CoilMaster. All rights reserved. Developed by Cha brother
      </div>
    </div>
  );
} 