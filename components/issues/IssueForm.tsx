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
import { ArrowLeft, X, Paperclip } from 'lucide-react';
import useTranslation from '@/utils/i18n';
import { useSession } from 'next-auth/react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Label } from '@/components/ui/label';
import { detectLanguage, translateText, formatWithTranslation, removeExistingTranslation, updateTextWithTranslation } from '@/utils/translation';

interface Department {
  id: number;
  name: string;
  label: string;
  thaiLabel?: string;
}

interface Employee {
  id: number;
  koreanName: string;
  thaiName?: string;
  nickname?: string;
  displayName: string;
  department: {
    id: number;
    name: string;
    label: string;
    thaiLabel?: string;
    displayName: string;
  };
}

interface Status {
  id: number;
  name: string;
  label: string;
  thaiLabel?: string;
}

interface Priority {
  id: number;
  name: string;
  label: string;
  thaiLabel?: string;
}

interface Category {
  id: number;
  name: string;
  label: string;
  thaiLabel?: string;
}

interface Issue {
  id?: number;
  title: string;
  description?: string;
  assigneeId?: number;
  solverId?: number;
  departmentId: number;
  statusId: number;
  priorityId: number;
  categoryId: number;
  dueDate?: string;
  files?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
  }>;
}

interface IssueFormProps {
  initialData?: Issue;
  isEdit?: boolean;
}

interface FormData {
  title: string;
  description: string;
  categoryId: number;
  departmentId: number;
  statusId: number;
  priorityId: number;
  assigneeId?: number;
  solverId?: number;
  dueDate?: string;
}

