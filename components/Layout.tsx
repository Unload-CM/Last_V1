import { LanguageProvider } from '@/utils/i18n';

export default function Layout({ children }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
} 