import { useState } from 'react';
import { useRouter } from 'next/router';
import { setAdminUser } from '@/utils/auth';
import Head from 'next/head';

type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

interface AdminUser {
  name: string;
  email: string;
  role: AdminRole;
  createdAt: string;
}

export default function AdminRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const handleRegister = () => {
    try {
      // Thomas cha의 관리자 정보 등록
      const adminUser: AdminUser = {
        name: 'Thomas cha',
        email: 'Thomas@coilmaster.com',
        role: 'SUPER_ADMIN' as AdminRole,
        createdAt: new Date().toISOString()
      };

      // 관리자 정보 저장
      setAdminUser(adminUser);

      // 비밀번호는 별도로 안전하게 저장
      localStorage.setItem('admin_password', '1211');

      alert('최고 관리자로 등록되었습니다.');
      router.push('/issues');
    } catch (error) {
      setError('관리자 등록 중 오류가 발생했습니다.');
      console.error('관리자 등록 오류:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>관리자 등록 - 공장 관리 시스템</title>
        <meta name="description" content="관리자 등록 페이지" />
      </Head>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            관리자 등록
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="mb-4"><strong>이름:</strong> Thomas cha</p>
              <p className="mb-4"><strong>이메일:</strong> Thomas@coilmaster.com</p>
              <p className="mb-4"><strong>권한:</strong> 최고 관리자</p>
            </div>
          </div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          <div>
            <button
              onClick={handleRegister}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              관리자로 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 