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
import Navigation from '@/components/Navigation';
import IssueComments from "@/components/issues/IssueComments";
import IssueAttachments from "@/components/issues/IssueAttachments";
import IssueHistory from "@/components/issues/IssueHistory";

// 간단한 날짜 포맷 함수
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 시간 포맷 함수 추가
function formatTime(dateString: string) {
  const date = new Date(dateString);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 날짜와 시간 모두 포맷
function formatDateTime(dateString: string) {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

// 상태에 따른 색상 스타일
function getStatusColor(status: string) {
  switch (status) {
    case '미해결':
      return 'bg-red-100 text-red-800';
    case '진행중':
      return 'bg-blue-100 text-blue-800';
    case '해결됨':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// 우선순위에 따른 색상 스타일
function getPriorityColor(priority: string) {
  switch (priority) {
    case '높음':
      return 'bg-red-100 text-red-800';
    case '중간':
      return 'bg-yellow-100 text-yellow-800';
    case '낮음':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

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
      return 'bg-yellow-100 text-yellow-800';
    case 'LOW':
    case '낮음':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// 상태 레이블 함수
const getStatusLabel = (status: string) => {
  const upperStatus = status.toUpperCase();
  switch (upperStatus) {
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

// 우선순위 레이블 함수
const getPriorityLabel = (priority: string) => {
  const upperPriority = priority.toUpperCase();
  switch (upperPriority) {
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

// 파일 미리보기 컴포넌트
const FilePreview = ({ file, openImageModal }: { file: any, openImageModal: (url: string) => void }) => {
  if (!file || !file.url) {
    return <div className="text-red-500">파일을 찾을 수 없습니다.</div>;
  }

  if (file.type?.startsWith('image/')) {
    return (
      <div className="relative group">
        <img
          src={file.url}
          alt={file.caption || '이미지'}
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
  return <div className="text-gray-500">지원하지 않는 파일 형식입니다.</div>;
};

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
  previousAssignee?: {
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
  transferredFromDept?: {
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
  history: Array<{
    id: number;
    changeType: string;
    previousValue: string | null;
    newValue: string;
    createdAt: string;
    changedBy: {
      id: number;
      koreanName: string;
      thaiName?: string;
      nickname?: string;
    };
  }>;
  notifications: Array<{
    id: number;
    type: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    employee: {
      id: number;
      koreanName: string;
      thaiName?: string;
      nickname?: string;
    };
  }>;
}

export default function IssuePage({ params }: { params: { id: string } }) {
  const router = useRouter();
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

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const response = await fetch(`/api/issues/${params.id}`);
        if (!response.ok) {
          throw new Error('이슈를 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setIssue(data.issue);
      } catch (error) {
        console.error('Error fetching issue:', error);
        toast.error('이슈를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssue();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('이 이슈를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/issues?id=${params.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('이슈 삭제에 실패했습니다.');
      }

      toast.success('이슈가 삭제되었습니다.');
      router.push('/issues');
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast.error('이슈 삭제에 실패했습니다.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Navigation />
        <div className="text-center py-8">로딩 중...</div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="container mx-auto p-6">
        <Navigation />
        <div className="text-center py-8">이슈를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Navigation />
      <div className="grid gap-6">
        <Card className="p-6">
          <Suspense fallback={<div>이슈 정보를 불러오는 중...</div>}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push('/issues')}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-2xl font-bold">{issue.title}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>생성일: {format(new Date(issue.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                    <span>•</span>
                    <span>수정일: {format(new Date(issue.updatedAt), 'yyyy-MM-dd HH:mm')}</span>
                    {issue.dueDate && (
                      <>
                        <span>•</span>
                        <span>마감일: {format(new Date(issue.dueDate), 'yyyy-MM-dd')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/issues/${issue.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    수정
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 상태 정보 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">상태</div>
                    <Badge className={getStatusColor(issue.status.name)}>
                      {issue.status.label}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">우선순위</div>
                    <Badge className={getPriorityColor(issue.priority.name)}>
                      {issue.priority.label}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">카테고리</div>
                    <div>{issue.category.label}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">부서</div>
                    <div>{issue.department.label}</div>
                    {issue.transferredFromDept && (
                      <div className="text-sm text-muted-foreground">
                        이전: {issue.transferredFromDept.label}
                      </div>
                    )}
                  </div>
                </div>

                {/* 담당자 정보 */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">담당자</div>
                  {issue.assignee ? (
                    <div className="flex flex-col">
                      <span>{issue.assignee.koreanName}</span>
                      {issue.assignee.thaiName && (
                        <span className="text-sm text-muted-foreground">
                          {issue.assignee.thaiName}
                          {issue.assignee.nickname && ` (${issue.assignee.nickname})`}
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {issue.assignee.department.label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">미지정</span>
                  )}
                  {issue.previousAssignee && (
                    <div className="text-sm text-muted-foreground">
                      이전 담당자: {issue.previousAssignee.koreanName}
                      {issue.previousAssignee.thaiName && ` (${issue.previousAssignee.thaiName})`}
                    </div>
                  )}
                </div>

                {/* 설명 */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">설명</div>
                  <div className="prose max-w-none">
                    {issue.description || <span className="text-muted-foreground">설명 없음</span>}
                  </div>
                </div>

                {/* 이력 */}
                {issue.history.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">변경 이력</div>
                    <div className="space-y-2">
                      {issue.history.map((history) => (
                        <div
                          key={history.id}
                          className="flex items-center justify-between text-sm border-b pb-2"
                        >
                          <div>
                            <span className="font-medium">{history.changedBy.koreanName}</span>
                            <span className="text-muted-foreground">님이 </span>
                            {history.changeType === 'ASSIGNEE_CHANGE' && '담당자를 '}
                            {history.changeType === 'DEPARTMENT_TRANSFER' && '부서를 '}
                            {history.previousValue && (
                              <>
                                <span className="text-muted-foreground">{history.previousValue}에서 </span>
                              </>
                            )}
                            <span>{history.newValue}</span>
                            <span className="text-muted-foreground">
                              {history.changeType === 'ASSIGNEE_CHANGE' && '(으)로 변경'}
                              {history.changeType === 'DEPARTMENT_TRANSFER' && '(으)로 이관'}
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            {format(new Date(history.createdAt), 'yyyy-MM-dd HH:mm')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Suspense>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">이슈 히스토리</h2>
          <IssueHistory issueId={parseInt(params.id)} />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">첨부 파일</h2>
          <IssueAttachments issueId={parseInt(params.id)} />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">댓글</h2>
          <IssueComments issueId={parseInt(params.id)} />
        </Card>
      </div>
    </div>
  );
}
