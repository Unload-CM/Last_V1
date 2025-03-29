import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertCircle,
  User,
  Building,
  Calendar,
  Clock,
  Tag,
  FileText,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import useTranslation from "@/utils/i18n";
import { useMediaQuery } from "@/hooks/use-media-query";

interface Employee {
  id: number;
  koreanName: string;
  thaiName?: string;
  nickname?: string;
  email?: string;
  department: {
    id: number;
    name: string;
    label: string;
    thaiLabel?: string;
  };
}

interface HistoryItem {
  id: number;
  createdAt: string;
  changedBy: Employee;
  changeType: 'STATUS_CHANGE' | 'ASSIGNEE_CHANGE' | 'DEPARTMENT_TRANSFER' | 'PRIORITY_CHANGE' | 
              'CATEGORY_CHANGE' | 'DUE_DATE_CHANGE' | 'EDIT' | 'UPDATE' | string;
  title: string;
  content: string;
  comments: {
    id: number;
    content: string;
    author: {
      id: number;
      koreanName: string;
    };
    attachments: {
      id: number;
      fileUrl: string;
      thumbnailPath?: string;
      description?: string;
      fileType?: string;
    }[];
  }[];
  summary: string;
  rootCause?: string;
  actionTaken?: string;
  preventiveMeasure?: string;
  resolutionNote?: string;
  attachments?: {
    id: number;
    fileUrl: string;
    thumbnailPath?: string;
    description?: string;
    fileType?: string;
  }[];
}

interface IssueHistoryProps {
  issueId: number;
}

