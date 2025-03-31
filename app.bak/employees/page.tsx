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
import { Search, UserPlus, RefreshCw, Edit, Trash2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { t } from '@/lib/i18n/translations';
import { format } from 'date-fns';
import { convertToEnglishKey } from '@/lib/i18n/translations';
import prisma from '@/lib/prisma';
import { useRouter } from 'next/navigation';
import { Checkbox } from "@/components/ui/checkbox";
import useTranslation from '@/utils/i18n';
import { useMediaQuery } from 'react-responsive';

// 사원 타입 정의
interface Employee {
  id: number;
  employeeId: string;
  isThai: boolean;
  thaiName?: string;
  nickname?: string;
  koreanName: string;
  isAdmin: boolean;
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
  label?: string;
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
// const POSITIONS = ['관리자', '사원']; // 더 이상 사용하지 않음

export default function EmployeesPage() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeIdSearch, setEmployeeIdSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    isThai: false,
    thaiName: '',
    nickname: '',
    isAdmin: false,
  });
  const router = useRouter();
  
  // 모바일 환경 감지
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // 부서 목록 따로 가져오기
  const fetchDepartmentList = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error(t('employees.departmentsLoadError'));
      }
      const departmentData = await response.json();
      setDepartments(departmentData.departments);
      return departmentData.departments;
    } catch (error) {
      console.error('부서 목록 로딩 오류:', error);
      toast.error(t('employees.departmentsLoadError'));
      return [];
    }
  };

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error(t('employees.fetchError'));
      }
      const data = await response.json();
      // 응답 데이터 구조 확인 로그
      console.log('직원 데이터 응답:', data);
      
      // API 응답이 배열인 경우와 객체인 경우 모두 처리
      const employeeList = Array.isArray(data) ? data : data.employees || [];
      setEmployees(employeeList);
      
      if (employeeList.length === 0) {
        toast.info(t('employees.noEmployees'));
        setDepartments([]);
        return;
      }
      
      // 부서별 직원 수 계산
      const departmentCounts = employeeList.reduce((acc: { [key: string]: number }, employee: Employee) => {
        const deptName = employee.department.label;
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      }, {});

      // 부서 목록 업데이트
      const uniqueDepartments = Array.from(new Set(employeeList.map((emp: Employee) => emp.department.label)))
        .map((deptName: string) => ({
          id: employeeList.find((emp: Employee) => emp.department.label === deptName)?.department.id || 0,
          name: deptName,
          employeeCount: departmentCounts[deptName] || 0
        }));
      
      setDepartments(uniqueDepartments);
    } catch (error) {
      console.error('직원 목록 로딩 오류:', error);
      toast.error(t('employees.fetchError'));
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
      department: '',
      isThai: false,
      thaiName: '',
      nickname: '',
      isAdmin: false,
    });
    setEditingEmployee(null);
    setIsModalOpen(false);
  };

  // 수정 모달 열기
  const handleEdit = async (employee: Employee) => {
    // 부서 목록을 최신 상태로 가져옵니다
    const departmentList = await fetchDepartmentList();
    console.log('선택된 직원의 부서 정보:', employee.department);
    
    setEditingEmployee(employee);
    setFormData({
      name: employee.koreanName,
      department: employee.department.name,
      isThai: employee.isThai,
      thaiName: employee.thaiName || '',
      nickname: employee.nickname || '',
      isAdmin: employee.isAdmin,
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
      if (!formData.name || !formData.department) {
        toast.error(t('employees.requiredFields'));
        setIsLoading(false);
        return;
      }

      console.log('모든 부서:', departments);
      console.log('선택된 부서:', formData.department);
      
      const departmentObj = departments.find(
        (dept) => dept.name === formData.department || dept.label === formData.department
      );

      console.log('찾은 부서 객체:', departmentObj);

      if (!departmentObj) {
        toast.error('유효한 부서를 선택해주세요.');
        setIsLoading(false);
        return;
      }

      const url = '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';
      
      const body = {
        ...(editingEmployee && { id: editingEmployee.id }),
        koreanName: formData.name,
        isThai: formData.isThai,
        thaiName: formData.isThai ? formData.thaiName : null,
        nickname: formData.nickname,
        departmentId: departmentObj.id,
        isAdmin: formData.isAdmin,
      };

      console.log('최종 전송할 직원 데이터:', {
        ...body,
        departmentName: departmentObj.name, // 디버깅용: 선택된 부서명 출력
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log('응답 상태:', response.status);
      const responseData = await response.json();
      console.log('응답 데이터:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || t('employees.saveFailed'));
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

  // 드롭다운 열기 시 부서 목록 최신화
  const handleModalOpen = async (open: boolean) => {
    if (open && !isModalOpen) {
      try {
        await fetchDepartmentList();
        console.log('부서 목록 로드 완료:', departments);
      } catch (err) {
        console.error('부서 목록 로드 실패:', err);
        toast.error(t('employees.departmentsLoadError'));
      }
    }
    setIsModalOpen(open);
  };

  // 필터링된 직원 목록 계산 
  const filteredEmployees = employees.filter(employee => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || (
      employee.koreanName?.toLowerCase().includes(searchLower) ||
      employee.thaiName?.toLowerCase().includes(searchLower) ||
      employee.nickname?.toLowerCase().includes(searchLower) ||
      employee.department?.label?.toLowerCase().includes(searchLower) ||
      employee.employeeId?.toLowerCase().includes(searchLower)  // 사원번호로도 검색 가능하도록 추가
    );
    
    const matchesDepartment = !selectedDepartment || 
      employee.department?.label === selectedDepartment || 
      employee.department?.name === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  // 부서 선택 처리
  const handleDepartmentClick = (deptName: string) => {
    console.log('선택된 부서:', deptName);
    setSelectedDepartment(selectedDepartment === deptName ? null : deptName);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-col space-y-2 pb-4">
          {/* 모바일/PC 공통 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CardTitle className="text-xl md:text-2xl font-bold">{t('employees.title')}</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => fetchEmployees()} variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={() => router.push('/employees/new')}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t('employees.addNew')}
              </Button>
            </div>
          </div>
          
          {/* 검색창 - 모바일에서는 아래에 배치 */}
          <div className="w-full pt-2">
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('employees.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* 부서별 직원 수 표시 */}
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-6">
            {departments.map((dept) => (
              <Card 
                key={dept.id} 
                className={`cursor-pointer transition-all duration-200 ${
                  selectedDepartment === (dept.label || dept.name) 
                    ? 'bg-primary border-2 border-primary shadow-md' 
                    : 'bg-muted/50 hover:bg-muted border border-gray-200'
                }`}
                onClick={() => handleDepartmentClick(dept.label || dept.name)}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col items-center justify-center">
                    <h3 className={`text-sm font-medium ${
                      selectedDepartment === (dept.label || dept.name) 
                        ? 'text-white' 
                        : 'text-gray-800'
                    }`}>{dept.name}</h3>
                    <p className={`text-lg font-bold ${
                      selectedDepartment === (dept.label || dept.name) 
                        ? 'text-white' 
                        : 'text-gray-900'
                    }`}>{dept.employeeCount}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* PC 버전 - 테이블 형식 */}
          {!isMobile && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('employees.number')}</TableHead>
                    <TableHead>{t('employees.employeeId')}</TableHead>
                    <TableHead>{t('employees.name')}</TableHead>
                    <TableHead>{t('employees.department')}</TableHead>
                    <TableHead>{t('employees.thaiName')}</TableHead>
                    <TableHead>{t('employees.nickname')}</TableHead>
                    <TableHead>{t('employees.isSolver')}</TableHead>
                    <TableHead>{t('employees.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
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
                        <TableCell>
                          {employee.isAdmin ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">{t('employees.solverLabel')}</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-600">{t('employees.normalLabel')}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEdit(employee)}
                            >
                              {t('employees.edit')}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleDelete(employee.id)}
                            >
                              {t('employees.delete')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* 모바일 버전 - 카드 형식 */}
          {isMobile && (
            <div className="space-y-4">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-4 bg-white rounded-lg shadow">
                  <p className="text-gray-500">{t('employees.noEmployees')}</p>
                </div>
              ) : (
                filteredEmployees.map((employee, index) => (
                  <Card key={employee.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg">{employee.koreanName}</span>
                          {employee.isAdmin ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">{t('employees.solverLabel')}</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-600">{t('employees.normalLabel')}</Badge>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(employee)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDelete(employee.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium">{t('employees.employeeId')}:</div>
                            <div>{employee.employeeId}</div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium">{t('employees.department')}:</div>
                            <div>{employee.department.label}</div>
                          </div>
                        </div>
                        
                        {employee.thaiName && (
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-medium">{t('employees.thaiName')}:</div>
                              <div>{employee.thaiName}</div>
                            </div>
                          </div>
                        )}
                        
                        {employee.nickname && (
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-medium">{t('employees.nickname')}:</div>
                              <div>{employee.nickname}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 등록/수정 모달 */}
      <Dialog open={isModalOpen} onOpenChange={handleModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingEmployee ? t('employees.editTitle') : t('employees.addTitle')}
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              {t('employees.requiredFieldsNote')}
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              {/* 왼쪽 컬럼 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-900">
                    {t('employees.name')} <span className="text-red-500">*</span>
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
                    {t('employees.department')} <span className="text-red-500">*</span>
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
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.label || dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 오른쪽 컬럼 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="isAdmin" className="text-sm font-semibold text-gray-900">
                    이슈 해결자
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isAdmin"
                      checked={formData.isAdmin}
                      onCheckedChange={(checked) => setFormData({ ...formData, isAdmin: checked as boolean })}
                    />
                    <span className="text-sm text-gray-500">이슈를 해결할 수 있는 권한을 부여합니다</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isThai" className="text-sm font-semibold text-gray-900">
                    태국 국적 직원
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isThai"
                      checked={formData.isThai}
                      onCheckedChange={(checked) => setFormData({ ...formData, isThai: checked as boolean })}
                    />
                    <span className="text-sm text-gray-500">태국 이름이 있는 경우 체크해주세요</span>
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
                  </>
                )}

                {/* 닉네임은 항상 표시되도록 수정 */}
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
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={resetModal}
                className="px-8 bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
              >
                {t('employees.cancel')}
              </Button>
              <Button 
                type="submit" 
                className="px-8"
                disabled={isLoading}
              >
                {isLoading ? t('common.processing') : editingEmployee ? t('employees.save') : t('employees.addNew')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 