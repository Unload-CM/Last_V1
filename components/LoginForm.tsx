'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useTranslation from '../utils/i18n';

console.log('LoginForm loaded');

export default function LoginForm() {
  try {
    const { t } = useTranslation();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      try {
        // 실제 구현에서는 API 호출을 통해 로그인 처리
        // 예시 코드
        if (email === 'admin@example.com' && password === 'password') {
          router.push('/dashboard');
        } else {
          setError(t('login.error'));
        }
      } catch (err) {
        setError(t('login.error'));
      }
    };

    return (
      <div>
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">{t('login.title')}</h2>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t('login.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              className="input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button type="submit" className="w-full btn btn-primary">
              {t('login.submit')}
            </button>
          </div>
        </form>
      </div>
    );
  } catch (error) {
    console.error('Error in LoginForm component:', error);
    return null;
  }
} 