export default function IssueForm({ initialData, isEdit = false }: IssueFormProps) {
  const { t, language, isLoading: translationLoading } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [adminEmployees, setAdminEmployees] = useState<Employee[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<{[key: string]: string}>({});
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [formData, setFormData] = useState<Issue>(
    initialData || {
      title: '',
      description: '',
      departmentId: 0,
      statusId: 1,
      priorityId: 0,
      categoryId: 0,
      dueDate: ''
    }
  );

  // 유효성 검사 오류 상태 추가
  const [errors, setErrors] = useState<{
    title?: string;
    departmentId?: string;
    categoryId?: string;
    statusId?: string;
    priorityId?: string;
  }>({});

  // 번역 로드 상태 확인을 위한 로그 추가
  useEffect(() => {
    console.log('Translation loading state:', translationLoading);
    console.log('Current language:', language);
    console.log('Translation test:', {
      titlePlaceholder: t('issues.titlePlaceholder'),
      descriptionPlaceholder: t('issues.descriptionPlaceholder'),
      selectAssignee: t('issues.selectAssignee'),
      selectSolver: t('issues.selectSolver')
    });
  }, [translationLoading, language, t]);

  useEffect(() => {
    if (initialData) {
      // 마감일이 있는 경우 YYYY-MM-DD 형식으로 변환
      const formattedDueDate = initialData.dueDate 
        ? new Date(initialData.dueDate).toISOString().split('T')[0]
        : '';

      setFormData({
        ...initialData,
        dueDate: formattedDueDate
      });
    }
  }, [initialData]);

  // 날짜 입력 처리
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      dueDate: value || undefined
    });
  };

  // 안전한 날짜 포맷 함수 추가
  const safeFormatDate = (dateString: string | null | undefined, formatPattern: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        console.warn('유효하지 않은 날짜 형식:', dateString);
        return '';
      }
      return format(date, formatPattern);
    } catch (error) {
      console.error('날짜 포맷 오류:', error);
      return '';
    }
  };

  // 필터 데이터 로드
  const loadFilterData = async () => {
    try {
      console.log('필터 데이터 로딩 시작');
      
      const [departmentsRes, statusesRes, prioritiesRes, categoriesRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/settings/statuses'),
        fetch('/api/settings/priorities'),
        fetch('/api/settings/categories')
      ]);

      if (!departmentsRes.ok || !statusesRes.ok || !prioritiesRes.ok || !categoriesRes.ok) {
        throw new Error('필터 데이터를 불러오는데 실패했습니다.');
      }

      const [departmentsData, statusesData, prioritiesData, categoriesData] = await Promise.all([
        departmentsRes.json(),
        statusesRes.json(),
        prioritiesRes.json(),
        categoriesRes.json()
      ]);

      console.log('받은 데이터:', {
        departments: departmentsData,
        statuses: statusesData,
        priorities: prioritiesData,
        categories: categoriesData
      });

      // departments 데이터 처리
      let departmentsArray = Array.isArray(departmentsData) 
        ? departmentsData 
        : departmentsData.departments || [];
      
      if (!Array.isArray(departmentsArray)) {
        console.error('부서 데이터가 배열이 아님:', departmentsData);
        departmentsArray = [];
      }

      // statuses 데이터 처리
      let statusesArray = Array.isArray(statusesData)
        ? statusesData
        : statusesData.statuses || [];
      
      if (!Array.isArray(statusesArray)) {
        console.error('상태 데이터가 배열이 아님:', statusesData);
        statusesArray = [];
      }

      // priorities 데이터 처리
      let prioritiesArray = Array.isArray(prioritiesData)
        ? prioritiesData
        : prioritiesData.priorities || [];
      
      if (!Array.isArray(prioritiesArray)) {
        console.error('우선순위 데이터가 배열이 아님:', prioritiesData);
        prioritiesArray = [];
      }

      // categories 데이터 처리
      let categoriesArray = Array.isArray(categoriesData)
        ? categoriesData
        : categoriesData.categories || [];
      
      if (!Array.isArray(categoriesArray)) {
        console.error('카테고리 데이터가 배열이 아님:', categoriesData);
        categoriesArray = [];
      }

      console.log('변환된 배열:', {
        departments: departmentsArray.length,
        statuses: statusesArray.length,
        priorities: prioritiesArray.length,
        categories: categoriesArray.length
      });

      setDepartments(departmentsArray);
      setStatuses(statusesArray);
      setPriorities(prioritiesArray);
      setCategories(categoriesArray);

      // 부서가 선택되었을 때 해당 부서의 직원 목록 로드
      if (formData.departmentId) {
        loadEmployees(formData.departmentId);
      }

      // 관리자 직원 목록 로드
      loadAdminEmployees();
    } catch (error) {
      console.error('필터 데이터 로딩 중 오류:', error);
      toast.error(t('common.loadError'));
      // 오류 발생 시 빈 배열로 초기화
      setDepartments([]);
      setStatuses([]);
      setPriorities([]);
      setCategories([]);
    }
  };

  // 부서별 직원 목록 로드
  const loadEmployees = async (departmentId: number) => {
    try {
      const response = await fetch(`/api/employees?departmentId=${departmentId}&lang=${language}`);
      if (!response.ok) {
        throw new Error('직원 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      console.log('부서별 직원 데이터:', data);
      
      // API 응답이 배열인지 확인하고 처리
      if (Array.isArray(data)) {
        setEmployees(data);
      } else if (data.employees && Array.isArray(data.employees)) {
        setEmployees(data.employees);
      } else {
        setEmployees([]);
        console.error('예상치 못한 API 응답 형식:', data);
      }
    } catch (error) {
      console.error('직원 목록 로딩 중 오류:', error);
      toast.error('직원 목록을 불러오는데 실패했습니다.');
    }
  };

  // 관리자 직원 목록 로드
  const loadAdminEmployees = async () => {
    try {
      const response = await fetch(`/api/employees?isAdmin=true&lang=${language}`);
      if (!response.ok) {
        throw new Error('관리자 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      console.log('관리자 직원 데이터:', data);
      
      // API 응답이 배열인지 확인하고 처리
      if (Array.isArray(data)) {
        setAdminEmployees(data);
      } else if (data.employees && Array.isArray(data.employees)) {
        setAdminEmployees(data.employees);
      } else {
        setAdminEmployees([]);
        console.error('예상치 못한 API 응답 형식:', data);
      }
    } catch (error) {
      console.error('관리자 목록 로딩 중 오류 발생:', error);
      toast.error('관리자 목록을 불러오는데 실패했습니다.');
    }
  };

  // URL 객체 정리를 위한 useEffect 추가
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 생성한 URL 객체들 정리
      Object.values(fileUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [fileUrls]);

  // 첨부 파일 업로드 함수
  const uploadAttachments = async (issueId: number) => {
    // 로그인 확인
    if (status !== 'authenticated' || !session?.user) {
      console.error('사용자가 로그인하지 않았습니다.');
      toast.error('파일 업로드를 위해 로그인이 필요합니다.');
      return [];
    }

    console.log(`[IssueForm] 총 ${attachmentFiles.length}개 파일 업로드 시작 - 이슈 ID: ${issueId}, 유저 ID: ${session.user.id}`);
    
    // 파일이 없는 경우 빈 배열 반환
    if (attachmentFiles.length === 0) {
      console.log('업로드할 파일이 없습니다.');
      return [];
    }
    
    const uploadResults: any[] = [];
    let failCount = 0;
    toast.info(`총 ${attachmentFiles.length}개 파일 업로드를 시작합니다.`);
    
    // 각 파일을 순차적으로 처리
    for (let i = 0; i < attachmentFiles.length; i++) {
      const file = attachmentFiles[i];
      console.log(`[IssueForm] [${i+1}/${attachmentFiles.length}] 파일 업로드 시작: ${file.name} (${formatFileSize(file.size)}), 타입: ${file.type}`);
      toast.info(`파일 업로드 중... (${i+1}/${attachmentFiles.length}): ${file.name}`);
      
      // FormData 객체 생성 및 파일 추가
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name); // 명시적으로 파일명도 추가
      console.log('[IssueForm] FormData 객체 생성 완료, 파일 추가됨:', file.name);
      
      try {
        // 직접 업로드 - 최대 3번 재시도
        let response: Response | null = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            console.log(`[IssueForm] 파일 업로드 요청 시작 (시도 ${retryCount + 1}/${maxRetries})`);
            console.log(`[IssueForm] 요청 URL: /api/issues/${issueId}/attachments`);
            
            // multipart/form-data 형식으로 전송 (Content-Type 헤더 제거)
            response = await fetch(`/api/issues/${issueId}/attachments`, {
              method: "POST",
              body: formData,
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              },
              credentials: 'include' // 쿠키 전송을 위해 추가
            });
            
            console.log(`[IssueForm] 응답 상태 코드: ${response.status}`);
            break; // 성공하면 루프 종료
          } catch (error) {
            retryCount++;
            console.error(`[IssueForm] 업로드 시도 ${retryCount}/${maxRetries} 실패:`, error);
            
            if (retryCount >= maxRetries) {
              throw error; // 최대 재시도 횟수 초과
            }
            
            // 잠시 대기 후 재시도
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (!response) {
          throw new Error("서버에 연결할 수 없습니다.");
        }
        
        // 응답 처리
        if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `텍스트 추출 실패: ${e}`;
          }
          
          console.error(`[IssueForm] 파일 '${file.name}' 업로드 실패 (HTTP ${response.status}):`, errorText);
          
          failCount++;
          uploadResults.push({
            success: false,
            fileName: file.name,
            error: errorText,
            status: response.status
          });
          toast.error(`파일 '${file.name}' 업로드 실패: ${response.status}`);
        } else {
          let data;
          let responseText = '';
          try {
            responseText = await response.text();
            console.log(`[IssueForm] 파일 '${file.name}' 업로드 응답 (${response.status}):`, responseText);
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error(`[IssueForm] 응답 파싱 오류:`, parseError, '원본 응답:', responseText);
            data = { message: "응답 파싱 실패" };
          }
          
          console.log(`[IssueForm] 파일 '${file.name}' 업로드 성공! 응답 데이터:`, data);
          uploadResults.push({
            success: true,
            fileName: file.name,
            data
          });
          toast.success(`파일 '${file.name}' 업로드 성공!`);
        }
      } catch (error) {
        console.error(`[IssueForm] 파일 '${file.name}' 업로드 중 오류:`, error);
        
        failCount++;
        uploadResults.push({
          success: false,
          fileName: file.name,
          error
        });
        toast.error(`파일 ${file.name} 업로드 중 오류 발생`);
      }
      
      // 각 파일 업로드 사이에 짧은 지연 추가
      if (i < attachmentFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 결과 요약
    const successCount = uploadResults.filter(r => r.success).length;
    
    console.log(`[IssueForm] 파일 업로드 완료. 결과: 성공 ${successCount}개, 실패 ${failCount}개`);
    
    if (successCount === attachmentFiles.length) {
      toast.success(`모든 파일(${successCount}개)이 성공적으로 업로드되었습니다.`);
    } else if (successCount > 0) {
      toast.warning(`일부 파일만 업로드되었습니다. (성공: ${successCount}개, 실패: ${failCount}개)`);
    } else if (attachmentFiles.length > 0) {
      toast.error(`모든 파일(${attachmentFiles.length}개) 업로드에 실패했습니다.`);
    }
    
    // 파일 URL 정리
    Object.values(fileUrls).forEach(url => {
      URL.revokeObjectURL(url);
    });
    setFileUrls({});
    setAttachmentFiles([]);
    
    return uploadResults;
  };

  // 번역 처리 함수
  const handleTranslation = async (field: 'title' | 'description', value: string) => {
    try {
      // 기존 번역 제거
      const originalText = removeExistingTranslation(value);
      if (!originalText.trim()) return;

      // 언어 감지
      const sourceLang = detectLanguage(originalText);
      
      // 번역 실행
      const translatedText = await translateText(originalText, sourceLang);
      
      // 번역 결과 포맷팅 및 상태 업데이트
      const formattedText = formatWithTranslation(originalText, translatedText);
      setFormData(prev => ({
        ...prev,
        [field]: formattedText
      }));
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(t('translation.error'));
    }
  };

  // 입력 필드 변경 핸들러
  const handleInputChange = (field: keyof FormData) => async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // 기존 번역 제거
    const cleanValue = removeExistingTranslation(value);
    
    // 상태 업데이트
    setFormData(prev => ({
      ...prev,
      [field]: cleanValue
    }));
  };

  // 포커스 아웃 핸들러
  const handleBlur = (field: 'title' | 'description') => async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.trim()) {
      await handleTranslation(field, value);
    }
  };

  const handleTitleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const input = e.target;
    const newValue = e.target.value;
    const selectionStart = input.selectionStart || 0;
    const selectionEnd = input.selectionEnd || 0;
    const previousValue = input.value;

    // 선택된 텍스트가 있거나 백스페이스/삭제 키를 사용한 경우
    if (selectionStart !== selectionEnd || previousValue.length !== newValue.length) {
      try {
        const updatedText = await updateTextWithTranslation(
          previousValue,
          newValue,
          selectionStart - (newValue.length - previousValue.length), // 백스페이스 고려
          selectionStart
        );
        setFormData(prev => ({
          ...prev,
          title: updatedText
        }));
      } catch (error) {
        console.error('Title update error:', error);
        setFormData(prev => ({
          ...prev,
          title: newValue
        })); // 에러 시 기본 동작
      }
    } else {
      setFormData(prev => ({
        ...prev,
        title: newValue
      })); // 일반 타이핑의 경우 바로 업데이트
    }
  };

  // description에 대해서도 동일한 핸들러 구현
  const handleDescriptionChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const input = e.target;
    const newValue = e.target.value;
    const selectionStart = input.selectionStart || 0;
    const selectionEnd = input.selectionEnd || 0;
    const previousValue = input.value;

    if (selectionStart !== selectionEnd || previousValue.length !== newValue.length) {
      try {
        const updatedText = await updateTextWithTranslation(
          previousValue,
          newValue,
          selectionStart - (newValue.length - previousValue.length),
          selectionStart
        );
        setFormData(prev => ({
          ...prev,
          description: updatedText
        }));
      } catch (error) {
        console.error('Description update error:', error);
        setFormData(prev => ({
          ...prev,
          description: newValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        description: newValue
      }));
    }
  };

  // 유효성 검사 함수
  const validateForm = () => {
    const newErrors: {
      title?: string;
      departmentId?: string;
      categoryId?: string;
      statusId?: string;
      priorityId?: string;
    } = {};

    // 필수 필드 검사
    if (!formData.title.trim()) {
      newErrors.title = t('issues.validation.title.' + language);
    }

    if (!formData.departmentId || formData.departmentId === 0) {
      newErrors.departmentId = t('issues.validation.department.' + language);
    }

    if (!formData.categoryId || formData.categoryId === 0) {
      newErrors.categoryId = t('issues.validation.category.' + language);
    }

    if (!formData.statusId || formData.statusId === 0) {
      newErrors.statusId = t('issues.validation.status.' + language);
    }

    if (!formData.priorityId || formData.priorityId === 0) {
      newErrors.priorityId = t('issues.validation.priority.' + language);
    }

    setErrors(newErrors);

    // 오류가 있는 경우 첫 번째 오류 필드로 스크롤
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = document.querySelector(`[name="${Object.keys(newErrors)[0]}"]`);
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return Object.keys(newErrors).length === 0;
  };

  // handleSubmit 함수 수정
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 유효성 검사 실행
    if (!validateForm()) {
      toast.error(t('issues.validation.required.' + language), {
        description: Object.values(errors).join('\n')
      });
      return;
    }

    setIsLoading(true);

    try {
      // 로그인 확인
      if (attachmentFiles.length > 0 && (status !== 'authenticated' || !session?.user)) {
        toast.error('파일 업로드를 위해 로그인이 필요합니다.');
        setIsLoading(false);
        return;
      }

      // title과 description 번역 확인 및 처리
      let titleToSave = formData.title;
      let descriptionToSave = formData.description;

      // title 번역 확인
      if (formData.title && !formData.title.includes('(')) {
        const cleanTitle = removeExistingTranslation(formData.title);
        const titleLang = detectLanguage(cleanTitle);
        const translatedTitle = await translateText(cleanTitle, titleLang);
        titleToSave = formatWithTranslation(cleanTitle, translatedTitle);
      }

      // description 번역 확인
      if (formData.description && !formData.description.includes('(')) {
        const cleanDesc = removeExistingTranslation(formData.description);
        const descLang = detectLanguage(cleanDesc);
        const translatedDesc = await translateText(cleanDesc, descLang);
        descriptionToSave = formatWithTranslation(cleanDesc, translatedDesc);
      }

      // 이슈 데이터 준비
      const issueData = {
        title: titleToSave,
        description: descriptionToSave,
        assigneeId: formData.assigneeId ? Number(formData.assigneeId) : null,
        solverId: formData.solverId ? Number(formData.solverId) : null,
        departmentId: Number(formData.departmentId),
        statusId: Number(formData.statusId),
        priorityId: Number(formData.priorityId),
        categoryId: Number(formData.categoryId),
        dueDate: formData.dueDate
      };
      
      console.log('전송할 데이터:', issueData);

      // API 요청 설정
      const url = isEdit ? `/api/issues/${initialData?.id}` : '/api/issues';
      const method = isEdit ? 'PUT' : 'POST';
      
      console.log('요청 URL:', url, '메서드:', method);

      // 이슈 생성/수정 요청
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('서버 응답 오류:', errorData);
        throw new Error(errorData.error || (isEdit ? t('issues.editError') : t('issues.createError')));
      }

      const data = await response.json();
      console.log('이슈 생성/수정 서버 응답:', data);
      
      const issueId = isEdit ? initialData?.id : data.issue.id;
      console.log('이슈 ID:', issueId);
      
      // 이슈 수정인 경우 히스토리 저장
      if (isEdit && issueId) {
        try {
          // 변경된 데이터 준비
          const previousData = {
            title: initialData?.title,
            description: initialData?.description,
            assigneeId: initialData?.assigneeId,
            solverId: initialData?.solverId,
            departmentId: initialData?.departmentId,
            statusId: initialData?.statusId,
            priorityId: initialData?.priorityId,
            categoryId: initialData?.categoryId,
            dueDate: initialData?.dueDate
          };

          const newData = {
            title: formData.title,
            description: formData.description,
            assigneeId: formData.assigneeId,
            solverId: formData.solverId,
            departmentId: formData.departmentId,
            statusId: formData.statusId,
            priorityId: formData.priorityId,
            categoryId: formData.categoryId,
            dueDate: formData.dueDate
          };

          const historyResponse = await fetch(`/api/issues/${issueId}/history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              summary: `이슈가 수정되었습니다.`,
              previousData: JSON.stringify(previousData),
              newData: JSON.stringify(newData),
              changeType: 'UPDATE'
            })
          });

          if (!historyResponse.ok) {
            console.error('히스토리 저장 실패:', await historyResponse.text());
          }
        } catch (historyError) {
          console.error('히스토리 저장 중 오류:', historyError);
        }
      }
      
      // 이슈 생성과 파일 업로드 사이에 짧은 지연 추가
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 파일 업로드 처리
      if (attachmentFiles.length > 0) {
        // 로그인 상태 재확인
        if (status !== 'authenticated' || !session?.user) {
          toast.error('파일 업로드를 위해 로그인이 필요합니다. 이슈는 생성되었지만 파일은 업로드되지 않았습니다.');
        } else {
          toast.info(`${attachmentFiles.length}개 파일 업로드 중...`);
          try {
            const uploadResult = await uploadAttachments(issueId);
            console.log('모든 파일 업로드 완료:', uploadResult);
            
            // 업로드 결과 요약
            const successCount = uploadResult.filter(r => r.success).length;
            if (successCount === attachmentFiles.length) {
              toast.success(`${successCount}개 파일 업로드 완료`);
            } else if (successCount > 0) {
              toast.warning(`${successCount}/${attachmentFiles.length}개 파일 업로드 완료`);
            } else if (attachmentFiles.length > 0) {
              toast.error('파일 업로드에 실패했습니다.');
            }
          } catch (uploadError) {
            console.error('파일 업로드 중 예외 발생:', uploadError);
            toast.error('파일 업로드 중 오류가 발생했습니다');
          }
        }
      }

      // 모든 처리가 완료된 후 페이지 이동
      toast.success(isEdit ? t('issues.editSuccess') : t('issues.createSuccess'));
      
      // 페이지 이동 전 짧은 지연 추가
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/issues/${issueId}`);
    } catch (error) {
      console.error(isEdit ? '이슈 수정 중 오류:' : '이슈 생성 중 오류:', error);
      toast.error(isEdit ? t('issues.editError') : t('issues.createError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 파일 첨부 처리 함수
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // 새 파일에 대한 URL 생성
      const newUrls: {[key: string]: string} = {};
      newFiles.forEach(file => {
        newUrls[file.name + file.size] = URL.createObjectURL(file);
      });
      
      setFileUrls(prev => ({...prev, ...newUrls}));
      setAttachmentFiles((prev) => [...prev, ...newFiles]);
    }
  };
  
  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 파일 제거 함수
  const removeFile = (index: number) => {
    const fileToRemove = attachmentFiles[index];
    if (fileToRemove) {
      const key = fileToRemove.name + fileToRemove.size;
      if (fileUrls[key]) {
        URL.revokeObjectURL(fileUrls[key]);
        setFileUrls(prev => {
          const updated = {...prev};
          delete updated[key];
          return updated;
        });
      }
    }
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 현재 언어에 맞는 필드 선택 함수
  const getDepartmentDisplayName = (dept: Department) => {
    if (language === 'en') return dept.name;
    if (language === 'th') return dept.thaiLabel || dept.label;
    return dept.label; // 기본값 한국어
  };
  
  // 상태 표시명 가져오기
  const getStatusDisplayName = (status: Status) => {
    if (language === 'en') return status.name;
    if (language === 'th') return status.thaiLabel || status.label;
    return status.label; // 기본값 한국어
  };
  
  // 우선순위 표시명 가져오기
  const getPriorityDisplayName = (priority: Priority) => {
    if (language === 'en') return priority.name;
    if (language === 'th') return priority.thaiLabel || priority.label;
    return priority.label; // 기본값 한국어
  };
  
  // 카테고리 표시명 가져오기
  const getCategoryDisplayName = (category: Category) => {
    if (language === 'en') return category.name;
    if (language === 'th') return category.thaiLabel || category.label;
    return category.label; // 기본값 한국어
  };

  // 필터 데이터 로드
  useEffect(() => {
    loadFilterData();
  }, [formData.departmentId, language]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">{t('issues.title')} *</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleTitleChange}
          onBlur={(e) => handleBlur('title')(e)}
          placeholder={t('issues.titlePlaceholder')}
          className={errors.title ? 'border-red-500' : ''}
          required
          onInvalid={(e: React.InvalidEvent<HTMLInputElement>) => {
            e.preventDefault();
            setErrors(prev => ({
              ...prev,
              title: t('issues.validation.title.' + language)
            }));
          }}
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('issues.description')}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={handleDescriptionChange}
          onBlur={(e) => handleBlur('description')(e)}
          placeholder={t('issues.descriptionPlaceholder')}
          className="min-h-[200px] border border-input rounded-md focus:border-blue-500 p-4"
        />
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-12 gap-4'}`}>
        <div className="col-span-2">
          <Label htmlFor="department">
            {t('issues.department')} <span className="text-red-500">*</span>
          </Label>
          <Select
            name="departmentId"
            value={formData.departmentId?.toString() || ''}
            onValueChange={(value) => {
              setFormData({ ...formData, departmentId: parseInt(value), assigneeId: undefined });
              setErrors(prev => ({ ...prev, departmentId: undefined }));
            }}
            required
          >
            <SelectTrigger className={`mt-1 w-full ${isMobile ? 'text-base' : ''} ${errors.departmentId ? 'border-red-500' : ''}`}>
              <SelectValue placeholder={t('common.select')} />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {getDepartmentDisplayName(dept)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.departmentId && (
            <p className="text-red-500 text-sm mt-1">{errors.departmentId}</p>
          )}
        </div>

        <div className="col-span-5">
          <Label htmlFor="assignee">
            {t('issues.issueFinder')}
          </Label>
          <Select
            value={formData.assigneeId?.toString() || ''}
            onValueChange={(value) => setFormData({ ...formData, assigneeId: Number(value) })}
          >
            <SelectTrigger className={`mt-1 w-full ${isMobile ? 'text-base' : ''}`}>
              <SelectValue placeholder={t('issues.selectAssignee')} />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id.toString()}>
                  {employee.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-5">
          <Label htmlFor="solver">
            {t('issues.issueResolver')}
          </Label>
          <Select
            value={formData.solverId?.toString() || ''}
            onValueChange={(value) => setFormData({ ...formData, solverId: Number(value) })}
          >
            <SelectTrigger className={`mt-1 w-full ${isMobile ? 'text-base text-left' : ''}`}>
              <SelectValue placeholder={t('issues.selectSolver')} />
            </SelectTrigger>
            <SelectContent>
              {adminEmployees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id.toString()}>
                  {employee.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-3 gap-4'}`}>
        <div>
          <Label htmlFor="category">
            {t('issues.category')} <span className="text-red-500">*</span>
          </Label>
          <Select
            name="categoryId"
            value={formData.categoryId?.toString() || ''}
            onValueChange={(value) => {
              setFormData({ ...formData, categoryId: parseInt(value) });
              setErrors(prev => ({ ...prev, categoryId: undefined }));
            }}
            required
          >
            <SelectTrigger className={`mt-1 w-full ${isMobile ? 'text-base' : ''} ${errors.categoryId ? 'border-red-500' : ''}`}>
              <SelectValue placeholder={t('common.select')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {getCategoryDisplayName(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
          )}
        </div>

        <div>
          <Label htmlFor="status">
            {t('issues.status')} <span className="text-red-500">*</span>
          </Label>
          <Select
            name="statusId"
            value={formData.statusId.toString()}
            onValueChange={(value) => {
              const statusId = parseInt(value);
              if (!isNaN(statusId)) {
                setFormData({ ...formData, statusId });
                setErrors(prev => ({ ...prev, statusId: undefined }));
              }
            }}
            required
          >
            <SelectTrigger className={`mt-1 w-full ${isMobile ? 'text-base' : ''} ${errors.statusId ? 'border-red-500' : ''}`}>
              <SelectValue placeholder={t('issues.selectStatus')} />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status.id} value={status.id.toString()}>
                  {getStatusDisplayName(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.statusId && (
            <p className="text-red-500 text-sm mt-1">{errors.statusId}</p>
          )}
        </div>

        <div>
          <Label htmlFor="priority">
            {t('issues.priority')} <span className="text-red-500">*</span>
          </Label>
          <Select
            name="priorityId"
            value={formData.priorityId?.toString() || ''}
            onValueChange={(value) => {
              setFormData({ ...formData, priorityId: parseInt(value) });
              setErrors(prev => ({ ...prev, priorityId: undefined }));
            }}
            required
          >
            <SelectTrigger className={`mt-1 w-full ${isMobile ? 'text-base' : ''} ${errors.priorityId ? 'border-red-500' : ''}`}>
              <SelectValue placeholder={t('common.select')} />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => (
                <SelectItem key={priority.id} value={priority.id.toString()}>
                  {getPriorityDisplayName(priority)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.priorityId && (
            <p className="text-red-500 text-sm mt-1">{errors.priorityId}</p>
          )}
        </div>

        <div>
          <Label htmlFor="dueDate">
            {t('issues.dueDate')}
          </Label>
          <Input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate || ''}
            onChange={handleDateChange}
            className={`mt-1 w-full ${isMobile ? 'text-base' : ''} date-input-standard`}
            placeholder="YYYY-MM-DD"
          />
        </div>
      </div>

      <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-end space-x-2'} mt-4`}>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className={isMobile ? 'w-full' : ''}
        >
          {t('common.cancel')}
        </Button>
        <Button 
          type="submit"
          className={`${isMobile ? 'w-full' : ''} bg-blue-500 hover:bg-blue-600`}
          disabled={isLoading}
        >
          {isLoading ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
} 