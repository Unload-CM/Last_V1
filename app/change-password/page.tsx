'use client';

import ChangePasswordForm from '@/components/ChangePasswordForm';
import useTranslation from '@/utils/i18n';

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">{t('changePassword.title')}</h1>
      <ChangePasswordForm />
    </div>
  );
} 