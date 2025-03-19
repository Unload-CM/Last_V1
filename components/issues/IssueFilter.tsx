'use client';

import { useState, useEffect } from 'react';
import useTranslation from '../../utils/i18n';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiCalendar, FiX } from 'react-icons/fi';

// 필터에 사용될 상수들
const ISSUE_STATUSES = [
  { value: 'OPEN', label: '이름' },
  { value: 'IN_PROGRESS', label: '이름' },
  { value: 'RESOLVED', label: '이름' },
  { value: 'CLOSED', label: '이름' },
];

const ISSUE_PRIORITIES = [
  { value: 'CRITICAL', label: '심각' },
  { value: 'HIGH', label: '높음' },
  { value: 'MEDIUM', label: '중간' },
  { value: 'LOW', label: '낮음' },
];

const ISSUE_CATEGORIES = [
  { value: '설비', label: '설비' },
  { value: '원자재', label: '원자재' },
  { value: '관리', label: '관리' },
];

const DEPARTMENTS = [
  { value: '생산부', label: '생산부' },
  { value: '품질관리부', label: '품질관리부' },
  { value: '물류창고', label: '물류창고' },
  { value: '자재관리', label: '자재관리' },
];

interface DateRange {
  from: string;
  to: string;
}

interface IssueFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: {
    status: string;
    priority: string;
    category: string;
    department: string;
    dateRange: DateRange;
  };
  setFilters: (filters: any) => void;
  isHorizontal?: boolean; // 가로 방향 표시 여부
}

