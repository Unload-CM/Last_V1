'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from '@/store/languageStore';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FiBook, FiBookOpen, FiHelpCircle, FiHome, FiSettings, FiUsers, FiAlertCircle, FiMessageSquare, FiBell, FiKey, FiArrowUp } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from "@/components/ui/button";

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
        console.log('Found section headings:', newSectionHeadings);
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
    
    return null;
  };

  // 메뉴 항목 클릭 처리 - 항상 앵커로 스크롤하도록 수정
  const handleMenuClick = (item: MenuItem) => {
    console.log(`Clicked menu item: ${item.text}, anchor: ${item.anchor}, language: ${language}`);
    
    // 로그아웃 특별 처리 (모든 언어)
    if ((language === 'ko' && item.text === '로그아웃') || 
        (language === 'en' && item.text === 'Logout') || 
        (language === 'th' && item.text === 'การออกจากระบบ')) {
      
      console.log(`${language} 로그아웃 특별 처리`);
      
      // 로그아웃 헤딩 찾기 (언어별 다양한 케이스)
      // 태국어는 두 가지 형태를 모두 검색 - 'ออกจากระบบ'와 'การออกจากระบบ'
      const logoutTexts = ['로그아웃', 'Logout', 'ออกจากระบบ', 'การออกจากระบบ'];
      
      // 모든 h2 헤딩 검색 - 페이지 내 모든 헤딩 출력 (디버깅용)
      console.log('All h2 headings:', 
        Array.from(document.querySelectorAll('h2'))
          .map(el => ({ id: el.id, text: el.textContent }))
      );
      
      // 1. 현재 언어에 맞는 로그아웃 헤딩 찾기
      let element: HTMLElement | null = null;
      
      // 태국어의 경우 두 가지 텍스트로 시도
      if (language === 'th') {
        // 태국어 로그아웃 텍스트 "การออกจากระบบ"와 "ออกจากระบบ" 둘 다 시도
        const thaiLogoutHeadings = Array.from(document.querySelectorAll('h2')).filter(
          heading => {
            const headingText = heading.textContent?.trim() || '';
            return headingText === 'การออกจากระบบ' || headingText === 'ออกจากระบบ';
          }
        );
        
        if (thaiLogoutHeadings.length > 0) {
          element = thaiLogoutHeadings[0] as HTMLElement;
          console.log('태국어 로그아웃 헤딩 찾음:', element);
        }
      } else {
        // 일반적인 방법으로 헤딩 찾기
        const logoutHeadings = Array.from(document.querySelectorAll('h2')).filter(
          heading => logoutTexts.includes(heading.textContent?.trim() || '')
        );
        
        // 현재 언어 로그아웃 헤딩 우선 검색
        const currentLangLogout = Array.from(document.querySelectorAll('h2')).find(
          heading => heading.textContent?.trim() === item.text
        );
        
        // 현재 언어 로그아웃이 있으면 우선 사용
        element = currentLangLogout || (logoutHeadings.length > 0 ? logoutHeadings[0] : null);
      }
      
      // 2. 찾지 못했다면 ID로 직접 찾기 시도
      if (!element) {
        const possibleIds = ['로그아웃', 'Logout', 'ออกจากระบบ', 'การออกจากระบบ'];
        for (const id of possibleIds) {
          const el = document.getElementById(id);
          if (el) {
            element = el;
            console.log(`로그아웃 ID로 찾음: ${id}`, element);
            break;
          }
        }
      }
      
      if (element) {
        console.log(`로그아웃 헤딩 찾음:`, element);
        
        // 스크롤 위치 조정
        const yOffset = -80;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        setActiveSection(item.anchor);
        return;
      } else {
        console.error(`${language} 로그아웃 헤딩을 찾을 수 없음`);
        // 페이지의 모든 요소 로그 출력
        console.log('All h2 elements again:', 
          Array.from(document.querySelectorAll('h2'))
            .map(el => ({ id: el.id, text: el.textContent }))
        );
        
        // 마지막 섹션으로 스크롤
        console.log('마지막 섹션으로 스크롤 시도');
        const sections = Array.from(document.querySelectorAll('h2'));
        if (sections.length > 0) {
          const lastSection = sections[sections.length - 1] as HTMLElement;
          const y = lastSection.getBoundingClientRect().top + window.pageYOffset - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
          return;
        }
      }
    }
    
    // 로그아웃, 비밀번호 변경 등 특별 처리가 필요한 항목
    const specialSections = {
      'ko': {
        '로그아웃': ['로그아웃', 'Logout', 'ออกจากระบบ', 'การออกจากระบบ'],
        '비밀번호 변경': ['비밀번호 변경', 'Password Change', 'การเปลี่ยนรหัสผ่าน']
      },
      'en': {
        'Logout': ['로그아웃', 'Logout', 'ออกจากระบบ', 'การออกจากระบบ'],
        'Password Change': ['비밀번호 변경', 'Password Change', 'การเปลี่ยนรหัสผ่าน']
      },
      'th': {
        'การออกจากระบบ': ['로그아웃', 'Logout', 'ออกจากระบบ', 'การออกจากระบบ'],
        'การเปลี่ยนรหัสผ่าน': ['비밀번호 변경', 'Password Change', 'การเปลี่ยนรหัสผ่าน']
      }
    };
    
    // 현재 언어에 대한 특별 섹션 처리
    const currentLangSpecialSections = specialSections[language as keyof typeof specialSections] || {};
    const possibleHeadings = currentLangSpecialSections[item.text] || [item.text];
    
    // 특별 처리가 필요한 섹션인 경우
    if (possibleHeadings.length > 1) {
      console.log(`Special section handling for: ${item.text}, possible headings:`, possibleHeadings);
      
      // 헤딩 텍스트로 요소 찾기 (다국어 지원)
      const headingElements = Array.from(document.querySelectorAll('h2')).filter(
        heading => {
          const headingText = heading.textContent?.trim() || '';
          return possibleHeadings.includes(headingText);
        }
      );
      
      if (headingElements.length > 0) {
        const element = headingElements[0] as HTMLElement;
        console.log(`Found special heading:`, element);
        
        // 스크롤 위치 조정
        const yOffset = -80;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        setActiveSection(item.anchor);
        return;
      } else {
        console.log(`No special heading found for: ${item.text}`);
      }
    }
    
    // 일반적인 방법으로 요소 찾기
    let element: HTMLElement | null = null;
    
    // 1. 정확한 ID로 요소 찾기
    element = document.getElementById(item.anchor);
    console.log(`Looking for element with ID: ${item.anchor}, found:`, element);
    
    // 2. 제목에서 생성된 ID로 요소 찾기
    if (!element) {
      const generatedId = generateId(item.text);
      element = document.getElementById(generatedId);
      console.log(`Looking for element with generated ID: ${generatedId}, found:`, element);
    }
    
    // 3. 직접 제목 텍스트로 요소 찾기
    if (!element) {
      const headings = document.querySelectorAll('h2, h3');
      Array.from(headings).forEach((heading) => {
        if (heading.textContent?.trim() === item.text && !element) {
          element = heading as HTMLElement;
          console.log(`Found element by text content: ${item.text}`, element);
        }
      });
    }
    
    if (element) {
      // 스크롤 위치 조정 (헤더 높이 고려)
      const yOffset = -80; // 헤더 높이에 맞게 조정
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(item.anchor);
    } else {
      console.error(`Element not found for menu item: ${item.text}`);
      // 디버깅용: 페이지의 모든 ID와 헤딩 출력
      console.log('All headings on page:', 
        Array.from(document.querySelectorAll('h2, h3'))
          .map(el => ({ id: el.id, tagName: el.tagName, text: el.textContent }))
      );
    }
  };

  // 목차 컴포넌트
  const TableOfContents = () => {
    return (
      <Card className="md:col-span-1 sticky top-4 shadow-md border-primary-100 bg-primary-50/30 h-[calc(100vh-2rem)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <FiBook className="h-5 w-5 mr-2 text-primary-600" />
            {language === 'ko' ? '목차' : language === 'en' ? 'Contents' : 'สารบัญ'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 overflow-y-auto h-[calc(100%-4rem)]">
          <nav className="space-y-0.5 text-sm">
            {menuItems.map((item, index) => (
              <div 
                key={index} 
                className="toc-item"
                style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
              >
                <button
                  onClick={() => handleMenuClick(item)}
                  className={`w-full text-left py-1.5 px-3 rounded-md transition-colors hover:bg-primary-100 hover:text-primary-700 flex items-center ${
                    activeSection === item.anchor ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-600'
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{item.text}</span>
                </button>
              </div>
            ))}
          </nav>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center mb-8 border-b border-gray-200 pb-4">
        <FiBookOpen className="h-8 w-8 text-primary-600 mr-3" />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{getTitle()}</h1>
          <p className="text-gray-500 mt-1">{getSubtitle()}</p>
        </div>
      </div>

      {isLoading ? (
        <Card className="shadow-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-500">{t('common.loading')}</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="shadow-md border-red-300">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-red-500">
              <FiHelpCircle className="h-12 w-12 mb-2" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 목차 */}
          <TableOfContents />

          {/* 내용 */}
          <Card className="md:col-span-3 shadow-md">
            <CardContent className="prose max-w-none p-6" ref={contentRef}>
              <ReactMarkdown
                components={{
                  // 마크다운의 제목에 ID를 추가하여 앵커 링크 구현
                  h1: ({ node, children, ...props }) => {
                    // 제목 텍스트를 추출
                    const titleText = typeof children?.[0] === 'string' 
                      ? children[0].trim() 
                      : '';
                    
                    // 목차 관련 헤딩은 숨김 처리
                    if (
                      titleText.includes('Table of Contents') || 
                      titleText.includes('목차') || 
                      titleText.includes('สารบัญ')
                    ) {
                      return null;
                    }
                    
                    // 일반 h1 렌더링
                    return <h1 {...props}>{children}</h1>;
                  },
                  h2: ({ node, children, ...props }) => {
                    // 제목 텍스트를 추출하고 ID로 변환
                    const titleText = typeof children?.[0] === 'string' 
                      ? children[0].trim() 
                      : '';
                    
                    // 목차 관련 헤딩은 숨김 처리
                    if (
                      titleText.includes('Table of Contents') || 
                      titleText === '목차' || 
                      titleText === 'สารบัญ'
                    ) {
                      return null;
                    }
                    
                    // 언어별 특별 처리
                    const specialMappings = {
                      'en': {
                        'Introduction': 'introduction',
                        'Login': 'login',
                        'Dashboard': 'dashboard',
                        'Issue Management': 'issue-management',
                        'Employee Management': 'employee-management',
                        'Settings': 'settings',
                        'Language Change': 'language-change',
                        'Password Change': 'password-change',
                        'Logout': 'logout'
                      },
                      'th': {
                        'บทนำ': 'บทนำ',
                        'การเข้าสู่ระบบ': 'การเข้าสู่ระบบ',
                        'แดชบอร์ด': 'แดชบอร์ด',
                        'การจัดการปัญหา': 'การจัดการปัญหา',
                        'การจัดการพนักงาน': 'การจัดการพนักงาน',
                        'การตั้งค่า': 'การตั้งค่า',
                        'การเปลี่ยนภาษา': 'การเปลี่ยนภาษา',
                        'การเปลี่ยนรหัสผ่าน': 'การเปลี่ยนรหัสผ่าน',
                        'การออกจากระบบ': 'การออกจากระบบ'
                      },
                      'ko': {
                        '소개': 'section-intro',
                        '로그인': 'section-login',
                        '대시보드': 'section-dashboard',
                        '이슈 관리': 'section-issues',
                        '직원 관리': 'section-employees',
                        '설정': 'section-settings',
                        '언어 변경': 'section-language',
                        '비밀번호 변경': 'section-password',
                        '로그아웃': '로그아웃'
                      }
                    };
                    
                    // 현재 언어에 대한 매핑 가져오기
                    const currentLangMappings = specialMappings[language as keyof typeof specialMappings] || {};
                    
                    // 매핑된 ID 또는 기본 ID 생성
                    let headingId = currentLangMappings[titleText] || generateId(titleText);
                    
                    // 로그아웃 섹션 특별 처리
                    if (
                      titleText === '로그아웃' || 
                      titleText === 'Logout' || 
                      titleText === 'ออกจากระบบ' ||
                      titleText === 'การออกจากระบบ'
                    ) {
                      // 로그아웃은 원래 텍스트를 그대로 ID로 사용
                      headingId = titleText;
                    }
                    
                    console.log(`Rendering h2 with ID: ${headingId} from text: "${titleText}" in ${language}`);
                    
                    return (
                      <h2 id={headingId} {...props} className="scroll-mt-24">
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ node, children, ...props }) => {
                    // 제목 텍스트를 추출하고 ID로 변환
                    const titleText = typeof children?.[0] === 'string' 
                      ? children[0].trim() 
                      : '';
                    
                    // 언어별로 적절한 ID 생성
                    let headingId;
                    if (language === 'en') {
                      headingId = titleText.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                    } else if (language === 'th') {
                      // 태국어는 원본 텍스트 사용
                      headingId = generateId(titleText);
                    } else {
                      // 한국어
                      headingId = generateId(titleText);
                    }
                    
                    console.log(`Rendering h3 with ID: ${headingId} from text: "${titleText}" in ${language}`);
                    
                    return (
                      <h3 id={headingId} {...props} className="scroll-mt-24">
                        {children}
                      </h3>
                    );
                  },
                  // 이미지 참조를 숨김 처리
                  img: () => {
                    // 이미지 렌더링을 하지 않고 null 반환
                    return null;
                  },
                  // 테이블 제거 (목차 테이블)
                  table: ({ node, ...props }) => {
                    // 테이블 내용을 검사하여 목차 테이블인지 확인
                    const tableContent = JSON.stringify(props);
                    if (
                      tableContent.includes('Table of Contents') || 
                      tableContent.includes('Introduction') || 
                      tableContent.includes('Login') ||
                      tableContent.includes('Dashboard') ||
                      tableContent.includes('소개') ||
                      tableContent.includes('로그인') ||
                      tableContent.includes('대시보드') ||
                      tableContent.includes('บทนำ') ||
                      tableContent.includes('การเข้าสู่ระบบ')
                    ) {
                      return null; // 목차 테이블로 판단되면 숨김
                    }
                    
                    // 일반 테이블은 정상 렌더링
                    return <table {...props} />;
                  },
                  // 목차를 감싸는 div 제거 (일부 마크다운에서 목차를 div로 감싸는 경우)
                  div: ({ node, children, ...props }) => {
                    // div의 className이나 내용을 통해 목차 관련 div 확인
                    const className = props.className || '';
                    const divContent = JSON.stringify(children);
                    
                    if (
                      className.includes('toc') ||
                      className.includes('table-of-contents') ||
                      divContent.includes('Table of Contents') ||
                      divContent.includes('Introduction') ||
                      divContent.includes('Login') ||
                      divContent.includes('Dashboard')
                    ) {
                      return null; // 목차 관련 div 숨김
                    }
                    
                    return <div {...props}>{children}</div>;
                  },
                  // 이미지 경로 텍스트가 포함된 문단 필터링
                  p: ({ node, children, ...props }) => {
                    // 문단의 텍스트 내용 추출
                    const text = React.Children.toArray(children)
                      .map(child => {
                        if (typeof child === 'string') return child;
                        if (typeof child === 'object' && 'props' in child) {
                          return child.props.children;
                        }
                        return '';
                      })
                      .join('');
                    
                    // 특정 패턴이 포함된 문단 숨김
                    if (
                      text.includes('(이미지 경로)') || 
                      text.includes('(image path)') || 
                      text.includes('(เส้นทางรูปภาพ)') ||
                      (text.includes('화면') && text.includes(']')) ||
                      (text.includes('Screen') && text.includes(']')) ||
                      (text.includes('หน้า') && text.includes(']')) ||
                      text.includes('Table of Contents')
                    ) {
                      return null;
                    }
                    
                    return <p {...props}>{children}</p>;
                  }
                }}
              >
                {processedContent}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 스크롤 탑 버튼 */}
      {showScrollTop && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-[76px] right-4 rounded-full p-2 bg-white shadow-md hover:bg-gray-100 z-50"
          onClick={scrollToTop}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="m18 15-6-6-6 6"/>
          </svg>
        </Button>
      )}
    </div>
  );
} 