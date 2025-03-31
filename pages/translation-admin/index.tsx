import { useState, useEffect } from 'react';
import { addTranslation, getTranslations, generateCode } from '@/lib/i18n';
import type { TranslationType, SupportedLanguage } from '@/lib/i18n';
import Head from 'next/head';

export default function TranslationAdminPage() {
  const [translations, setTranslations] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // 언어 정의
  const LANGUAGES = {
    KO: 'ko' as SupportedLanguage,
    TH: 'th' as SupportedLanguage
  };
  
  // 새 번역 추가용 상태
  const [newKey, setNewKey] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [newTranslations, setNewTranslations] = useState<{
    [key: string]: string;
  }>({
    [LANGUAGES.KO]: '',
    [LANGUAGES.TH]: '',
  });
  
  // 성공/실패 메시지
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  
  // 번역 데이터 가져오기
  const fetchTranslations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/translations');
      if (!response.ok) {
        throw new Error('번역 데이터를 가져오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setTranslations(data.translations);
      
      // 카테고리 목록 추출
      const uniqueCategories = Array.from(
        new Set(data.translations.map((t: any) => t.category))
      ).sort() as string[];
      setCategories(uniqueCategories);
    } catch (err: any) {
      setError(err.message || '번역 데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 초기 데이터 로드
  useEffect(() => {
    fetchTranslations();
  }, []);
  
  // 검색 및 필터링된 번역 데이터
  const filteredTranslations = translations.filter((translation) => {
    // 카테고리 필터
    if (selectedCategory !== 'all' && translation.category !== selectedCategory) {
      return false;
    }
    
    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        translation.key.toLowerCase().includes(query) ||
        translation.translation.toLowerCase().includes(query) ||
        translation.category.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // 번역 추가 처리
  const handleAddTranslation = async () => {
    try {
      if (!newKey || !newCategory) {
        setMessage({
          type: 'error',
          text: '키와 카테고리는 필수입니다.',
        });
        return;
      }
      
      // 태국어 번역 추가
      if (newTranslations[LANGUAGES.TH]) {
        await addTranslation(
          newCategory as TranslationType,
          newTranslations[LANGUAGES.TH],
          newTranslations[LANGUAGES.TH]
        );
      }
      
      // 폼 초기화
      setNewKey('');
      setNewCategory('');
      setNewTranslations({
        [LANGUAGES.KO]: '',
        [LANGUAGES.TH]: '',
      });
      
      // 데이터 다시 불러오기
      await fetchTranslations();
      
      setMessage({
        type: 'success',
        text: '번역이 성공적으로 추가되었습니다.',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || '번역 추가 중 오류가 발생했습니다.',
      });
    }
  };
  
  // 번역 편집 핸들러
  const handleEditTranslation = async (translation: any) => {
    try {
      await fetch('/api/translations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: translation.id,
          key: translation.key,
          language: translation.language,
          translation: translation.translation,
          category: translation.category,
        }),
      });
      
      // 데이터 다시 불러오기
      await fetchTranslations();
      
      setMessage({
        type: 'success',
        text: '번역이 성공적으로 업데이트되었습니다.',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || '번역 업데이트 중 오류가 발생했습니다.',
      });
    }
  };
  
  // 번역 삭제 핸들러
  const handleDeleteTranslation = async (id: number) => {
    if (!confirm('정말로 이 번역을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await fetch(`/api/translations?id=${id}`, {
        method: 'DELETE',
      });
      
      // 데이터 다시 불러오기
      await fetchTranslations();
      
      setMessage({
        type: 'success',
        text: '번역이 성공적으로 삭제되었습니다.',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || '번역 삭제 중 오류가 발생했습니다.',
      });
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>번역 관리 - 공장 관리 시스템</title>
        <meta name="description" content="다국어 번역을 관리하는 관리자 페이지입니다." />
      </Head>
      
      <h1 className="text-2xl font-bold mb-6">번역 관리</h1>
      
      {message && (
        <div
          className={`p-4 mb-4 rounded ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
          <button
            className="float-right"
            onClick={() => setMessage(null)}
          >
            ✕
          </button>
        </div>
      )}
      
      {/* 필터 및 검색 */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            카테고리 필터
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">모든 카테고리</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            검색
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="키, 번역 또는 카테고리 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex-1 min-w-[200px] flex items-end">
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            onClick={() => fetchTranslations()}
          >
            새로고침
          </button>
        </div>
      </div>
      
      {/* 새 번역 추가 폼 */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">새 번역 추가</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              키
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="예: common.submit"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="예: common, login, dashboard"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              list="categories"
            />
            <datalist id="categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {Object.entries(LANGUAGES).map(([code, lang]) => (
            <div key={code}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {code === 'KO' ? '한국어' : '태국어'} 번역
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded"
                rows={3}
                placeholder={`${code === 'KO' ? '한국어' : 'ภาษาไทย'} 번역 입력...`}
                value={newTranslations[lang]}
                onChange={(e) => 
                  setNewTranslations({
                    ...newTranslations,
                    [lang]: e.target.value,
                  })
                }
              />
            </div>
          ))}
        </div>
        
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={handleAddTranslation}
        >
          번역 추가
        </button>
      </div>
      
      {/* 번역 목록 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2">로딩 중...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-800 p-4 rounded">
          {error}
        </div>
      ) : filteredTranslations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery
            ? '검색 결과가 없습니다'
            : '번역 데이터가 없습니다'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">
                  키
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">
                  언어
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">
                  번역
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">
                  카테고리
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 border-b">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTranslations.map((translation) => (
                <tr key={translation.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {translation.id}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {translation.key}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {translation.language}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      type="text"
                      className="w-full p-1 border border-gray-300 rounded"
                      value={translation.translation}
                      onChange={(e) => {
                        // 로컬 업데이트
                        const updatedTranslations = translations.map((t) =>
                          t.id === translation.id
                            ? { ...t, translation: e.target.value }
                            : t
                        );
                        setTranslations(updatedTranslations);
                      }}
                      onBlur={() => handleEditTranslation(translation)}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {translation.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeleteTranslation(translation.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 