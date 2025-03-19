'use client';

import { useState, useEffect } from 'react';
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
import { Search, Plus, RefreshCw } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { format } from 'date-fns';

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
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [departments, setDepartments] = useState<Array<{ id: number; name: string; label: string }>>([]);
  const [statuses, setStatuses] = useState<Array<{ id: number; name: string; label: string }>>([]);
  const [priorities, setPriorities] = useState<Array<{ id: number; name: string; label: string }>>([]);

  const fetchIssues = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedDepartment && selectedDepartment !== 'all') params.append('departmentId', selectedDepartment);
      if (selectedStatus && selectedStatus !== 'all') params.append('statusId', selectedStatus);
      if (selectedPriority && selectedPriority !== 'all') params.append('priorityId', selectedPriority);

      const response = await fetch(`/api/issues?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch issues');
      }
      const data = await response.json();
      setIssues(data.issues || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('이슈 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 필터 데이터 로드
  const loadFilterData = async () => {
    try {
      const [departmentsRes, statusesRes, prioritiesRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/settings/statuses'),
        fetch('/api/settings/priorities')
      ]);

      if (!departmentsRes.ok || !statusesRes.ok || !prioritiesRes.ok) {
        throw new Error('필터 데이터를 불러오는데 실패했습니다.');
      }

      const [departments, statuses, priorities] = await Promise.all([
        departmentsRes.json(),
        statusesRes.json(),
        prioritiesRes.json()
      ]);

      setDepartments(departments);
      setStatuses(statuses);
      setPriorities(priorities);
    } catch (error) {
      console.error('필터 데이터 로딩 중 오류:', error);
      toast.error('필터 데이터를 불러오는데 실패했습니다.');
    }
  };

  // 컴포넌트 마운트 시 필터 데이터 로드
  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [searchTerm, selectedDepartment, selectedStatus, selectedPriority]);

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Navigation />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">이슈 관리</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이슈 제목, 설명으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[250px]"
              />
            </div>
            <Button onClick={() => fetchIssues()} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => window.location.href = '/issues/new'}>
              <Plus className="h-4 w-4 mr-2" />
              새 이슈 등록
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 필터 */}
          <div className="flex gap-4 mb-6">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="부서 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 부서</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="우선순위 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 우선순위</SelectItem>
                {priorities.map((priority) => (
                  <SelectItem key={priority.id} value={priority.id.toString()}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 이슈 목록 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>우선순위</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead>마감일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow
                    key={issue.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => window.location.href = `/issues/${issue.id}`}
                  >
                    <TableCell className="font-medium">{issue.title}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(issue.status.name)}>
                        {issue.status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(issue.priority.name)}>
                        {issue.priority.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {issue.assignee ? (
                        <div className="flex flex-col">
                          <span>{issue.assignee.koreanName}</span>
                          {issue.assignee.thaiName && (
                            <span className="text-sm text-muted-foreground">
                              {issue.assignee.thaiName}
                              {issue.assignee.nickname && ` (${issue.assignee.nickname})`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">미지정</span>
                      )}
                    </TableCell>
                    <TableCell>{issue.department.label}</TableCell>
                    <TableCell>{issue.category.label}</TableCell>
                    <TableCell>{format(new Date(issue.createdAt), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>
                      {issue.dueDate ? (
                        format(new Date(issue.dueDate), 'yyyy-MM-dd')
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {issues.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      {isLoading ? '로딩 중...' : '등록된 이슈가 없습니다.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 