import LanguageProvider from './providers/LanguageProvider';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
} 