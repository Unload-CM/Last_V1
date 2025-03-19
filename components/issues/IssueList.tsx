'use client';

import { useState, useEffect } from 'react';
import useTranslation from '../../utils/i18n';
import Link from 'next/link';
import { FiChevronRight, FiImage, FiCalendar, FiEye, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Issue {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category: string;
  department: string;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  images?: Array<{
    id: string;
    url: string;
    caption: string;
    createdAt: string;
  }>;
}

interface IssueListProps {
  issues: Issue[];
}

export default function IssueList({ issues }: IssueListProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;
  
  // 관리자 확인
  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      setIsAdmin(true);
    }
  }, []);

  // 이슈를 최신순으로 정렬
  const sortedIssues = [...issues].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // 페이지네이션 처리
  const totalPages = Math.ceil(sortedIssues.length / ITEMS_PER_PAGE);
  const paginatedIssues = sortedIssues.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );
  
  // 상태에 따른 배지 스타일
  const getStatusBadgeStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'OPEN':
      case '미해결':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
      case '진행중':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
      case '해결됨':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
      case '종료':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // 우선순위에 따른 배지 스타일
  const getPriorityBadgeStyle = (priority: string) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    
    switch (priority.toUpperCase()) {
      case 'CRITICAL':
      case '심각':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
      case '높음':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
      case '중간':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
      case '낮음':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // 상태 레이블
  const getStatusLabel = (status: string) => {
    if (!status) return '상태 없음';
    
    switch (status.toUpperCase()) {
      case 'OPEN':
        return '미해결';
      case 'IN_PROGRESS':
        return '진행중';
      case 'RESOLVED':
        return '해결됨';
      case 'CLOSED':
        return '종료';
      default:
        return status;
    }
  };
  
  // 우선순위 레이블
  const getPriorityLabel = (priority: string) => {
    if (!priority) return '우선순위 없음';
    
    switch (priority.toUpperCase()) {
      case 'CRITICAL':
        return '심각';
      case 'HIGH':
        return '높음';
      case 'MEDIUM':
        return '중간';
      case 'LOW':
        return '낮음';
      default:
        return priority;
    }
  };
  
  // 날짜 형식화
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy.MM.dd', { locale: ko });
    } catch (e) {
      return '날짜 오류';
    }
  };
  
  // 페이지 변경 처리
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // 삭제 모달 열기
  const openDeleteModal = (issueId: string) => {
    setSelectedIssueId(issueId);
    setShowDeleteModal(true);
  };

  // 삭제 모달 닫기
  const closeDeleteModal = () => {
    setSelectedIssueId(null);
    setShowDeleteModal(false);
  };

  // 이슈 삭제 함수
  const handleDelete = async () => {
    if (!selectedIssueId) return;

    try {
      const savedIssuesJSON = localStorage.getItem('issues');
      if (savedIssuesJSON) {
        const savedIssues = JSON.parse(savedIssuesJSON);
        const updatedIssues = savedIssues.filter((issue: any) => issue.id !== selectedIssueId);
        localStorage.setItem('issues', JSON.stringify(updatedIssues));
        
        // 관련된 데이터도 삭제
        localStorage.removeItem(`comments_${selectedIssueId}`);
        localStorage.removeItem(`timeline_${selectedIssueId}`);
        localStorage.removeItem(`adminComments_${selectedIssueId}`);
        
        // 페이지 새로고침
        window.location.reload();
      }
    } catch (error) {
      console.error('이슈 삭제 중 오류 발생:', error);
      alert('이슈를 삭제하는 중 오류가 발생했습니다.');
    } finally {
      closeDeleteModal();
    }
  };
  
  if (issues.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg shadow">
        <p className="text-gray-500">검색 결과가 없습니다</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                번호
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이슈 제목
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                우선순위
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리자
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                상세보기
              </th>
              {isAdmin && (
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  삭제
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedIssues.map((issue, index) => (
              <tr key={issue.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sortedIssues.length - ((page - 1) * ITEMS_PER_PAGE + index)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {issue.images && issue.images.length > 0 && (
                        <FiImage className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-2">
                      <div className="text-sm font-medium text-gray-900">
                        {issue.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        <FiCalendar className="inline mr-1" />
                        {formatDate(issue.createdAt)}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeStyle(issue.status)}`}>
                    {getStatusLabel(issue.status)}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadgeStyle(issue.priority)}`}>
                    {getPriorityLabel(issue.priority)}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {issue.createdBy}
                  {isAdmin && (
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      관리자
                    </span>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <Link 
                    href={`/issues/${issue.id}`}
                    className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <FiEye className="mr-1" />
                    상세보기
                  </Link>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => openDeleteModal(issue.id)}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <FiTrash2 className="mr-1" />
                      삭제
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                전체 <span className="font-medium">{issues.length}</span>개 중{' '}
                <span className="font-medium">{(page - 1) * ITEMS_PER_PAGE + 1}</span>-
                <span className="font-medium">
                  {Math.min(page * ITEMS_PER_PAGE, issues.length)}
                </span>
                개 표시
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">처음</span>
                  <span>처음</span>
                </button>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">이전</span>
                  <span>이전</span>
                </button>
                
                {/* 페이지 번호 */}
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">다음</span>
                  <span>다음</span>
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">마지막</span>
                  <span>마지막</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">이슈 삭제 확인</h3>
            <p className="text-gray-500 mb-4">정말로 이 이슈를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 