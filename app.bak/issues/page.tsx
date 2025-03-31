'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, RefreshCw, Edit, Trash2, ArrowUp } from 'lucide-react';
import { format } from 'date-fns';
import useTranslation from '@/utils/i18n';
import { useMediaQuery } from 'react-responsive';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 이슈 타입 정의
interface Issue {
  id: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  assignee?: {
    id: number;
    koreanName: string;
    thaiName?: string;
    nickname?: string;
    department: {
      id: number;
      name: string;
      label: string;
    };
  };
  solver?: {
    id: number;
    koreanName: string;
    thaiName?: string;
    nickname?: string;
    department: {
      id: number;
      name: string;
      label: string;
    };
  };
  department: {
    id: number;
    name: string;
    label: string;
  };
  status: {
    id: number;
    name: string;
    label: string;
  };
  priority: {
    id: number;
    name: string;
    label: string;
  };
  category: {
    id: number;
    name: string;
    label: string;
  };
}

export default function IssuesPage() {
  const { t, language } = useTranslation();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  
  // 필터 데이터 상태
  const [departments, setDepartments] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  
  // 모바일 환경 감지
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // 무한 스크롤 관련 상태 추가
  const observerTarget = useRef<HTMLDivElement>(null);

  // 안전한 날짜 포맷 함수 추가
  const safeFormatDate = (dateString: string | null | undefined, formatPattern: string) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        console.warn('유효하지 않은 날짜 형식:', dateString);
        return '-';
      }
      return format(date, formatPattern);
    } catch (error) {
      console.error('날짜 포맷 오류:', error);
      return '-';
    }
  };

  const [isFilterDataLoading, setIsFilterDataLoading] = useState(true);

  // 설명 표시 상태 관리를 위한 상태 추가
  const [expandedIssueId, setExpandedIssueId] = useState<number | null>(null);
  const [hoveredIssueId, setHoveredIssueId] = useState<number | null>(null);

  // 설명 토글 핸들러
  const toggleDescription = (issueId: number) => {
    setExpandedIssueId(expandedIssueId === issueId ? null : issueId);
  };

  // 호버 핸들러
  const handleMouseEnter = (issueId: number) => {
    if (!isMobile) {
      setHoveredIssueId(issueId);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setHoveredIssueId(null);
    }
  };

  // 설명 텍스트 처리
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const router = useRouter();

  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const fetchIssues = async (loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (selectedDepartment && selectedDepartment !== 'all') {
        const departmentId = departments.find(d => d.id.toString() === selectedDepartment)?.id;
        if (departmentId) params.append('departmentId', departmentId.toString());
      }
      if (selectedStatus && selectedStatus !== 'all') {
        const statusId = statuses.find(s => s.id.toString() === selectedStatus)?.id;
        if (statusId) params.append('statusId', statusId.toString());
      }
      if (selectedPriority && selectedPriority !== 'all') {
        const priorityId = priorities.find(p => p.id.toString() === selectedPriority)?.id;
        if (priorityId) params.append('priorityId', priorityId.toString());
      }

      // 페이지네이션 파라미터 추가
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      params.append('lang', language);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/issues?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch issues');
      }
      const data = await response.json();
      
      if (loadMore) {
        setIssues(prev => [...prev, ...data.issues]);
      } else {
        setIssues(data.issues || []);
      }
      
      setTotalItems(data.totalItems || 0);
      setTotalPages(Math.ceil((data.totalItems || 0) / itemsPerPage));
      setHasMore(currentPage < Math.ceil((data.totalItems || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error(t('issues.loadingError'));
    } finally {
      if (loadMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  // 필터 데이터 로드
  const loadFilterData = async () => {
    try {
      setIsFilterDataLoading(true);
      const [departmentsRes, statusesRes, prioritiesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/departments`),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/settings/statuses`),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/settings/priorities`)
      ]);

      if (!departmentsRes.ok || !statusesRes.ok || !prioritiesRes.ok) {
        throw new Error(t('issues.filterDataError'));
      }

      const [departments, statuses, priorities] = await Promise.all([
        departmentsRes.json(),
        statusesRes.json(),
        prioritiesRes.json()
      ]);

      // 각 응답이 배열인지 확인하고, 필요한 경우 배열로 변환
      const departmentsArray = Array.isArray(departments) ? departments : 
                              departments?.departments || [];
      const statusesArray = Array.isArray(statuses) ? statuses : 
                           statuses?.statuses || [];
      const prioritiesArray = Array.isArray(priorities) ? priorities : 
                             priorities?.priorities || [];

      // 디버깅을 위한 로그 추가
      console.log('API 응답 데이터:', { departments, statuses, priorities });
      console.log('처리된 배열 데이터:', { departmentsArray, statusesArray, prioritiesArray });

      setDepartments(departmentsArray);
      setStatuses(statusesArray);
      setPriorities(prioritiesArray);
    } catch (error) {
      console.error('필터 데이터 로딩 중 오류:', error);
      toast.error(t('issues.filterDataError'));
    } finally {
      setIsFilterDataLoading(false);
    }
  };

  // 컴포넌트 마운트 시 필터 데이터 로드
  useEffect(() => {
    loadFilterData();
  }, []);

  // 무한 스크롤 Intersection Observer 설정
  useEffect(() => {
    if (!isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setCurrentPage(prev => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isMobile]);

  // 필터 변경 핸들러 추가
  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handlePriorityChange = (value: string) => {
    setSelectedPriority(value);
    setCurrentPage(1);
  };

  // 검색어 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 필터 변경 시 데이터 로드
  useEffect(() => {
    // 모바일에서 페이지 변경 시에는 fetchIssues를 호출하지 않음
    if (isMobile && currentPage > 1) return;
    
    // 검색어, 필터, 페이지당 항목 수 변경 시에는 첫 페이지부터 다시 로드
    fetchIssues(false);
  }, [debouncedSearchTerm, selectedDepartment, selectedStatus, selectedPriority, itemsPerPage]);

  // 모바일에서 페이지 변경 시 추가 데이터 로드
  useEffect(() => {
    if (!isMobile) return;
    if (currentPage > 1) {
      fetchIssues(true);
    }
  }, [currentPage]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case '심각':
        return 'bg-red-500';
      case 'high':
      case '높음':
        return 'bg-orange-500';
      case 'medium':
      case '중간':
        return 'bg-blue-500';
      case 'low':
      case '낮음':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'resolved':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 현재 언어에 맞는 필드 선택 함수
  const getDepartmentDisplayName = (dept: any) => {
    if (!dept) return '';
    
    // 디버깅용 로그 추가
    console.log('부서 표시 함수 호출됨:', {
      language,
      dept,
      name: dept.name,
      label: dept.label,
      thaiLabel: dept.thaiLabel
    });
    
    if (language === 'en') return dept.name;
    if (language === 'th') {
      // dept 객체에 thaiLabel이 있는지 확인
      if (dept.thaiLabel) {
        console.log(`부서 ${dept.name}의 thaiLabel 사용:`, dept.thaiLabel);
        return dept.thaiLabel;
      }
      
      // 없으면 translations에서 가져오기 시도
      try {
        const { departmentTranslationsThai } = require('@/lib/i18n/translations');
        if (departmentTranslationsThai[dept.name]) {
          console.log(`부서 ${dept.name}의 번역 찾음:`, departmentTranslationsThai[dept.name]);
          return departmentTranslationsThai[dept.name];
        }
      } catch (e) {
        console.error('번역 데이터 가져오기 오류:', e);
      }
      
      // 둘 다 없으면 기본 라벨 사용
      console.log(`부서 ${dept.name}의 한글 라벨로 폴백:`, dept.label);
      return dept.label;
    }
    return dept.label; // 기본값 한국어
  };

  // 이슈 아이템의 부서 표시 함수
  const getIssueDepartmentName = (issue: any) => {
    if (!issue.department) return '';
    return getDepartmentDisplayName(issue.department);
  };
  
  // 상태 표시명 가져오기
  const getStatusDisplayName = (status: any) => {
    if (!status) return '';
    if (language === 'en') return status.name;
    if (language === 'th') return status.thaiLabel || status.label;
    return status.label; // 기본값 한국어
  };
  
  // 우선순위 표시명 가져오기
  const getPriorityDisplayName = (priority: any) => {
    if (!priority) return '';
    if (language === 'en') return priority.name;
    if (language === 'th') return priority.thaiLabel || priority.label;
    return priority.label; // 기본값 한국어
  };
  
  // 카테고리 표시명 가져오기
  const getCategoryDisplayName = (category: any) => {
    if (!category) return '';
    if (language === 'en') return category.name;
    if (language === 'th') return category.thaiLabel || category.label;
    return category.label; // 기본값 한국어
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchIssues(false); // 페이지 변경 시 즉시 데이터 로드
  };

  // 페이지당 항목 수 변경 핸들러
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // 페이지당 항목 수가 변경되면 첫 페이지로 이동
    fetchIssues(false); // 데이터 즉시 다시 불러오기
  };

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setCurrentPage(1);
    setIssues([]);
    await loadFilterData();
    fetchIssues(false);
  };

  // 페이지 범위 계산 함수 추가
  const getPageRange = () => {
    const range: (number | string)[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    // 첫 페이지
    if (start > 1) {
      range.push(1);
      if (start > 2) range.push('...');
    }
    
    // 중간 페이지들
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    // 마지막 페이지
    if (end < totalPages) {
      if (end < totalPages - 1) range.push('...');
      range.push(totalPages);
    }
    
    return range;
  };

  const handleDelete = async (issueId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/issues/${issueId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete issue');
      }

      const data = await response.json();
      toast.success(t('issues.deleteSuccess'));
      setIssues(prev => prev.filter(issue => issue.id.toString() !== issueId));
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast.error(t('issues.deleteError'));
    }
  };

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

  return (
    <div className="container mx-auto py-6">
      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
            <CardTitle className="text-2xl font-bold">
              {t('nav.issues')}
            </CardTitle>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center gap-2">
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-[70px]">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {t('common.totalItems')}: {totalItems}
                  </span>
                </div>
                <Button onClick={() => router.push('/issues/new')} className="md:ml-2">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('issues.newIssue')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="md:px-6 px-3 space-y-4">
            {/* 검색 필드 */}
            <div className="flex flex-wrap gap-2">
              <div className="relative w-full md:w-auto flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder={t('issues.search')}
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchIssues()}
                  disabled={isFilterDataLoading}
                />
              </div>
              <Button variant="outline" onClick={handleRefresh} className="whitespace-nowrap" disabled={isLoading || isFilterDataLoading}>
                <RefreshCw className="mr-2 h-4 w-4" /> {t('common.refresh')}
              </Button>
            </div>

            {/* 필터 링크 - 모바일에서 두 줄로 표시 */}
            <div className={`flex flex-wrap gap-2 ${isMobile ? 'grid grid-cols-2' : ''}`}>
              <div className={isMobile ? 'w-full' : ''}>
                <Select value={selectedDepartment} onValueChange={handleDepartmentChange} disabled={isFilterDataLoading}>
                  <SelectTrigger className={isMobile ? 'w-full' : 'w-[140px]'}>
                    <SelectValue placeholder={t('issues.department')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('issues.allDepartments')}</SelectItem>
                    {Array.isArray(departments) ? departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {getDepartmentDisplayName(dept)}
                      </SelectItem>
                    )) : (
                      <SelectItem value="" disabled>
                        {t('issues.loadingError')}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className={isMobile ? 'w-full' : ''}>
                <Select value={selectedStatus} onValueChange={handleStatusChange} disabled={isFilterDataLoading}>
                  <SelectTrigger className={isMobile ? 'w-full' : 'w-[140px]'}>
                    <SelectValue placeholder={t('issues.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('issues.allStatuses')}</SelectItem>
                    {Array.isArray(statuses) ? statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        {getStatusDisplayName(status)}
                      </SelectItem>
                    )) : (
                      <SelectItem value="" disabled>
                        {t('issues.loadingError')}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className={isMobile ? 'w-full' : ''}>
                <Select value={selectedPriority} onValueChange={handlePriorityChange} disabled={isFilterDataLoading}>
                  <SelectTrigger className={isMobile ? 'w-full' : 'w-[140px]'}>
                    <SelectValue placeholder={t('issues.priority')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('issues.allPriorities')}</SelectItem>
                    {Array.isArray(priorities) ? priorities.map((priority) => (
                      <SelectItem key={priority.id} value={priority.id.toString()}>
                        {getPriorityDisplayName(priority)}
                      </SelectItem>
                    )) : (
                      <SelectItem value="" disabled>
                        {t('issues.loadingError')}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 이슈 목록 - 하이브리드 방식 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="grid gap-4 p-4">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow relative"
                    onMouseEnter={() => handleMouseEnter(issue.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* PC 버전 레이아웃 */}
                    <div className="hidden md:block">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <Link href={`/issues/${issue.id}`} className="text-lg font-medium hover:text-blue-600">
                            {issue.title}
                          </Link>
                          {issue.description && (
                            <div className="relative">
                              <p className="text-gray-600 text-sm mt-1 whitespace-pre-line line-clamp-2">
                                {issue.description}
                              </p>
                              {hoveredIssueId === issue.id && issue.description.length > 100 && (
                                <div className="absolute z-10 bg-white border rounded-lg shadow-lg p-4 max-w-lg mt-2 whitespace-pre-line">
                                  {issue.description}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Badge className={getStatusColor(issue.status.name)}>
                            {getStatusDisplayName(issue.status)}
                          </Badge>
                          <Badge className={getPriorityColor(issue.priority?.name || '')}>
                            {getPriorityDisplayName(issue.priority)}
                          </Badge>
                        </div>
                      </div>
                      {/* 이슈 발견자와 해결자 정보 (1*2 그리드) */}
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <span className="font-medium">{t('issues.assignedTo')}:</span>
                          <span className="ml-2">
                            {issue.assignee ? (
                              <span>
                                {issue.assignee.koreanName}
                                {issue.assignee.thaiName && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    {issue.assignee.thaiName}
                                    {issue.assignee.nickname && ` (${issue.assignee.nickname})`}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-400">{t('issues.unassigned')}</span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{t('issues.solver')}:</span>
                          <span className="ml-2">
                            {issue.solver ? (
                              <span>
                                {issue.solver.koreanName}
                                {issue.solver.thaiName && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    {issue.solver.thaiName}
                                    {issue.solver.nickname && ` (${issue.solver.nickname})`}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </span>
                        </div>
                      </div>
                      {/* 부서, 카테고리, 생성일, 마감일 정보 (1*4 그리드) */}
                      <div className="grid grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">{t('issues.department')}:</span>
                          <span className="ml-2">{getIssueDepartmentName(issue)}</span>
                        </div>
                        <div>
                          <span className="font-medium">{t('issues.category')}:</span>
                          <span className="ml-2">{getCategoryDisplayName(issue.category)}</span>
                        </div>
                        <div>
                          <span className="font-medium">{t('issues.createdAt')}:</span>
                          <span className="ml-2">{safeFormatDate(issue.createdAt, 'yyyy-MM-dd')}</span>
                        </div>
                        <div>
                          <span className="font-medium">{t('issues.dueDate')}:</span>
                          <span className="ml-2">
                            {issue.dueDate ? safeFormatDate(issue.dueDate, 'yyyy-MM-dd') : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 모바일 버전 레이아웃 */}
                    <div className="md:hidden">
                      {/* 상태와 우선순위 배지 */}
                      <div className="flex gap-2 mb-2">
                        <Badge className={getStatusColor(issue.status.name)}>
                          {getStatusDisplayName(issue.status)}
                        </Badge>
                        <Badge className={getPriorityColor(issue.priority?.name || '')}>
                          {getPriorityDisplayName(issue.priority)}
                        </Badge>
                      </div>

                      {/* 제목 */}
                      <div className="mb-2">
                        <h3 
                          className="text-base font-medium"
                          onClick={() => window.location.href = `/issues/${issue.id}`}
                        >
                          {issue.title}
                        </h3>
                        {/* 설명 추가 */}
                        {issue.description && (
                          <div className="mt-1">
                            <p className={`text-gray-600 text-sm whitespace-pre-line ${expandedIssueId === issue.id ? '' : 'line-clamp-2'}`}>
                              {issue.description}
                            </p>
                            {issue.description.length > 100 && (
                              <button
                                onClick={() => toggleDescription(issue.id)}
                                className="text-blue-500 text-sm mt-1 hover:underline"
                              >
                                {expandedIssueId === issue.id ? t('issues.collapse') : t('issues.expand')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Issue Finder와 Issue Resolver */}
                      <div className="grid grid-cols-1 gap-1 text-sm mb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">{t('issues.issueFinder')}:</span>
                          <span className="text-right">
                            {issue.assignee ? (
                              <>
                                {issue.assignee.koreanName}
                                {issue.assignee.thaiName && ` (${issue.assignee.thaiName})`}
                              </>
                            ) : (
                              t('issues.unassigned')
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">{t('issues.issueResolver')}:</span>
                          <span className="text-right">
                            {issue.solver ? (
                              <>
                                {issue.solver.koreanName}
                                {issue.solver.thaiName && ` (${issue.solver.thaiName})`}
                              </>
                            ) : (
                              t('issues.unassigned')
                            )}
                          </span>
                        </div>
                      </div>

                      {/* 부서, 카테고리, 날짜 정보 */}
                      <div className="grid grid-cols-1 gap-1 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">{t('issues.department')}:</span>
                          <span>{getIssueDepartmentName(issue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">{t('issues.category')}:</span>
                          <span>{getCategoryDisplayName(issue.category)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">{t('issues.createdAt')}:</span>
                          <span>{safeFormatDate(issue.createdAt, 'yyyy-MM-dd')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">{t('issues.dueDate')}:</span>
                          <span>
                            {issue.dueDate ? safeFormatDate(issue.dueDate, 'yyyy-MM-dd') : '-'}
                          </span>
                        </div>
                      </div>

                      {/* 편집/삭제 버튼 */}
                      <div className="flex justify-end gap-1 mt-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => router.push(`/issues/${issue.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(issue.id.toString())}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t('common.delete')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 로딩 상태 및 빈 상태 처리 */}
                {isLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  </div>
                )}
                
                {!isLoading && issues.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {t('issues.noIssuesFound')}
                  </div>
                )}
              </div>
            </div>

            {/* 페이지네이션 개선 */}
            {!isMobile && totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <div className="flex justify-center mt-4 space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="px-2"
                  >
                    {t('common.previous')}
                  </Button>
                  {getPageRange().map((page, index) => (
                    typeof page === 'number' ? (
                      <Button
                        key={index}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => handlePageChange(page)}
                        disabled={isLoading}
                        className="px-4"
                      >
                        {page}
                      </Button>
                    ) : (
                      <span key={index} className="px-2 py-2">...</span>
                    )
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className="px-2"
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            )}

            {isMobile && (
              <div ref={observerTarget} className="h-4 w-full flex justify-center">
                {isLoadingMore && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* 맨 위로 버튼 - PC 버전에서만 표시 */}
      {!isMobile && showScrollTop && (
        <Button
          className="fixed bottom-4 right-4 p-2 rounded-full shadow-lg"
          onClick={scrollToTop}
          size="icon"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
} 