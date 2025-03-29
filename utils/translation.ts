// import OpenAI from 'openai';

// 언어 감지 함수
export const detectLanguage = (text: string): 'ko' | 'th' => {
  // 태국어 문자 범위: \u0E00-\u0E7F
  const thaiRegex = /[\u0E00-\u0E7F]/;
  
  // 한글 문자 범위: \uAC00-\uD7A3
  const koreanRegex = /[\uAC00-\uD7A3]/;
  
  if (thaiRegex.test(text)) return 'th';
  if (koreanRegex.test(text)) return 'ko';
  
  // 기본값으로 한국어 반환
  return 'ko';
};

// 원본 텍스트 추출 함수
export const extractOriginalText = (text: string): string => {
  const match = text.match(/^(.*?)\s*\[\[[\s\S]*?\]\]\s*$/);
  return match ? match[1].trim() : text.trim();
};

// 번역 텍스트 추출 함수
export const extractTranslation = (text: string): string | null => {
  const match = text.match(/\[\[([\s\S]*?)\]\]$/);
  return match ? match[1].trim() : null;
};

// 번역 함수 - 서버 API 호출
export const translateText = async (text: string, sourceLang: 'ko' | 'th'): Promise<string> => {
  try {
    // 텍스트를 줄 단위로 분리
    const lines = text.split('\n').filter(line => line.trim());
    
    // 각 줄을 개별적으로 번역
    const translatedLines = await Promise.all(
      lines.map(async (line) => {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            text: line.trim(),
            sourceLang,
            preserveBrackets: true // 괄호 보존 옵션 추가
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '번역 요청 실패');
        }

        const data = await response.json();
        return data.translatedText;
      })
    );

    // 번역된 줄들을 줄바꿈으로 연결
    return translatedLines.join('\n');
  } catch (error) {
    console.error('Translation error:', error);
    throw error instanceof Error ? error : new Error('번역 중 오류가 발생했습니다.');
  }
};

// 기존 번역 제거 함수
export const removeExistingTranslation = (text: string): string => {
  // 이중 대괄호와 그 안의 내용만 제거하고 일반 괄호는 유지
  return text.replace(/\s*\[\[[\s\S]*?\]\]/g, '').trim();
};

// 번역 텍스트 포맷팅 함수
export const formatWithTranslation = (originalText: string, translatedText: string): string => {
  // 원본 텍스트의 줄바꿈을 유지
  const formattedOriginalText = originalText.split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .join('\n');
  
  // 번역문을 이중 대괄호로 감싸서 추가
  return `${formattedOriginalText}\n\n[[${translatedText.trim()}]]`;
};

// 텍스트 업데이트 및 번역 함수
export const updateTextWithTranslation = async (
  currentText: string,  // 현재 텍스트 (번역 포함)
  newText: string,     // 새로운 텍스트 (부분 수정된)
  selectionStart: number, // 선택 시작 위치
  selectionEnd: number   // 선택 끝 위치
): Promise<string> => {
  try {
    // 원본 텍스트 추출
    const originalText = extractOriginalText(currentText);
    
    // 선택된 부분을 새 텍스트로 교체하여 새로운 원본 텍스트 생성
    const updatedOriginalText = 
      originalText.substring(0, selectionStart) +
      newText +
      originalText.substring(selectionEnd);

    // 새로운 원본 텍스트에 대한 번역 생성
    const sourceLang = detectLanguage(updatedOriginalText);
    const translatedText = await translateText(updatedOriginalText, sourceLang);
    
    return formatWithTranslation(updatedOriginalText, translatedText);
  } catch (error) {
    console.error('Translation update error:', error);
    return currentText; // 에러 발생 시 현재 텍스트 유지
  }
}; 