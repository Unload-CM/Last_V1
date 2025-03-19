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
}

const employeeSchema = z.object({
  employeeId: z.string().min(1, '사원번호를 입력해주세요'),
  koreanName: z.string().min(1, '한글 이름을 입력해주세요'),
  thaiName: z.string().optional(),
  nickname: z.string().optional(),
  departmentId: z.string().min(1, '부서를 선택해주세요'),
  isThai: z.boolean(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function NewEmployeePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const router = useRouter();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeId: '',
      koreanName: '',
      thaiName: '',
      nickname: '',
      departmentId: '',
      isThai: false,
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

      if (!response.ok) {
        throw new Error('직원 등록에 실패했습니다');
      }

      router.push('/employees');
    } catch (error) {
      console.error('직원 등록 중 오류:', error);
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
                  <FormLabel>{t('employees.isThai')}</FormLabel>
                  <p className="text-sm text-gray-500">{t('employees.isThaiDescription')}</p>
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
            </>
          )}

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
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit">{t('common.add')}</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/employees')}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 