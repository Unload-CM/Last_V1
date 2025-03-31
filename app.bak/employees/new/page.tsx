'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { t } from '@/lib/i18n/translations';

interface Department {
  id: number;
  name: string;
  label: string;
  thaiLabel?: string;
}

const employeeSchema = z.object({
  employeeId: z.string().min(1, '사원번호를 입력해주세요'),
  koreanName: z.string().min(1, '한글 이름을 입력해주세요'),
  thaiName: z.string().optional(),
  nickname: z.string().optional(),
  departmentId: z.string().min(1, '부서를 선택해주세요'),
  isThai: z.boolean(),
  isAdmin: z.boolean(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function NewEmployeePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // 현재 언어 가져오기 (localStorage에서)
  const [currentLanguage, setCurrentLanguage] = useState<string>('ko');
  
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      const storedLanguage = localStorage.getItem('language') || 'ko';
      setCurrentLanguage(storedLanguage);
    }
  }, []);
  
  // 현재 언어에 맞는 필드 선택 함수
  const getDepartmentDisplayName = (dept: Department) => {
    if (currentLanguage === 'en') return dept.name;
    if (currentLanguage === 'th') return dept.thaiLabel || dept.label;
    return dept.label; // 기본값 한국어
  };

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeId: '',
      koreanName: '',
      thaiName: '',
      nickname: '',
      departmentId: '',
      isThai: false,
      isAdmin: false,
    },
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      const data = await response.json();
      setDepartments(data.departments);
    } catch (error) {
      console.error('부서 목록 조회 중 오류:', error);
    }
  };

  const onSubmit = async (data: EmployeeFormValues) => {
    try {
      setIsLoading(true);
      console.log('직원 등록 시도:', data); // 폼 데이터 로깅
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          departmentId: parseInt(data.departmentId),
        }),
      });

      // 응답 상태 및 데이터 로깅
      console.log('응답 상태:', response.status);
      const responseText = await response.text();
      console.log('응답 내용:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('JSON 파싱 오류:', e);
      }

      if (!response.ok) {
        // 중복 ID 오류 특별 처리
        if (responseText.includes('Unique constraint failed') || response.status === 409) {
          throw new Error(`이미 존재하는 사원번호입니다: ${data.employeeId}. 다른 사원번호를 사용해주세요.`);
        }
        throw new Error(responseData?.error || '직원 등록에 실패했습니다');
      }

      alert('직원이 성공적으로 등록되었습니다!');
      router.push('/employees');
    } catch (error) {
      console.error('직원 등록 중 오류:', error);
      alert('오류: ' + (error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('employees.addTitle')}</h1>
      <p className="text-sm text-gray-500 mb-6">{t('employees.requiredFieldsNote')}</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="isThai"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel>태국 국적 직원</FormLabel>
                  <p className="text-sm text-gray-500">태국 이름이 있는 경우 체크해주세요</p>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('employees.id')}</FormLabel>
                <FormControl>
                  <Input placeholder="EMP00001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="koreanName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('employees.name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('employees.namePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch('isThai') && (
            <>
              <FormField
                control={form.control}
                name="thaiName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('employees.thaiName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('employees.nickname')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('employees.department')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('employees.departmentPlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments && departments.length > 0 ? (
                      departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {getDepartmentDisplayName(dept)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-department" disabled>
                        {t('employees.departmentsLoadError')}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isAdmin"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel>이슈 해결자</FormLabel>
                  <p className="text-sm text-gray-500">이슈를 해결할 수 있는 권한을 부여합니다</p>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '처리 중...' : t('common.add')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/employees')}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 