export default function IssueHistory({ issueId }: IssueHistoryProps) {
  const { t, language } = useTranslation();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<number | null>(null);
  const { data: session } = useSession();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // 필드 ID와 이름 매핑
  const fieldMapping: { [key: string]: string } = {
    '69': 'statusId',
    '82': 'priorityId',
    '112': 'categoryId',
    '127': 'departmentId',
    '142': 'assigneeId',
    '164': 'solverId',
    '165': 'title',
    '166': 'description',
    '167': 'dueDate'
  };

  // 필드 이름을 사용자가 보기 좋은 텍스트로 변환
  const getFieldDisplayName = (fieldId: string) => {
    const fieldName = fieldMapping[fieldId];
    if (!fieldName) return fieldId;

    switch (fieldName) {
      case 'statusId':
        return t('issues.status');
      case 'priorityId':
        return t('issues.priority');
      case 'categoryId':
        return t('issues.category');
      case 'departmentId':
        return t('issues.department');
      case 'assigneeId':
        return t('issues.assignee');
      case 'solverId':
        return t('issues.solver');
      case 'title':
        return t('issues.title');
      case 'description':
        return t('issues.description');
      case 'dueDate':
        return t('issues.dueDate');
      default:
        return fieldName;
    }
  };

  // 변경 내용을 사용자가 보기 좋게 포맷팅
  const formatContent = (content: string) => {
    try {
      // 변경 내용이 JSON 형식인 경우 파싱
      const changes = JSON.parse(content);
      return Object.entries(changes).map(([fieldId, change]) => {
        const fieldName = getFieldDisplayName(fieldId);
        const [oldValue, newValue] = (change as string).split(' → ');
        return `${fieldName}: ${oldValue} → ${newValue}`;
      }).join('\n');
    } catch (e) {
      // JSON 파싱에 실패한 경우 원본 내용 반환
      return content;
    }
  };

  const fetchHistory = async () => {
    try {
      if (!issueId || isNaN(issueId)) {
        console.error('유효하지 않은 이슈 ID:', issueId);
        setHistory([]);
        setIsLoading(false);
        return;
      }
      
      // 현재 언어 정보를 쿼리 파라미터로 전달
      const response = await fetch(`/api/issues/${issueId}/history?language=${language}`);
      if (!response.ok) {
        throw new Error("이슈 히스토리를 불러오는데 실패했습니다.");
      }
      const data = await response.json();
      
      // 자권봇 관련 이력 필터링
      let filteredHistory = data.history.filter((item: any) => 
        !item.content.includes('자권봇') && 
        !item.title.includes('자권봇')
      );
      
      // 중복 기록 제거 로직 추가
      // 동일한 시간(1분 이내)에 발생한 EDIT와 UPDATE 타입의 중복 기록 제거
      const duplicateGroups: {[key: string]: HistoryItem[]} = {};
      
      // 타임스탬프 기준으로 그룹화 (1분 단위로)
      filteredHistory.forEach((item: HistoryItem) => {
        // createdAt을 분 단위로 그룹화하기 위한 키 생성
        const itemDate = new Date(item.createdAt);
        // 동일 시간대 항목으로 그룹화 (체인지타입 미포함)
        const groupKey = `${itemDate.getFullYear()}-${itemDate.getMonth()}-${itemDate.getDate()}-${itemDate.getHours()}-${itemDate.getMinutes()}`;
        
        if (!duplicateGroups[groupKey]) {
          duplicateGroups[groupKey] = [];
        }
        
        duplicateGroups[groupKey].push(item);
      });
      
      // 각 시간 그룹 내에서 중복 제거
      const deduplicatedHistory: HistoryItem[] = [];
      
      Object.values(duplicateGroups).forEach((group) => {
        // 디버깅 정보
        console.log('그룹 분석:', {
          시간대: new Date(group[0].createdAt).toISOString(),
          항목수: group.length,
          타입들: group.map(i => i.changeType),
          제목들: group.map(i => i.title)
        });
        
        if (group.length === 1) {
          // 그룹에 항목이 하나만 있으면 그대로 추가
          deduplicatedHistory.push(group[0]);
          return; // 다음 그룹으로
        }
        
        // 1. EDIT과 UPDATE 타입 중복 체크
        const hasEdit = group.some(item => item.changeType === 'EDIT');
        const hasUpdate = group.some(item => item.changeType === 'UPDATE');
        
        if (hasEdit && hasUpdate) {
          // EDIT과 UPDATE가 둘 다 있으면 EDIT만 남김
          const editItem = group.find(item => item.changeType === 'EDIT');
          if (editItem) {
            deduplicatedHistory.push(editItem);
            console.log('중복 이력 감지: EDIT 타입만 유지', {
              time: editItem.createdAt,
              count: group.length
            });
            return; // 다음 그룹으로
          }
        }
        
        // 2. "여러 항목 변경" 제목을 가진 항목이 있는지 체크
        const multiChangeItem = group.find(item => 
          item.title === '여러 항목 변경' || 
          item.title.includes('Multiple Changes')
        );
        
        // 단일 변경 항목들 
        const singleChangeItems = group.filter(item => 
          item.title !== '여러 항목 변경' && 
          !item.title.includes('Multiple Changes')
        );
        
        // 2-1. "여러 항목 변경" 항목이 있고, 그 내용을 포함하는 개별 변경 항목이 있는 경우
        if (multiChangeItem && singleChangeItems.length > 0) {
          // "여러 항목 변경" 항목의 변경 내용을 분석
          const multiChanges = multiChangeItem.content.split('\n');
          
          // 개별 변경 항목의 내용과 비교하여 모두 포함되는지 확인
          const allChangesIncluded = singleChangeItems.every(item => {
            return multiChanges.some(change => change.includes(item.content));
          });
          
          // 모든 개별 변경이 복합 변경에 포함되어 있으면 복합 변경만 유지
          if (allChangesIncluded) {
            deduplicatedHistory.push(multiChangeItem);
            console.log('중복 이력 감지: 복합 변경 항목만 유지', {
              time: multiChangeItem.createdAt,
              단일변경수: singleChangeItems.length,
              복합변경내용: multiChanges
            });
            return; // 다음 그룹으로
          }
        }
        
        // 3. 내용(content) 기준으로 중복 제거
        const contentMap = new Map<string, HistoryItem>();
        
        // 동일한 content를 가진 항목 중 가장 최근 항목을 맵에 저장
        group.forEach(item => {
          // 이미 저장된 항목이 없거나, 현재 항목이 더 최근이면 맵 업데이트
          if (!contentMap.has(item.content) || 
              new Date(item.createdAt) > new Date(contentMap.get(item.content)!.createdAt)) {
            contentMap.set(item.content, item);
          }
        });
        
        // 중복이 없는 항목만 결과에 추가
        const uniqueItems = Array.from(contentMap.values());
        deduplicatedHistory.push(...uniqueItems);
        
        if (uniqueItems.length < group.length) {
          console.log('동일 내용 중복 이력 감지: 중복 제거됨', {
            type: group[0].changeType,
            time: group[0].createdAt,
            원본수: group.length,
            중복제거후: uniqueItems.length
          });
        }
      });
      
      // 최종 정렬 (최신순)
      deduplicatedHistory.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log('이력 필터링 결과:', {
        원본: data.history.length,
        '자권봇 제외': filteredHistory.length,
        '중복 제거': deduplicatedHistory.length
      });
      
      setHistory(deduplicatedHistory);
    } catch (error) {
      console.error("이슈 히스토리 로딩 중 오류 발생:", error);
      toast.error("이슈 히스토리를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [issueId, language]); // 언어가 변경되면 히스토리를 다시 로드

  const handleDeleteClick = (historyId: number) => {
    setHistoryToDelete(historyId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!historyToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/issues/${issueId}/history?historyId=${historyToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '히스토리 삭제에 실패했습니다.');
      }
      
      // 삭제 성공 시 목록에서 제거
      setHistory(prevHistory => prevHistory.filter(item => item.id !== historyToDelete));
      toast.success('히스토리 항목이 삭제되었습니다.');
    } catch (error) {
      console.error('히스토리 삭제 중 오류:', error);
      toast.error(error instanceof Error ? error.message : '히스토리 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setHistoryToDelete(null);
    }
  };

  // 현재 사용자가 해당 이력의 작성자인지 확인하는 함수
  const canDeleteHistory = (item: HistoryItem): boolean => {
    // 세션 정보가 없는 경우
    if (!session?.user) {
      console.log('이력 삭제 권한 없음: 세션 정보 없음');
      return false;
    }
    
    // 디버깅용 로그 추가
    console.log('이력 삭제 권한 확인:', {
      sessionUserId: session.user.id,
      sessionUserEmail: session.user.email, // 이것은 사용자의 employeeId로 저장됨
      historyAuthorId: item.changedBy.id,
      historyAuthorEmail: item.changedBy.email,
      isMatch: session.user.id === String(item.changedBy.id) || session.user.email === item.changedBy.email,
    });
    
    // 방법 1: ID 비교 (우선)
    // next-auth의 session.user.id는 문자열, item.changedBy.id는 숫자
    if (session.user.id && item.changedBy.id) {
      if (session.user.id === String(item.changedBy.id)) {
        return true;
      }
    }
    
    // 방법 2: 이메일 비교 (session.user.email은 employeeId로 저장됨)
    if (session.user.email && item.changedBy.email) {
      if (session.user.email === item.changedBy.email) {
        return true;
      }
    }
    
    // 세션 ID가 있고 API에서 반환된 item.changedBy 정보가 불완전한 경우
    // 세션 정보를 신뢰하여 삭제 버튼을 표시 (세션은 서버에서 생성되므로 신뢰할 수 있음)
    if (session.user.id && !item.changedBy.id && !item.changedBy.email) {
      console.log('이력 삭제 권한 부여: 이력 작성자 정보가 불완전하지만 세션 정보 존재');
      return true;
    }
    
    console.log('이력 삭제 권한 없음: 작성자가 아님');
    return false;
  };

  const getIcon = (changeType: string) => {
    switch (changeType) {
      case "STATUS_CHANGE":
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case "ASSIGNEE_CHANGE":
        return <User className="w-5 h-5 text-green-500" />;
      case "DEPARTMENT_TRANSFER":
        return <Building className="w-5 h-5 text-yellow-500" />;
      case "PRIORITY_CHANGE":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "CATEGORY_CHANGE":
        return <Tag className="w-5 h-5 text-purple-500" />;
      case "DUE_DATE_CHANGE":
        return <Calendar className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd HH:mm");
  };
  
  // 히스토리 항목의 제목을 다국어 처리하는 함수
  const getLocalizedTitle = (title: string) => {
    if (title.startsWith('history.')) {
      return t(`issues.${title}`);
    }
    
    // 한국어 제목을 다국어 키로 매핑 - 이전 방식
    const titleMap: { [key: string]: string } = {
      "history.statusChange": "issues.history.statusChange",
      "history.priorityChange": "issues.history.priorityChange",
      "history.categoryChange": "issues.history.categoryChange",
      "history.departmentChange": "issues.history.departmentChange",
      "history.assigneeChange": "issues.history.assigneeChange",
      "history.solverChange": "issues.history.solverChange",
      "history.contentChange": "issues.history.contentChange",
      "history.fileAdded": "issues.history.fileAdded"
    };
    
    const key = titleMap[title];
    return key ? t(key) : title;
  };
  
  // 부서 표시명 가져오기
  const getDepartmentDisplayName = (dept: any) => {
    if (!dept) return '-';
    if (language === 'en') return dept.name;
    if (language === 'th') return dept.thaiLabel || dept.label;
    return dept.label; // 기본값 한국어
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-pulse text-center">
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {t('issues.history.noHistory')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getIcon(item.changeType)}
              </div>
              <div className="flex-grow">
                <div className="text-sm font-medium">
                  {getLocalizedTitle(item.title)}
                </div>
                <div className="text-sm mt-1 text-muted-foreground space-y-1">
                  {item.content.split('\n').map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
                {item.summary && (
                  <div className="text-sm mt-1 space-y-1 text-muted-foreground">
                    {JSON.parse(item.summary).map((change: { field: string; oldValue: string; newValue: string }, index: number) => (
                      <div key={index}>
                        {t(`fields.${change.field}`) || change.field}: {change.oldValue} → {change.newValue}
                      </div>
                    ))}
                  </div>
                )}
                {item.comments && item.comments.length > 0 && (
                  <div className="mt-2 border-l-2 border-muted pl-3 py-1 text-sm text-muted-foreground">
                    {item.comments[0].content}
                  </div>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  {item.changedBy.koreanName}
                  {item.changedBy.thaiName && ` (${item.changedBy.thaiName})`}
                  {item.changedBy.nickname && ` - ${item.changedBy.nickname}`} | {getDepartmentDisplayName(item.changedBy.department)}
                </div>
                <div className="mt-1 flex justify-end items-center text-xs text-muted-foreground">
                  <div>
                    {formatDate(item.createdAt)}
                  </div>
                  {canDeleteHistory(item) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-red-500 hover:text-red-700 hover:bg-red-100 ml-1"
                      onClick={() => handleDeleteClick(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('issues.confirmDeleteHistory')}</DialogTitle>
            <DialogDescription>
              {t('issues.confirmDeleteHistoryDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
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