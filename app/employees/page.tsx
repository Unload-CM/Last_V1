'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Search, UserPlus, RefreshCw } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { t } from '@/lib/i18n/translations';
import { format } from 'date-fns';
import { convertToEnglishKey } from '@/lib/i18n/translations';
import prisma from '@/lib/prisma';
import { useRouter } from 'next/navigation';
import { Checkbox } from "@/components/ui/checkbox";

// 사원 타입 정의
interface Employee {
  id: number;
  employeeId: string;
  isThai: boolean;
  thaiName?: string;
  nickname?: string;
  koreanName: string;
  department: {
    id: number;
    name: string;
    label: string;
    thaiLabel?: string;
  };
}

// 부서 타입 정의
interface Department {
  id: number;
  name: string;
  description?: string;
  displayName?: string;
  employeeCount?: number;
}

// 기본 부서 데이터
const DEFAULT_DEPARTMENTS = [
  '생산부',
  '품질관리부',
  '물류창고',
  '자재관리',
  '경영지원부'
];

// 직책 목록
const POSITIONS = ['관리자', '사원'];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    isThai: false,
    thaiName: '',
    nickname: '',
  });
  const router = useRouter();

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      setEmployees(data.employees || []);
      
      // 부서별 직원 수 계산
      const departmentCounts = data.employees.reduce((acc: { [key: string]: number }, employee: Employee) => {
        const deptName = employee.department.label;
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      }, {});

      // 부서 목록 업데이트
      const uniqueDepartments = Array.from(new Set(data.employees.map((emp: Employee) => emp.department.label)))
        .map((deptName: string) => ({
          id: data.employees.find((emp: Employee) => emp.department.label === deptName)?.department.id || 0,
          name: deptName,
          employeeCount: departmentCounts[deptName] || 0
        }));
      
      setDepartments(uniqueDepartments);

      if (data.employees?.length === 0) {
        toast.info('등록된 직원이 없습니다.');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('직원 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // 모달 초기화
  const resetModal = () => {
    setFormData({
      name: '',
      position: '',
      department: '',
      isThai: false,
      thaiName: '',
      nickname: '',
    });
    setEditingEmployee(null);
    setIsModalOpen(false);
  };

  // 수정 모달 열기
  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.koreanName,
      position: employee.isThai ? '관리자' : '사원',
      department: employee.department.label,
      isThai: employee.isThai,
      thaiName: employee.thaiName || '',
      nickname: employee.nickname || '',
    });
    setIsModalOpen(true);
  };

  // 삭제 처리
  const handleDelete = async (id: number) => {
    if (!window.confirm(t('employees.confirmDelete'))) return;

    try {
      const response = await fetch(`/api/employees?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success(t('employees.deleteSuccess'));
        fetchEmployees();
      } else {
        throw new Error(t('employees.deleteFailed'));
      }
    } catch (error) {
      console.error('사원 삭제 실패:', error);
      toast.error(t('employees.deleteFailed'));
    }
  };

  // 저장 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 필수 필드 검증
      if (!formData.name || !formData.department || !formData.position) {
        toast.error(t('employees.requiredFields'));
        return;
      }

      const url = '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';
      
      const body = {
        ...(editingEmployee && { id: editingEmployee.id }),
        name: formData.name,
        position: formData.position,
        department: formData.department,
        isThai: formData.isThai,
        thaiName: formData.isThai ? formData.thaiName : undefined,
        nickname: formData.isThai ? formData.nickname : undefined
      };

      console.log('전송할 데이터:', body);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('employees.saveFailed'));
      }

      toast.success(editingEmployee ? t('employees.updateSuccess') : t('employees.createSuccess'));
      resetModal();
      fetchEmployees();
    } catch (error) {
      console.error('저장 실패:', error);
      toast.error(error instanceof Error ? error.message : t('employees.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // 검색된 사원 목록
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.koreanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.thaiName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.nickname || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment ? employee.department.label === selectedDepartment : true;
    
    return matchesSearch && matchesDepartment;
  });

  // 부서 선택 처리
  const handleDepartmentClick = (deptName: string) => {
    setSelectedDepartment(selectedDepartment === deptName ? null : deptName);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Navigation />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">직원 관리</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름, 부서, 태국어 이름으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[250px]"
              />
            </div>
            <Button onClick={() => fetchEmployees()} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => router.push('/employees/new')}>
              <UserPlus className="h-4 w-4 mr-2" />
              신규 직원 등록
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 부서별 직원 수 표시 */}
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-6">
            {departments.map((dept) => (
              <Card 
                key={dept.id} 
                className={`cursor-pointer transition-colors duration-200 ${
                  selectedDepartment === dept.name 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
                onClick={() => handleDepartmentClick(dept.name)}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col items-center justify-center">
                    <h3 className="text-sm font-medium">{dept.name}</h3>
                    <p className="text-lg font-bold">{dept.employeeCount}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>사원번호</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>태국어 이름</TableHead>
                  <TableHead>닉네임</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      {t('employees.noEmployees')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee, index) => (
                    <TableRow key={employee.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{employee.employeeId}</TableCell>
                      <TableCell>{employee.koreanName}</TableCell>
                      <TableCell>{employee.department.label}</TableCell>
                      <TableCell>{employee.thaiName || '-'}</TableCell>
                      <TableCell>{employee.nickname || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 등록/수정 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingEmployee ? '직원 정보 수정' : '신규 직원 등록'}
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              * 표시는 필수 입력 항목입니다
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              {/* 왼쪽 컬럼 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-900">
                    이름 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('employees.namePlaceholder')}
                    className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-semibold text-gray-900">
                    부서 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                    required
                  >
                    <SelectTrigger className="w-full bg-white border-gray-300">
                      <SelectValue placeholder={t('employees.departmentPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent position="popper" className="bg-white border rounded-md shadow-lg w-full">
                      {DEFAULT_DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-semibold text-gray-900">
                    {t('employees.position')} <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value })}
                    required
                  >
                    <SelectTrigger className="w-full bg-white border-gray-300">
                      <SelectValue placeholder={t('employees.positionPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent position="popper" className="bg-white border rounded-md shadow-lg w-full">
                      {POSITIONS.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 오른쪽 컬럼 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="isThai" className="text-sm font-semibold text-gray-900">
                    태국 직원 여부
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isThai"
                      checked={formData.isThai}
                      onCheckedChange={(checked) => setFormData({ ...formData, isThai: checked as boolean })}
                    />
                    <span className="text-sm text-gray-500">태국 국적 직원인 경우 체크해주세요</span>
                  </div>
                </div>

                {formData.isThai && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="thaiName" className="text-sm font-semibold text-gray-900">
                        {t('employees.thaiName')}
                      </Label>
                      <Input
                        id="thaiName"
                        value={formData.thaiName}
                        onChange={(e) => setFormData({ ...formData, thaiName: e.target.value })}
                        placeholder={t('employees.thaiNamePlaceholder')}
                        className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nickname" className="text-sm font-semibold text-gray-900">
                        {t('employees.nickname')}
                      </Label>
                      <Input
                        id="nickname"
                        value={formData.nickname}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                        placeholder={t('employees.nicknamePlaceholder')}
                        className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={resetModal}
                className="px-8 bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="px-8 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    처리중...
                  </>
                ) : (
                  editingEmployee ? '수정' : '등록'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 