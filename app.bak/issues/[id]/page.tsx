'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiCalendar, FiUser, FiTag, FiAlertCircle, FiImage, FiMessageCircle, FiClock, FiCheck, FiClipboard, FiEdit, FiX, FiTrash2 } from 'react-icons/fi';
import Link from 'next/link';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import IssueComments from "@/components/issues/IssueComments";
import IssueAttachments from "@/components/issues/IssueAttachments";
import IssueHistory from "@/components/issues/IssueHistory";
import useTranslation from '@/utils/i18n';
import { useMediaQuery } from 'react-responsive';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useSession } from 'next-auth/react';

// 타입 정의
interface Issue {
  id: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  creator?: {
    id: number;
    koreanName: string;
    employeeId?: string;
  };
  assignee?: {
    id: number;
    koreanName: string;
    thaiName?: string;
    nickname?: string;
    department: {
      id: number;
      name: string;
      label: string;
      thaiLabel?: string;
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
      thaiLabel?: string;
    };
  };
  department: {
    id: number;
    name: string;
    label: string;
    thaiLabel?: string;
  };
  transferredFromDept?: {
    id: number;
    name: string;
    label: string;
    thaiLabel?: string;
  };
  status: {
    id: number;
    name: string;
    label: string;
    thaiLabel?: string;
  };
  priority: {
    id: number;
    name: string;
    label: string;
    thaiLabel?: string;
  };
  category: {
    id: number;
    name: string;
    label: string;
    thaiLabel?: string;
  };
  attachments?: Array<{
    id: number;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    createdAt: string;
    uploader?: {
      id: number;
      koreanName: string;
      thaiName?: string;
      nickname?: string;
    };
  }>;
  history?: any[];
  notifications?: any[];
}