export default function IssueFilter({ 
  searchTerm, 
  setSearchTerm, 
  filters, 
  setFilters,
  isHorizontal = false
}: IssueFilterProps) {
  const { t } = useTranslation();
  const [statuses, setStatuses] = useState<Array<{id: string; name: string; description: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // DB에서 상태 데이터 가져오기
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/status');
        if (!response.ok) {
          throw new Error('상태 데이터를 가져오는데 실패했습니다');
        }
        const data = await response.json();
        setStatuses(data.statuses);
      } catch (error) {
        console.error('상태 데이터 로딩 중 오류:', error);
        setError('상태 데이터를 불러올 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatuses();
  }, []);

  // 각 필터 섹션의 확장 상태
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    priority: true,
    category: true,
    department: true,
    date: false,
  });
  
  // 섹션 토글
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };
  
  // 필터 변경 처리
  const handleFilterChange = (key: string, value: string) => {
    if (key === 'dateRange') {
      return; // 날짜 범위는 별도로 처리
    }
    
    // 현재 선택된 값과 같은 값이 선택되면 필터 해제
    const newValue = filters[key as keyof typeof filters] === value ? '' : value;
    setFilters({
      ...filters,
      [key]: newValue,
    });
  };
  
  // 날짜 변경 처리
  const handleDateChange = (dateKey: keyof DateRange, value: string) => {
    setFilters({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [dateKey]: value,
      },
    });
  };
  
  // 모든 필터 초기화
  const resetAllFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      department: '',
      dateRange: { from: '', to: '' },
    });
    setSearchTerm('');
  };
  
  return (
    <div className={`${isHorizontal ? 'flex flex-wrap gap-4' : 'space-y-6'}`}>
      {/* 검색 필드 - 수평 레이아웃에서는 더 넓게 */}
      {!isHorizontal && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="이슈 검색..."
              className="input pr-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <FiSearch className="text-gray-400" />
            </div>
          </div>
        </div>
      )}
      
      {/* 필터 섹션 */}
      {isHorizontal ? (
        // 수평 레이아웃
        <>
          {/* 검색 필드 */}
          <div className="w-full md:w-auto flex-grow md:flex-grow-0 mb-4 md:mb-0">
            <div className="relative">
              <input
                type="text"
                placeholder="이슈 검색..."
                className="input pr-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <FiSearch className="text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* 상태 필터 - 드롭다운 */}
          <div className="w-full md:w-auto">
            <select
              className="select w-full"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              disabled={isLoading}
            >
              <option value="">상태: 전체</option>
              {statuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          
          {/* 우선순위 필터 - 드롭다운 */}
          <div className="w-full md:w-auto">
            <select
              className="select w-full"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">우선순위: 전체</option>
              {ISSUE_PRIORITIES.map(priority => (
                <option key={priority.value} value={priority.value}>
                  우선순위: {priority.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* 카테고리 필터 - 드롭다운 */}
          <div className="w-full md:w-auto">
            <select
              className="select w-full"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">카테고리: 전체</option>
              {ISSUE_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  카테고리: {category.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* 부서 필터 - 드롭다운 */}
          <div className="w-full md:w-auto">
            <select
              className="select w-full"
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="">부서: 전체</option>
              {DEPARTMENTS.map(department => (
                <option key={department.value} value={department.value}>
                  부서: {department.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* 필터 초기화 버튼 */}
          <div className="w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={resetAllFilters}
              className="btn btn-outline btn-sm flex items-center space-x-2"
            >
              <FiX />
              <span>필터 초기화</span>
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {/* 검색창 */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="이슈 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* 필터 헤더 */}
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FiFilter className="mr-2 text-gray-500" />
              <h3 className="text-md font-medium text-gray-700">필터</h3>
            </div>
            <button
              type="button"
              className="text-sm text-primary-600 hover:text-primary-500"
              onClick={resetAllFilters}
            >
              필터 초기화
            </button>
          </div>
          
          {/* 상태 필터 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <h4
                className="text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => toggleSection('status')}
              >
                상태
              </h4>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => toggleSection('status')}
              >
                {expandedSections.status ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
            
            {expandedSections.status && (
              <div className="space-y-2 pt-2">
                {statuses.map((status) => (
                  <label key={status.id} className="flex items-center group">
                    <input
                      type="radio"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={filters.status === status.id}
                      onChange={() => handleFilterChange('status', status.id)}
                    />
                    <span className="ml-2 text-sm text-gray-700">{status.name}</span>
                    {status.description && (
                      <span className="ml-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        ({status.description})
                      </span>
                    )}
                  </label>
                ))}
                <label className="flex items-center">
                  <input
                    type="radio"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={filters.status === ''}
                    onChange={() => handleFilterChange('status', '')}
                  />
                  <span className="ml-2 text-sm text-gray-700">모두</span>
                </label>
              </div>
            )}
          </div>
          
          {/* 우선순위 필터 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <h4
                className="text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => toggleSection('priority')}
              >
                우선순위
              </h4>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => toggleSection('priority')}
              >
                {expandedSections.priority ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
            
            {expandedSections.priority && (
              <div className="space-y-2 pt-2">
                {ISSUE_PRIORITIES.map((priority) => (
                  <label key={priority.value} className="flex items-center">
                    <input
                      type="radio"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={filters.priority === priority.value}
                      onChange={() => handleFilterChange('priority', priority.value)}
                    />
                    <span className="ml-2 text-sm text-gray-700">{priority.label}</span>
                  </label>
                ))}
                <label className="flex items-center">
                  <input
                    type="radio"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={filters.priority === ''}
                    onChange={() => handleFilterChange('priority', '')}
                  />
                  <span className="ml-2 text-sm text-gray-700">모두</span>
                </label>
              </div>
            )}
          </div>
          
          {/* 카테고리 필터 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <h4
                className="text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => toggleSection('category')}
              >
                카테고리
              </h4>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => toggleSection('category')}
              >
                {expandedSections.category ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
            
            {expandedSections.category && (
              <div className="space-y-2 pt-2">
                {ISSUE_CATEGORIES.map((category) => (
                  <label key={category.value} className="flex items-center">
                    <input
                      type="radio"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={filters.category === category.value}
                      onChange={() => handleFilterChange('category', category.value)}
                    />
                    <span className="ml-2 text-sm text-gray-700">{category.label}</span>
                  </label>
                ))}
                <label className="flex items-center">
                  <input
                    type="radio"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={filters.category === ''}
                    onChange={() => handleFilterChange('category', '')}
                  />
                  <span className="ml-2 text-sm text-gray-700">모두</span>
                </label>
              </div>
            )}
          </div>
          
          {/* 부서 필터 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <h4
                className="text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => toggleSection('department')}
              >
                담당 부서
              </h4>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => toggleSection('department')}
              >
                {expandedSections.department ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
            
            {expandedSections.department && (
              <div className="space-y-2 pt-2">
                {DEPARTMENTS.map((department) => (
                  <label key={department.value} className="flex items-center">
                    <input
                      type="radio"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={filters.department === department.value}
                      onChange={() => handleFilterChange('department', department.value)}
                    />
                    <span className="ml-2 text-sm text-gray-700">{department.label}</span>
                  </label>
                ))}
                <label className="flex items-center">
                  <input
                    type="radio"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={filters.department === ''}
                    onChange={() => handleFilterChange('department', '')}
                  />
                  <span className="ml-2 text-sm text-gray-700">모두</span>
                </label>
              </div>
            )}
          </div>
          
          {/* 날짜 필터 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <h4
                className="text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => toggleSection('date')}
              >
                날짜 범위
              </h4>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => toggleSection('date')}
              >
                {expandedSections.date ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
            
            {expandedSections.date && (
              <div className="space-y-4 pt-2">
                <div>
                  <label htmlFor="from-date" className="block text-sm font-medium text-gray-700 mb-1">
                    시작일
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="from-date"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={filters.dateRange.from}
                      onChange={(e) => handleDateChange('from', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="to-date" className="block text-sm font-medium text-gray-700 mb-1">
                    종료일
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="to-date"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={filters.dateRange.to}
                      onChange={(e) => handleDateChange('to', e.target.value)}
                    />
                  </div>
                </div>
                
                <button
                  type="button"
                  className="text-sm text-primary-600 hover:text-primary-500"
                  onClick={() => {
                    handleDateChange('from', '');
                    handleDateChange('to', '');
                  }}
                >
                  날짜 초기화
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 