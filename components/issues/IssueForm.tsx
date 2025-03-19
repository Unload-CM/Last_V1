'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, X } from 'lucide-react';

interface Department {
  id: number;
  name: string;
  label: string;
}

interface Employee {
  id: number;
  koreanName: string;
  thaiName?: string;
  nickname?: string;
  department: Department;
}

interface Status {
  id: number;
  name: string;
  label: string;
}

interface Priority {
  id: number;
  name: string;
  label: string;
}

interface Category {
  id: number;
  name: string;
  label: string;
}

interface Issue {
  id?: number;
  title: string;
  description?: string;
  assigneeId?: number;
  departmentId: number;
  statusId: number;
  priorityId: number;
  categoryId: number;
  dueDate?: string;
}

interface IssueFormProps {
  initialData?: Issue;
  isEdit?: boolean;
}

export default function IssueForm({ initialData, isEdit = false }: IssueFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState<Issue>(
    initialData || {
      title: '',
      description: '',
      departmentId: 0,
      statusId: 0,
      priorityId: 0,
      categoryId: 0
    }
  );

  // 필터 데이터 로드
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [departmentsRes, statusesRes, prioritiesRes, categoriesRes] = await Promise.all([
          fetch('/api/departments'),
          fetch('/api/settings/statuses'),
          fetch('/api/settings/priorities'),
          fetch('/api/settings/categories')
        ]);

        if (!departmentsRes.ok || !statusesRes.ok || !prioritiesRes.ok || !categoriesRes.ok) {
          throw new Error('필터 데이터를 불러오는데 실패했습니다.');
        }

        const [departments, statuses, priorities, categories] = await Promise.all([
          departmentsRes.json(),
          statusesRes.json(),
          prioritiesRes.json(),
          categoriesRes.json()
        ]);

        setDepartments(departments);
        setStatuses(statuses);
        setPriorities(priorities);
        setCategories(categories);

        // 부서가 선택되었을 때 해당 부서의 직원 목록 로드
        if (formData.departmentId) {
          loadEmployees(formData.departmentId);
        }
      } catch (error) {
        console.error('필터 데이터 로딩 중 오류:', error);
        toast.error('필터 데이터를 불러오는데 실패했습니다.');
      }
    };

    loadFilterData();
  }, [formData.departmentId]);

  // 부서별 직원 목록 로드
  const loadEmployees = async (departmentId: number) => {
    try {
      const response = await fetch(`/api/employees?departmentId=${departmentId}`);
      if (!response.ok) {
        throw new Error('직원 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setEmployees(data.employees);
    } catch (error) {
      console.error('직원 목록 로딩 중 오류:', error);
      toast.error('직원 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.departmentId || !formData.statusId || !formData.priorityId || !formData.categoryId) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/issues' + (isEdit ? `/${initialData?.id}` : ''), {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(isEdit ? '이슈 수정에 실패했습니다.' : '이슈 생성에 실패했습니다.');
      }

      const data = await response.json();
      toast.success(isEdit ? '이슈가 수정되었습니다.' : '이슈가 생성되었습니다.');

      // 이슈 생성/수정 후에 첨부 파일 업로드
      if (data.issue.id && attachmentFiles.length > 0) {
        await uploadAttachments(data.issue.id);
      }

      router.push(`/issues/${data.issue.id}`);
    } catch (error) {
      console.error('이슈 저장 중 오류:', error);
      toast.error(isEdit ? '이슈 수정에 실패했습니다.' : '이슈 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 파일 첨부 처리 함수
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachmentFiles((prev) => [...prev, ...newFiles]);
    }
  };
  
  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    const units = ["바이트", "KB", "MB", "GB", "TB", "PB"];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };
  
  // 파일 제거 함수
  const removeFile = (index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };
  
  // 첨부 파일 업로드 함수
  const uploadAttachments = async (issueId: number) => {
    for (const file of attachmentFiles) {
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        const response = await fetch(`/api/issues/${issueId}/attachments`, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          console.error(`파일 ${file.name} 업로드 실패`);
        }
      } catch (error) {
        console.error(`파일 ${file.name} 업로드 중 오류:`, error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>{isEdit ? '이슈 수정' : '새 이슈 생성'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 제목 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">제목 *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="이슈 제목을 입력하세요"
              required
            />
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">설명</label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="이슈에 대한 자세한 설명을 입력하세요"
              rows={5}
            />
          </div>

          {/* 부서 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">부서 *</label>
            <Select
              value={formData.departmentId?.toString()}
              onValueChange={(value) => {
                setFormData({ ...formData, departmentId: parseInt(value), assigneeId: undefined });
                loadEmployees(parseInt(value));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="부서 선택" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 담당자 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">담당자</label>
            <Select
              value={formData.assigneeId?.toString() || "unassigned"}
              onValueChange={(value) => setFormData({ ...formData, assigneeId: value === "unassigned" ? undefined : parseInt(value) })}
              disabled={!formData.departmentId || employees.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="담당자 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">미지정</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.koreanName}
                    {employee.thaiName && ` (${employee.thaiName})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 상태 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">상태 *</label>
            <Select
              value={formData.statusId?.toString()}
              onValueChange={(value) => setFormData({ ...formData, statusId: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 우선순위 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">우선순위 *</label>
            <Select
              value={formData.priorityId?.toString()}
              onValueChange={(value) => setFormData({ ...formData, priorityId: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="우선순위 선택" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority.id} value={priority.id.toString()}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">카테고리 *</label>
            <Select
              value={formData.categoryId?.toString()}
              onValueChange={(value) => setFormData({ ...formData, categoryId: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 마감일 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">마감일</label>
            <Input
              type="date"
              value={formData.dueDate ? format(new Date(formData.dueDate), 'yyyy-MM-dd') : ''}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          {/* 파일 첨부 섹션 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">첨부 파일</label>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-primary file:text-primary-foreground
              hover:file:bg-primary/90"
            />
            
            {attachmentFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-sm font-medium">선택된 파일:</p>
                <ul className="space-y-1">
                  {attachmentFiles.map((file, index) => (
                    <li key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                      <div className="truncate">
                        {file.name} ({formatFileSize(file.size)})
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '저장 중...' : isEdit ? '수정' : '생성'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 