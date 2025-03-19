import { useTranslation } from '@/utils/i18n';
import LoginForm from '@/components/LoginForm';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <LoginForm />
      </div>
    </div>
  );
} 