'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { convertToEnglishKey } from '@/lib/i18n/translations';

interface AddItemFormProps {
  type: 'department' | 'category' | 'status' | 'priority';
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddItemForm({ type, onSuccess, onCancel }: AddItemFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemKey, setSystemKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 한글 이름이 입력되면 자동으로 영어 시스템 키 생성
  useEffect(() => {
    if (!name) {
      setSystemKey('');
      return;
    }

    // 한글이 포함된 경우 영어 키로 변환
    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(name)) {
      console.log(`[${type}] 한글 입력 감지:`, name);
      let key = convertToEnglishKey(name, type);
      console.log(`[${type}] 변환된 영어 키:`, key);
      console.log(`[${type}] 변환 타입:`, type);
      setSystemKey(key);
    } else {
      // 이미 영어인 경우 그대로 사용
      console.log(`[${type}] 영어 입력:`, name);
      setSystemKey(name.toLowerCase().replace(/\s+/g, '_'));
    }
  }, [name, type]);

  const getTitle = () => {
    switch (type) {
      case 'department': return '새 부서 추가';
      case 'category': return '새 항목 추가';
      case 'status': return '새 상태 추가';
      case 'priority': return '새 우선순위 추가';
      default: return '새 항목 추가';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`제출 - 이름: ${name}, 시스템키: ${systemKey}`);
    setError('');
    
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    
    if (!systemKey) {
      setError('영어 키 생성에 실패했습니다. 다시 시도해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // status와 priority 타입의 경우 특별히 처리
      const endpoint = type === 'status' || type === 'priority'
        ? `/api/${type}`
        : `/api/${type}s`;
        
      console.log('요청 전송 엔드포인트:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: systemKey,
          label: name,
          description,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '항목 추가 중 오류가 발생했습니다.');
      }
      
      // 한국어 번역 추가
      const koreanTranslation = await fetch('/api/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: systemKey,
          language: 'ko',
          translation: name,
          category: type
        }),
      });

      if (!koreanTranslation.ok) {
        throw new Error('한국어 번역 추가 중 오류가 발생했습니다.');
      }

      // 태국어 번역 추가
      const thaiTranslation = await fetch('/api/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: systemKey,
          language: 'th',
          translation: name, // 임시로 한국어 이름 사용
          category: type
        }),
      });

      if (!thaiTranslation.ok) {
        throw new Error('태국어 번역 추가 중 오류가 발생했습니다.');
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || '항목 추가 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">{getTitle()}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            이름
          </label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`표시할 이름 입력 (한글)`}
            className="w-full"
            autoComplete="username"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            시스템 키
          </label>
          <Input
            id="systemKey"
            name="systemKey"
            value={systemKey}
            readOnly
            placeholder="자동 생성됩니다"
            className="w-full bg-gray-50"
            autoComplete="username"
          />
          <p className="text-xs text-gray-500 mt-1">
            한글로 이름을 입력하면 자동으로 영어 시스템 키가 생성됩니다.
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            설명
          </label>
          <Textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="설명 입력 (선택사항)"
            className="w-full"
            autoComplete="off"
          />
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-600 rounded">
            {error}
          </div>
        )}
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? '처리 중...' : '추가'}
          </Button>
        </div>
      </form>
    </div>
  );
} 