'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import useTranslation from '@/utils/i18n';
import { FiDatabase, FiFilter, FiList, FiUser, FiDownload, FiUpload, FiPlus, FiEdit2, FiTrash, FiX, FiRefreshCw, FiSave } from 'react-icons/fi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { textToCodeSync } from '@/utils/textToCode';

interface Item {
  id: number;
  name: string;
  label: string;
  description: string;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('backup');
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'ko' as 'ko' | 'th' | 'en'
  });

  const tabs = [
    { id: 'backup', name: '백업 관리' },
    { id: 'status', name: '상태 관리' },
    { id: 'priority', name: '우선순위 관리' },
    { id: 'category', name: '카테고리 관리' },
    { id: 'department', name: '부서 관리' }
  ];

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [language, setLanguage] = useState<'ko' | 'th' | 'en'>('ko');

  // 컴포넌트 마운트 시 언어 설정을 로드합니다.
  useEffect(() => {
    // 로컬 스토리지에서 저장된 언어 설정을 가져옵니다.
    try {
      const savedLanguage = localStorage.getItem('language') as 'ko' | 'th' | 'en';
      if (savedLanguage && ['ko', 'th', 'en'].includes(savedLanguage)) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('언어 설정 로드 중 오류:', error);
    }
  }, []);

  // 언어 변경 핸들러
  const handleLanguageChange = (newLanguage: 'ko' | 'th' | 'en') => {
    setLanguage(newLanguage);
    
    // 로컬 스토리지에 언어 설정을 저장합니다.
    try {
      localStorage.setItem('language', newLanguage);
    } catch (error) {
      console.error('언어 설정 저장 중 오류:', error);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/backup/export', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('데이터 내보내기 실패');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factory_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('데이터 내보내기 중 오류:', error);
      alert('데이터 내보내기에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/backup/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('데이터 가져오기 실패');
      }

      alert('데이터를 성공적으로 가져왔습니다.');
      window.location.reload();
    } catch (error) {
      console.error('데이터 가져오기 중 오류:', error);
      alert('데이터 가져오기에 실패했습니다.');
    } finally {
      setIsImporting(false);
    }
  };

  // 데이터 로드 함수
  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'status':
          endpoint = '/api/status';
          break;
        case 'priority':
          endpoint = '/api/priority';
          break;
        case 'category':
          endpoint = '/api/category';
          break;
        case 'department':
          endpoint = '/api/department';
          break;
      }

      if (endpoint) {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('데이터 로드 실패');
        const data = await response.json();
        
        // 각 엔드포인트별로 다른 키를 사용하므로 적절히 처리
        if (data.statuses) setStatuses(data.statuses);
        else if (data.priorities) setPriorities(data.priorities);
        else if (data.categories) setCategories(data.categories);
        else if (data.departments) setDepartments(data.departments);
        else setItems([]);
      }
    } catch (error) {
      console.error('데이터 로드 중 오류:', error);
      setError("데이터를 불러오는데 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'backup') {
      loadData();
    }
  }, [activeTab]);

  // 모달 열기
  const openModal = (mode: 'add' | 'edit', item?: Item) => {
    console.log('openModal 호출됨 - mode:', mode, 'item:', item);
    setModalMode(mode);
    if (item) {
      setSelectedItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        language: language // 현재 선택된 언어 추가
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: '',
        description: '',
        language: language // 현재 선택된 언어 추가
      });
    }
    setShowModal(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setFormData({
      name: '',
      description: '',
      language: 'ko' as 'ko' | 'th' | 'en'
    });
  };

  // 항목 추가/수정 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 이름이 비어있는지 확인
    if (!formData.name?.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'status':
          endpoint = '/api/status';
          break;
        case 'priority':
          endpoint = '/api/priority';
          break;
        case 'category':
          endpoint = '/api/category';
          break;
        case 'department':
          endpoint = '/api/department';
          break;
        default:
          throw new Error('올바르지 않은 탭입니다.');
      }

      // API 요청 데이터 구성
      const requestData: {
        name: string;
        description: string;
        id?: number;
      } = {
        name: formData.name,  // 라벨 (한글)
        description: formData.description || ''
      };

      if (modalMode === 'edit' && selectedItem) {
        requestData.id = selectedItem.id;
      }

      console.log('저장 요청 데이터:', requestData);

      const response = await fetch(
        modalMode === 'edit' && selectedItem
          ? `${endpoint}/${selectedItem.id}`
          : endpoint,
        {
          method: modalMode === 'edit' ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('서버 응답 오류:', errorData);
        throw new Error(`저장에 실패했습니다. (${response.status}): ${JSON.stringify(errorData)}`);
      }
      
      const responseData = await response.json();
      console.log('저장 성공:', responseData);
      
      // 성공 시 데이터 다시 로드
      await loadData();
      closeModal();
      
      // 성공 메시지 표시
      alert('저장이 완료되었습니다.');
    } catch (error) {
      console.error('저장 중 오류 발생:', error);
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.');
    }
  };

  // 항목 삭제 함수
  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      let endpoint = '';
      switch (activeTab) {
        case 'status':
          endpoint = '/api/status';
          break;
        case 'priority':
          endpoint = '/api/priority';
          break;
        case 'category':
          endpoint = '/api/category';
          break;
        case 'department':
          endpoint = '/api/department';
          break;
      }

      const response = await fetch(`${endpoint}?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('삭제 실패');

      loadData();
      alert('삭제되었습니다.');
    } catch (error) {
      console.error('삭제 중 오류:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  // 항목 수정 함수
  const updateItem = async (type, id, field, value) => {
    try {
      const response = await fetch(`/api/settings/${type}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error("업데이트 실패");
      }

      // 성공 시 데이터 다시 로드
      loadData();
    } catch (error) {
      console.error('업데이트 중 오류:', error);
      setError("항목 업데이트에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900">설정</h1>
          <p className="mt-2 text-sm text-gray-700">
            시스템 설정을 관리합니다
          </p>
        </div>

        <div className="mt-4">
          <div className="sm:hidden">
            <select
              className="block w-full rounded-md border-gray-300 py-2"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="mt-8 bg-white shadow rounded-lg p-6">
            {activeTab === 'backup' && (
              <div className="space-y-8">
                {/* 데이터 내보내기 섹션 */}
                <div>
                  <div className="flex items-center">
                    <FiDownload className="h-6 w-6 text-gray-400" />
                    <h3 className="ml-3 text-lg font-medium text-gray-900">데이터 내보내기</h3>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      현재 시스템의 모든 데이터를 백업 파일로 내보냅니다.
                    </p>
                    <button
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:opacity-50"
                    >
                      {isExporting ? '내보내는 중...' : '데이터 내보내기'}
                    </button>
                  </div>
                </div>

                {/* 데이터 가져오기 섹션 */}
                <div>
                  <div className="flex items-center">
                    <FiUpload className="h-6 w-6 text-gray-400" />
                    <h3 className="ml-3 text-lg font-medium text-gray-900">데이터 가져오기</h3>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      백업 파일에서 데이터를 복원합니다. 기존 데이터는 백업 데이터로 대체됩니다.
                    </p>
                    <div className="mt-4">
                      <label className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none cursor-pointer disabled:opacity-50">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportData}
                          disabled={isImporting}
                          className="hidden"
                        />
                        {isImporting ? '가져오는 중...' : '데이터 가져오기'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* 자동 백업 설정 섹션 */}
                <div>
                  <div className="flex items-center">
                    <FiDatabase className="h-6 w-6 text-gray-400" />
                    <h3 className="ml-3 text-lg font-medium text-gray-900">자동 백업 설정</h3>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      시스템 데이터를 자동으로 백업하는 주기를 설정합니다.
                    </p>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="backup-frequency"
                          id="daily"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <label htmlFor="daily" className="ml-3 text-sm text-gray-700">
                          매일 백업
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="backup-frequency"
                          id="weekly"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          defaultChecked
                        />
                        <label htmlFor="weekly" className="ml-3 text-sm text-gray-700">
                          주간 백업
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="backup-frequency"
                          id="monthly"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <label htmlFor="monthly" className="ml-3 text-sm text-gray-700">
                          월간 백업
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'status' || activeTab === 'priority' || activeTab === 'category' || activeTab === 'department') && (
              <div>
                <div className="flex mb-6 justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    {tabs.find(tab => tab.id === activeTab)?.name}
                  </h3>
                  <div className="flex gap-2">
                    {/* 언어 선택 드롭다운 제거됨 */}
                    <Button
                      onClick={() => loadData()}
                      className="h-8 rounded-md px-3 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2"
                    >
                      <FiRefreshCw />
                      {t('common.refresh')}
                    </Button>
                    <Button
                      onClick={() => openModal('add')}
                      className="h-8 rounded-md px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FiPlus />
                      {t('common.add')}
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-12">로딩 중...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            코드
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            라벨
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            설명
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            작업
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeTab === 'status' && statuses.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <input
                                type="text"
                                value={item.label || ''}
                                onChange={(e) => {
                                  const newLabel = e.target.value;
                                  setStatuses((prev: any) => 
                                    prev.map((s: any) => s.id === item.id ? {...s, label: newLabel} : s)
                                  );
                                }}
                                onBlur={() => updateItem('statuses', item.id, 'label', item.label)}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={(e) => {
                                  const newDesc = e.target.value;
                                  setStatuses((prev: any) => 
                                    prev.map((s: any) => s.id === item.id ? {...s, description: newDesc} : s)
                                  );
                                }}
                                onBlur={() => updateItem('statuses', item.id, 'description', item.description)}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => openModal('edit', item)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <FiEdit2 className="inline" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash className="inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {activeTab === 'priority' && priorities.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <input
                                type="text"
                                value={item.label || ''}
                                onChange={(e) => {
                                  const newLabel = e.target.value;
                                  setPriorities((prev: any) => 
                                    prev.map((p: any) => p.id === item.id ? {...p, label: newLabel} : p)
                                  );
                                }}
                                onBlur={() => updateItem('priorities', item.id, 'label', item.label)}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={(e) => {
                                  const newDesc = e.target.value;
                                  setPriorities((prev: any) => 
                                    prev.map((p: any) => p.id === item.id ? {...p, description: newDesc} : p)
                                  );
                                }}
                                onBlur={() => updateItem('priorities', item.id, 'description', item.description)}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => openModal('edit', item)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <FiEdit2 className="inline" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash className="inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {activeTab === 'category' && categories.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <input
                                type="text"
                                value={item.label || ''}
                                onChange={(e) => {
                                  const newLabel = e.target.value;
                                  setCategories((prev: any) => 
                                    prev.map((c: any) => c.id === item.id ? {...c, label: newLabel} : c)
                                  );
                                }}
                                onBlur={() => updateItem('categories', item.id, 'label', item.label)}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={(e) => {
                                  const newDesc = e.target.value;
                                  setCategories((prev: any) => 
                                    prev.map((c: any) => c.id === item.id ? {...c, description: newDesc} : c)
                                  );
                                }}
                                onBlur={() => updateItem('categories', item.id, 'description', item.description)}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => openModal('edit', item)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <FiEdit2 className="inline" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash className="inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {activeTab === 'department' && departments.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <input
                                type="text"
                                value={item.label || ''}
                                onChange={(e) => {
                                  const newLabel = e.target.value;
                                  setDepartments((prev: any) => 
                                    prev.map((d: any) => d.id === item.id ? {...d, label: newLabel} : d)
                                  );
                                }}
                                onBlur={() => updateItem('departments', item.id, 'label', item.label)}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={(e) => {
                                  const newDesc = e.target.value;
                                  setDepartments((prev: any) => 
                                    prev.map((d: any) => d.id === item.id ? {...d, description: newDesc} : d)
                                  );
                                }}
                                onBlur={() => updateItem('departments', item.id, 'description', item.description)}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => openModal('edit', item)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <FiEdit2 className="inline" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash className="inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {modalMode === 'add' ? '새 항목 추가' : '항목 수정'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  라벨
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="라벨을 입력하세요"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  설명
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="설명을 입력하세요"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {modalMode === 'add' ? '추가' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 