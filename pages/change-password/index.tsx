import ChangePasswordForm from '@/components/ChangePasswordForm';
import { useTranslation } from '@/store/languageStore';
import Head from 'next/head';

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-10 px-4">
      <Head>
        <title>{t('changePassword.title')} - 공장 관리 시스템</title>
        <meta name="description" content="비밀번호 변경 페이지" />
      </Head>
      <h1 className="text-2xl font-bold mb-6 text-center">{t('changePassword.title')}</h1>
      <ChangePasswordForm />
    </div>
  );
} 