export default function IssuePage() {
  const { t, language } = useTranslation();
  const params = useParams() as { id: string };
  const router = useRouter();
  const { data: session } = useSession();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [statusChanging, setStatusChanging] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [timeline, setTimeline] = useState<any[]>([]);
  const [adminComment, setAdminComment] = useState<string>('');
  const [adminComments, setAdminComments] = useState<Array<{
    id: string;
    content: string;
    createdAt: string;
    createdBy: string;
  }>>([]);
  const [isStatusChanging, setIsStatusChanging] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모바일 환경 감지
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // 유틸리티 함수들
  // 간단한 날짜 포맷 함수
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    
    // 유효한 날짜인지 확인
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('유효하지 않은 날짜 형식:', dateString);
      return '-';
    }
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 시간 포맷 함수
  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    
    // 유효한 날짜인지 확인
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('유효하지 않은 날짜 형식:', dateString);
      return '-';
    }
    
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 날짜와 시간 모두 포맷 - 유효성 검사 추가
  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    
    // 유효한 날짜인지 확인
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('유효하지 않은 날짜 형식:', dateString);
      return '-';
    }
    
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
  };

  // 상태 레이블 함수
  const getStatusLabel = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'OPEN':
        return t('status.open');
      case 'IN_PROGRESS':
        return t('status.in_progress');
      case 'RESOLVED':
        return t('status.resolved');
      case 'CLOSED':
        return t('status.closed');
      default:
        return status;
    }
  };

  // 우선순위 레이블 함수
  const getPriorityLabel = (priority: string) => {
    const upperPriority = priority.toUpperCase();
    switch (upperPriority) {
      case 'CRITICAL':
        return t('priority.critical');
      case 'HIGH':
        return t('priority.high');
      case 'MEDIUM':
        return t('priority.medium');
      case 'LOW':
        return t('priority.low');
      default:
        return priority;
    }
  };

  // 상태에 따른 색상 스타일
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
      case '미해결':
        return 'bg-blue-500';
      case 'in_progress':
      case '진행중':
        return 'bg-yellow-500';
      case 'resolved':
      case '해결됨':
        return 'bg-green-500';
      case 'closed':
      case '종료':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 우선순위에 따른 색상 스타일
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

  // 상태 배지 스타일 함수
  const getStatusBadgeStyle = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'OPEN':
      case '미해결':
        return 'bg-red-100 text-red-800';
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

  // 우선순위 배지 스타일 함수
  const getPriorityBadgeStyle = (priority: string) => {
    const upperPriority = priority.toUpperCase();
    switch (upperPriority) {
      case 'CRITICAL':
      case '심각':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
      case '높음':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
      case '중간':
        return 'bg-blue-100 text-blue-800';
      case 'LOW':
      case '낮음':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 파일 미리보기 컴포넌트
  const FilePreview = ({ file, openImageModal }: { file: any, openImageModal: (url: string) => void }) => {
    if (!file || !file.url) {
      return <div className="text-red-500">{t('issues.fileNotFound')}</div>;
    }

    if (file.type?.startsWith('image/')) {
      return (
        <div className="relative group">
          <img
            src={file.url}
            alt={file.caption || t('issues.image')}
            className="w-full h-auto rounded-lg shadow-sm cursor-pointer transition-transform hover:scale-105"
            onClick={() => openImageModal(file.url)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/placeholder-image.png'; // 기본 이미지로 대체
            }}
          />
          {file.caption && (
            <div className="mt-2 text-sm text-gray-600">{file.caption}</div>
          )}
        </div>
      );
    } else if (file.type?.startsWith('video/')) {
      return (
        <VideoPlayer
          src={file.url}
          type={file.type}
          caption={file.caption}
        />
      );
    }
    return <div className="text-gray-500">{t('issues.unsupportedFileType')}</div>;
  };

  // 현재 언어에 맞는 부서 이름 표시 함수
  const getDepartmentDisplayName = (dept: any) => {
    if (!dept) return '-';
    
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

  // 상태 표시명 가져오기
  const getStatusDisplayName = (status: any) => {
    if (!status) return '-';
    if (language === 'en') return status.name;
    if (language === 'th') return status.thaiLabel || status.label;
    return status.label; // 기본값 한국어
  };
  
  // 우선순위 표시명 가져오기
  const getPriorityDisplayName = (priority: any) => {
    if (!priority) return '-';
    if (language === 'en') return priority.name;
    if (language === 'th') return priority.thaiLabel || priority.label;
    return priority.label; // 기본값 한국어
  };
  
  // 카테고리 표시명 가져오기
  const getCategoryDisplayName = (category: any) => {
    if (!category) return '-';
    if (language === 'en') return category.name;
    if (language === 'th') return category.thaiLabel || category.label;
    return category.label; // 기본값 한국어
  };

  useEffect(() => {
    const fetchIssue = async () => {
      if (!params || !params.id) {
        router.push('/issues');
        return;
      }

      try {
        console.log('[디버그] 이슈 상세 정보 요청:', params.id);
        const response = await fetch(`/api/issues/${params.id}?lang=${language}`);
        console.log('[디버그] 응답 상태:', response.status, response.statusText);

        if (!response.ok) {
          throw new Error('이슈를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        console.log('[디버그] 이슈 데이터:', data);
        console.log('[디버그] 이슈 데이터 구조:', {
          id: data?.id,
          hasStatus: !!data?.status,
          statusName: data?.status?.name,
          hasPriority: !!data?.priority,
          priorityName: data?.priority?.name,
          attachments: data?.attachments?.length || '없음'
        });

        // 여기서 issue에 데이터 설정
        setIssue(data);
      } catch (err) {
        console.error('이슈 상세 정보 조회 중 오류:', err);
        setError('이슈를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssue();

    // 관리자 여부 확인
    const isAdminUser = localStorage.getItem('adminUser') === 'true';
    setIsAdmin(isAdminUser);

    // 코멘트 로드
    const loadComments = async () => {
      const issueId = params?.id;
      if (!issueId) return;
      
      try {
        const response = await fetch(`/api/issues/${issueId}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        }
      } catch (err) {
        console.error('댓글 로딩 오류:', err);
      }
    };

    // 관리자 코멘트 로드
    const loadAdminComments = () => {
      const issueId = params?.id;
      if (!issueId) return;
      
      const savedComments = localStorage.getItem(`adminComments_${issueId}`);
      if (savedComments) {
        try {
          setAdminComments(JSON.parse(savedComments));
        } catch (e) {
          console.error('관리자 코멘트 파싱 오류:', e);
        }
      }
    };

    loadComments();
    loadAdminComments();
  }, [params, router]);

  // 이슈 삭제 핸들러
  const handleDelete = async () => {
    if (!issue) {
      toast.error(t('issues.notFound'));
      return;
    }
    
    // 디버깅용 로그 추가
    console.log('삭제 권한 확인:', {
      sessionUserId: session?.user?.id,
      creatorInfo: issue.creator,
      creatorId: issue.creator?.id,
      isCreator: issue.creator?.id === Number(session?.user?.id)
    });
    
    // 세션 정보 확인
    if (!session?.user?.id) {
      toast.error(t('issues.loginRequired'));
      return;
    }
    
    // 이슈의 작성자인지 확인 (ID로 비교)
    const hasDeletePermission = issue.creator?.id === Number(session.user.id);
    
    if (!hasDeletePermission) {
      toast.error(t('issues.onlyCreatorCanDelete'));
      return;
    }
    
    // 이슈를 삭제할 권한이 있는 경우 삭제 확인 모달 표시
    setShowDeleteModal(true);
  };

  // 삭제 확인 후 실제 삭제 처리
  const confirmDelete = async () => {
    if (!issue) {
      toast.error(t('issues.notFound'));
      setShowDeleteModal(false);
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/issues/${issue.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(t('issues.deleteSuccess'));
        router.push('/issues');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t('issues.deleteFailed'));
      }
    } catch (error) {
      console.error('이슈 삭제 중 오류 발생:', error);
      toast.error(t('issues.deleteFailed'));
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">{t('common.loading')}</div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">{t('issues.notFound')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid gap-6">
        <Card className={isMobile ? "p-3" : "p-6"}>
          <Suspense fallback={<div>{t('common.loading')}</div>}>
            <Card>
              <CardHeader className={isMobile ? "px-3 py-3 pb-2" : "pb-4"}>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/issues')}
                      className="p-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size={isMobile ? "sm" : "default"}
                        onClick={() => router.push(`/issues/${issue.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {t('common.edit')}
                      </Button>
                      
                      {/* 이슈 작성자만 삭제 버튼 활성화, 아닌 경우 비활성화된 버튼과 툴팁 표시 */}
                      {(() => {
                        // 콘솔에 creator 정보 출력
                        console.log('삭제 버튼 렌더링:', {
                          sessionUserId: session?.user?.id,
                          creatorInfo: issue.creator,
                          creatorId: issue.creator?.id,
                          isCreator: issue.creator?.id === Number(session?.user?.id)
                        });
                        
                        // creator가 없는 경우(API에서 정보를 제대로 가져오지 못한 경우) 혹은 작성자인 경우 - 버튼 활성화
                        const canDeleteIssue = !issue.creator || (session?.user?.id && issue.creator?.id === Number(session.user.id));
                        
                        if (canDeleteIssue) {
                          return (
                            <Button 
                              variant="destructive"
                              size={isMobile ? "sm" : "default"}
                              onClick={handleDelete}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              {t('common.delete')}
                            </Button>
                          );
                        } else {
                          return (
                            <Button 
                              variant="destructive"
                              size={isMobile ? "sm" : "default"}
                              disabled={true}
                              title={t('issues.onlyCreatorCanDelete')}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              {t('common.delete')}
                            </Button>
                          );
                        }
                      })()}
                    </div>
                  </div>

                  <div>
                    <CardTitle className={`${isMobile ? "text-xl" : "text-2xl"} font-bold mb-2`}>
                      {issue.title}
                    </CardTitle>
                    <p className="text-gray-600 text-sm whitespace-pre-line">
                      {issue.description || t('issues.noDescription')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className={isMobile ? "px-2 py-2" : ""}>
                {/* 1. 날짜 정보 (Created Date, Updated At, Due Date) */}
                <div className={`mb-4 ${isMobile ? "text-sm" : ""}`}>
                  <div className={`
                    p-3 bg-gray-50 rounded-lg
                    ${isMobile 
                      ? "flex flex-col space-y-2" 
                      : "grid grid-cols-3 gap-4"}
                  `}>
                    <div className={isMobile 
                      ? "flex items-center justify-between"
                      : "flex items-center"
                    }>
                      <span className="font-medium text-gray-700">{t('issues.createdAt')}: </span>
                      <span className="ml-2">{formatDateTime(issue.createdAt)}</span>
                    </div>
                    <div className={isMobile 
                      ? "flex items-center justify-between"
                      : "flex items-center justify-center"
                    }>
                      <span className="font-medium text-gray-700">{t('issues.updatedAt')}: </span>
                      <span className="ml-2">{formatDateTime(issue.updatedAt)}</span>
                    </div>
                    {issue.dueDate && (
                      <div className={isMobile 
                        ? "flex items-center justify-between"
                        : "flex items-center justify-end"
                      }>
                        <span className="font-medium text-gray-700">{t('issues.dueDate')}: </span>
                        <span className="ml-2">{formatDateTime(issue.dueDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. 상태, 우선순위, 카테고리, 부서 정보 */}
                <div className={`mb-4 ${isMobile ? "text-sm" : ""}`}>
                  <div className={`
                    p-3 bg-gray-50 rounded-lg
                    ${isMobile ? "grid grid-cols-1 gap-3" : "flex"}
                  `}>
                    <div className={`${!isMobile && "flex-1 border-r-2 border-gray-300 px-4"} flex justify-between items-center`}>
                      <span className="font-medium text-gray-700">{t('issues.status')}:</span>
                      <div className={`inline-block px-2 py-1 rounded-full text-white text-sm ${getStatusColor(issue.status.name)}`}>
                        {getStatusDisplayName(issue.status)}
                      </div>
                    </div>

                    <div className={`${!isMobile && "flex-1 border-r-2 border-gray-300 px-4"} flex justify-between items-center`}>
                      <span className="font-medium text-gray-700">{t('issues.priority')}:</span>
                      <div className={`inline-block px-2 py-1 rounded-full text-white text-sm ${getPriorityColor(issue.priority?.name || '')}`}>
                        {getPriorityDisplayName(issue.priority)}
                      </div>
                    </div>

                    <div className={`${!isMobile && "flex-1 border-r-2 border-gray-300 px-4"} flex justify-between items-center`}>
                      <span className="font-medium text-gray-700">{t('issues.category')}:</span>
                      <span className="ml-2">{getCategoryDisplayName(issue.category)}</span>
                    </div>

                    <div className={`${!isMobile && "flex-1 px-4"} flex justify-between items-center`}>
                      <span className="font-medium text-gray-700">{t('issues.department')}:</span>
                      <span className="ml-2">{getDepartmentDisplayName(issue.department)}</span>
                    </div>
                  </div>
                </div>

                {/* Issue Finder와 Issue Resolver 정보 */}
                <div className="mb-4">
                  <div className={`p-3 bg-gray-50 rounded-lg ${isMobile ? "space-y-3" : ""}`}>
                    <div className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-2 gap-4"}`}>
                      <div className="overflow-hidden">
                        <div className="font-medium text-gray-700 mb-1">{t('issues.assignedTo')}</div>
                        <div className={`${isMobile ? "text-sm" : ""} truncate`}>
                          {issue.assignee ? (
                            <>
                              {issue.assignee.koreanName}
                              {issue.assignee.thaiName && ` (${issue.assignee.thaiName})`}
                              {issue.assignee.nickname && ` - ${issue.assignee.nickname}`}
                              {` | ${getDepartmentDisplayName(issue.assignee.department)}`}
                            </>
                          ) : (
                            <span className="text-gray-500">{t('issues.unassigned')}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="overflow-hidden">
                        <div className="font-medium text-gray-700 mb-1">{t('issues.solver')}</div>
                        <div className={`${isMobile ? "text-sm" : ""} truncate`}>
                          {issue.solver ? (
                            <>
                              {issue.solver.koreanName}
                              {issue.solver.thaiName && ` (${issue.solver.thaiName})`}
                              {issue.solver.nickname && ` - ${issue.solver.nickname}`}
                              {` | ${getDepartmentDisplayName(issue.solver.department)}`}
                            </>
                          ) : (
                            <span className="text-gray-500">{t('issues.unassigned')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <Card className={isMobile ? "border shadow-sm" : ""}>
                    <CardContent className={isMobile ? "p-2" : ""}>
                      <IssueAttachments 
                        issueId={issue.id} 
                        initialAttachments={issue.attachments || []}
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-4">
                  <IssueComments issueId={issue.id} />
                </div>

                <div>
                  <h3 className={`${isMobile ? "text-base" : "text-lg"} font-medium mb-2`}>{t('issues.history.title')}</h3>
                  <IssueHistory issueId={issue.id} />
                </div>
              </CardContent>
            </Card>
          </Suspense>
        </Card>
      </div>
      
      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('issues.confirmDelete')}</DialogTitle>
            <DialogDescription>
              {t('issues.confirmDeleteMessage')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
