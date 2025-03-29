'use client';

import { useTranslation } from '@/store/languageStore';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#E6F0FF] to-[#D4E6FF]">
      <div className="w-[90%] sm:w-[450px] p-6 sm:p-8 bg-white rounded-lg shadow-md">
        <LoginForm />
      </div>
    </div>
  );
} 