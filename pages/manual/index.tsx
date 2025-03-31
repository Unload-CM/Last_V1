import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from '@/store/languageStore';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FiBook, FiBookOpen, FiHelpCircle, FiHome, FiSettings, FiUsers, FiAlertCircle, FiMessageSquare, FiBell, FiKey, FiArrowUp } from 'react-icons/fi';
import { useRouter } from 'next/router';
import React from 'react';
import { Button } from "@/components/ui/button";
import Head from 'next/head';

// 메뉴 아이템 타입 정의
interface MenuItem {
  text: string;
  anchor: string;
  icon: React.ElementType;
  level: number;
}

export default function ManualPage() {
  const { language, t } = useTranslation();
  const [manualContent, setManualContent] = useState<string>('');
  const [processedContent, setProcessedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [sectionHeadings, setSectionHeadings] = useState<{id: string, text: string}[]>([]);

  // 스크롤 위치에 따라 맨 위로 버튼 표시 여부 결정
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 맨 위로 스크롤 함수
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const fetchManual = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 선택된 언어에 따라 적절한 메뉴얼 파일 가져오기
        const filePath = `/api/manual?language=${language}`;
        const response = await fetch(filePath);
        
        if (!response.ok) {
          throw new Error(`HTTP 오류: ${response.status}`);
        }
        
        const data = await response.json();
        setManualContent(data.content);
        
        // 목차 부분 및 Table of Contents 제거
        let content = data.content;
        
        // 한국어 목차 제거
        const tocStartIndex = content.indexOf('## 목차');
        if (tocStartIndex !== -1) {
          const nextSectionIndex = content.indexOf('## ', tocStartIndex + 1);
          if (nextSectionIndex !== -1) {
            content = content.substring(0, tocStartIndex) + content.substring(nextSectionIndex);
          }
        }
        
        // 영어 목차 제거
        const tocEnStartIndex = content.indexOf('## Table of Contents');
        if (tocEnStartIndex !== -1) {
          const nextEnSectionIndex = content.indexOf('## ', tocEnStartIndex + 1);
          if (nextEnSectionIndex !== -1) {
            content = content.substring(0, tocEnStartIndex) + content.substring(nextEnSectionIndex);
          }
        }
        
        // 태국어 목차 제거
        const tocThStartIndex = content.indexOf('## สารบัญ');
        if (tocThStartIndex !== -1) {
          const nextThSectionIndex = content.indexOf('## ', tocThStartIndex + 1);
          if (nextThSectionIndex !== -1) {
            content = content.substring(0, tocThStartIndex) + content.substring(nextThSectionIndex);
          }
        }
        
        // 이미지 참조와 '[로그인 화면]', '(이미지 경로)' 등의 패턴을 제거
        const filteredLines = content.split('\n').filter(line => {
          const trimmedLine = line.trim();
          return !(
            trimmedLine.includes('(이미지 경로)') ||
            trimmedLine.includes('(image path)') ||
            trimmedLine.includes('(เส้นทางรูปภาพ)') ||
            trimmedLine.startsWith('![') ||
            trimmedLine.includes('![') ||
            // 다양한 화면 관련 패턴
            (trimmedLine.includes('화면') && trimmedLine.includes(']')) ||
            (trimmedLine.includes('Screen') && trimmedLine.includes(']')) ||
            (trimmedLine.includes('หน้า') && trimmedLine.includes(']')) ||
            // 로그아웃/로그인 관련 특별 처리
            trimmedLine.includes('[로그인 화면]') ||
            trimmedLine.includes('[Login Screen]') ||
            trimmedLine.includes('[หน้าเข้าสู่ระบบ]') ||
            trimmedLine.includes('[로그아웃 화면]') ||
            trimmedLine.includes('[Logout Screen]') ||
            trimmedLine.includes('[หน้าออกจากระบบ]') ||
            // 목차 관련 표현식
            trimmedLine.startsWith('Table of Contents') ||
            trimmedLine === 'Table of Contents' ||
            trimmedLine.startsWith('# Table of Contents')
          );
        });
        
        content = filteredLines.join('\n');
        
        // 연속된 빈 줄 제거
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
          
        setProcessedContent(content);
      } catch (err) {
        console.error('메뉴얼을 불러오는 중 오류 발생:', err);
        setError('메뉴얼을 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchManual();
  }, [language]); // 언어가 변경될 때마다 메뉴얼 다시 불러오기

  // 콘텐츠가 로드된 후 섹션 헤딩을 찾아 저장
  useEffect(() => {
    if (contentRef.current && !isLoading) {
      // 약간의 지연을 두어 ReactMarkdown이 DOM에 렌더링될 시간을 줌
      setTimeout(() => {
        const headings = contentRef.current?.querySelectorAll('h2');
        const newSectionHeadings = Array.from(headings || []).map(heading => ({
          id: heading.id,
          text: heading.textContent || ''
        }));
        setSectionHeadings(newSectionHeadings);
      }, 500);
    }
  }, [isLoading, processedContent]);

  // ID 생성 함수 - 목차와 내용에서 동일한 ID 생성 방식 사용
  const generateId = (text: string): string => {
    // 태국어(Thai), 한국어(Korean) 및 기타 유니코드 문자 보존
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ\u0E00-\u0E7F-]/g, ''); // 한글과 태국어 문자도 유지하도록 수정
  };

  // 앱 메뉴 아이템 정의 - 메뉴얼 문서의 실제 헤딩에 맞게 수정
  const menuItems = useMemo((): MenuItem[] => {
    // 언어별 메뉴 아이템 정의
    if (language === 'en') {
      return [
        { text: 'Introduction', anchor: 'introduction', icon: FiBook, level: 1 },
        { text: 'Login', anchor: 'login', icon: FiKey, level: 1 },
        { text: 'Dashboard', anchor: 'dashboard', icon: FiHome, level: 1 },
        { text: 'Issue Management', anchor: 'issue-management', icon: FiAlertCircle, level: 1 },
        { text: 'Employee Management', anchor: 'employee-management', icon: FiUsers, level: 1 },
        { text: 'Settings', anchor: 'settings', icon: FiSettings, level: 1 },
        { text: 'Language Change', anchor: 'language-change', icon: FiBook, level: 1 },
        { text: 'Password Change', anchor: 'password-change', icon: FiKey, level: 1 },
        { text: 'Logout', anchor: 'logout', icon: FiKey, level: 1 }
      ];
    } else if (language === 'th') {
      return [
        { text: 'บทนำ', anchor: 'บทนำ', icon: FiBook, level: 1 },
        { text: 'การเข้าสู่ระบบ', anchor: 'การเข้าสู่ระบบ', icon: FiKey, level: 1 },
        { text: 'แดชบอร์ด', anchor: 'แดชบอร์ด', icon: FiHome, level: 1 },
        { text: 'การจัดการปัญหา', anchor: 'การจัดการปัญหา', icon: FiAlertCircle, level: 1 },
        { text: 'การจัดการพนักงาน', anchor: 'การจัดการพนักงาน', icon: FiUsers, level: 1 },
        { text: 'การตั้งค่า', anchor: 'การตั้งค่า', icon: FiSettings, level: 1 },
        { text: 'การเปลี่ยนภาษา', anchor: 'การเปลี่ยนภาษา', icon: FiBook, level: 1 },
        { text: 'การเปลี่ยนรหัสผ่าน', anchor: 'การเปลี่ยนรหัสผ่าน', icon: FiKey, level: 1 },
        { text: 'การออกจากระบบ', anchor: 'การออกจากระบบ', icon: FiKey, level: 1 }
      ];
    } else {
      // 기본 한국어
      return [
        { text: '소개', anchor: 'section-intro', icon: FiBook, level: 1 },
        { text: '로그인', anchor: 'section-login', icon: FiKey, level: 1 },
        { text: '대시보드', anchor: 'section-dashboard', icon: FiHome, level: 1 },
        { text: '이슈 관리', anchor: 'section-issues', icon: FiAlertCircle, level: 1 },
        { text: '직원 관리', anchor: 'section-employees', icon: FiUsers, level: 1 },
        { text: '설정', anchor: 'section-settings', icon: FiSettings, level: 1 },
        { text: '언어 변경', anchor: 'section-language', icon: FiBook, level: 1 },
        { text: '비밀번호 변경', anchor: 'section-password', icon: FiKey, level: 1 },
        { text: '로그아웃', anchor: '로그아웃', icon: FiKey, level: 1 }
      ];
    }
  }, [language]);

  // 언어별 타이틀 정의
  const getTitle = () => {
    switch (language) {
      case 'ko': return '사용자 메뉴얼';
      case 'en': return 'User Manual';
      case 'th': return 'คู่มือการใช้งาน';
      default: return '사용자 메뉴얼';
    }
  };

  // 언어별 부제목 정의
  const getSubtitle = () => {
    switch (language) {
      case 'ko': return '공장 관리 시스템 사용법';
      case 'en': return 'Factory Management System Usage Guide';
      case 'th': return 'คู่มือการใช้งานระบบจัดการโรงงาน';
      default: return '공장 관리 시스템 사용법';
    }
  };

  // 메뉴 항목과 실제 섹션 제목 매핑
  const getMatchingHeadingId = (menuItem: MenuItem): string | null => {
    // 1. 메뉴 항목의 텍스트와 정확히 일치하는 섹션 찾기
    const exactMatch = sectionHeadings.find(heading => 
      heading.text.trim() === menuItem.text.trim()
    );
    if (exactMatch) return exactMatch.id;
    
    // 2. 메뉴 항목 텍스트가 섹션 제목에 포함되는 경우 찾기
    const partialMatch = sectionHeadings.find(heading => 
      heading.text.trim().includes(menuItem.text.trim())
    );
    if (partialMatch) return partialMatch.id;
    
    // 3. 메뉴 텍스트로 생성된 ID와 일치하는 섹션 찾기
    const generatedId = generateId(menuItem.text);
    const idMatch = sectionHeadings.find(heading => 
      heading.id === generatedId
    );
    if (idMatch) return idMatch.id;
    
    // 4. 메뉴 앵커로 생성된 ID와 일치하는 섹션 찾기
    const anchorMatch = sectionHeadings.find(heading => 
      heading.id === menuItem.anchor
    );
    if (anchorMatch) return anchorMatch.id;
    
    return null;
  };

  // 메뉴 클릭 핸들러
  const handleMenuClick = (item: MenuItem) => {
    const headingId = getMatchingHeadingId(item);
    if (headingId) {
      const element = document.getElementById(headingId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(headingId);
      } else {
        console.warn(`Element with ID ${headingId} not found`);
      }
    } else {
      console.warn(`No matching heading found for menu item ${item.text}`);
    }
  };

  // 목차 컴포넌트
  const TableOfContents = () => {
    return (
      <div className="mb-6 p-4 bg-white rounded-md shadow">
        <h3 className="text-lg font-semibold mb-3">{t('docs.tableOfContents')}</h3>
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const headingId = getMatchingHeadingId(item);
            return (
              <li 
                key={index} 
                className={`cursor-pointer hover:text-blue-600 transition-colors
                           ${activeSection === headingId ? 'text-blue-600 font-medium' : ''}
                           ${item.level > 1 ? 'ml-4' : ''}`}
                onClick={() => handleMenuClick(item)}
              >
                <div className="flex items-center">
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.text}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Head>
        <title>{getTitle()} - 공장 관리 시스템</title>
        <meta name="description" content={getSubtitle()} />
      </Head>
      
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2">{getTitle()}</h1>
        <p className="text-gray-600">{getSubtitle()}</p>
      </header>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* 사이드바 (모바일에서는 상단에 표시) */}
        <aside className="md:w-1/4 mb-6 md:mb-0">
          <TableOfContents />
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{t('common.quickLinks')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => router.push('/')}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FiHome className="mr-2" /> {t('common.home')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FiBookOpen className="mr-2" /> {t('common.dashboard')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => router.push('/issues')}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FiAlertCircle className="mr-2" /> {t('common.issues')}
                  </button>
                </li>
              </ul>
            </CardContent>
          </Card>
        </aside>
        
        {/* 메인 콘텐츠 */}
        <main className="md:w-3/4">
          <Card className="w-full">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="py-10 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-500 border-r-transparent align-middle"></div>
                  <p className="mt-2">{t('common.loading')}</p>
                </div>
              ) : error ? (
                <div className="py-10 text-center text-red-500">
                  <FiAlertCircle className="inline-block mb-2 w-8 h-8" />
                  <p>{error}</p>
                  <button 
                    onClick={() => router.push('/')}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {t('common.returnHome')}
                  </button>
                </div>
              ) : (
                <div
                  ref={contentRef}
                  className="prose prose-blue max-w-none"
                  id="manual-content"
                >
                  <ReactMarkdown>{processedContent}</ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      
      {/* 맨 위로 스크롤 버튼 */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all"
          size="sm"
          aria-label={t('common.scrollToTop')}
        >
          <FiArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
} 