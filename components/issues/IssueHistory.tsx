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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Employee {
  id: number;
  koreanName: string;
  thaiName?: string;
  nickname?: string;
  department: {
    id: number;
    name: string;
    label: string;
  };
}

interface HistoryItem {
  id: number;
  title: string;
  content: string;
  comment?: string | null;
  createdAt: string;
  changedBy: Employee;
  changeType: string;
}

interface IssueHistoryProps {
  issueId: number;
}

export default function IssueHistory({ issueId }: IssueHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/issues/${issueId}/history`);
      if (!response.ok) {
        throw new Error("이슈 히스토리를 불러오는데 실패했습니다.");
      }
      const data = await response.json();
      setHistory(data.history);
    } catch (error) {
      console.error("이슈 히스토리 로딩 중 오류 발생:", error);
      toast.error("이슈 히스토리를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [issueId]);

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
    return format(date, "yyyy년 MM월 dd일 HH:mm", { locale: ko });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-pulse text-center">
          <p>히스토리 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        이슈 히스토리가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                {getIcon(item.changeType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <h4 className="text-sm font-medium">{item.title}</h4>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1 sm:mt-0">
                    <Clock className="w-3 h-3" />
                    {formatDate(item.createdAt)}
                  </div>
                </div>
                <p className="text-sm mt-1">{item.content}</p>
                {item.comment && (
                  <div className="mt-2 border-l-2 border-muted pl-3 py-1 text-sm text-muted-foreground">
                    {item.comment}
                  </div>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  변경자: {item.changedBy.koreanName}
                  {item.changedBy.thaiName && ` (${item.changedBy.thaiName})`}
                  {item.changedBy.nickname && ` - ${item.changedBy.nickname}`} |{" "}
                  {item.changedBy.department.label}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 