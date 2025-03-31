import { useState, useEffect } from 'react';
import { useTranslation } from '@/store/languageStore';
import Head from 'next/head';

export default function NetworkTestPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    api: boolean;
    server: boolean;
    browser: boolean;
  }>({
    api: false,
    server: false,
    browser: true // 페이지가 로드되었으므로 브라우저는 작동 중
  });

  // 네트워크 테스트 실행
  useEffect(() => {
    async function runNetworkTest() {
      setIsLoading(true);
      setError(null);
      
      try {
        // 네트워크 체크 API 호출
        const response = await fetch('/api/network-check');
        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }
        
        const data = await response.json();
        setNetworkInfo(data);
        setTestResults(prev => ({
          ...prev,
          api: true,
          server: true
        }));
      } catch (err) {
        console.error('네트워크 테스트 중 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류');
        setTestResults(prev => ({
          ...prev,
          api: false,
          server: false
        }));
      } finally {
        setIsLoading(false);
      }
    }
    
    runNetworkTest();
  }, []);
  
  // 테스트 다시 실행
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>네트워크 연결 테스트 - 공장 관리 시스템</title>
        <meta name="description" content="네트워크 연결 상태를 테스트하고 문제를 진단합니다." />
      </Head>
      
      <h1 className="text-2xl font-bold mb-6">네트워크 연결 테스트</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          <p className="ml-4">테스트 실행 중...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm leading-5 text-red-700">
                네트워크 테스트 실패: {error}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm leading-5 text-green-700">
                네트워크 연결이 정상입니다.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 테스트 결과 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">테스트 결과</h2>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${testResults.browser ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>브라우저 연결: {testResults.browser ? '성공' : '실패'}</span>
            </li>
            <li className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${testResults.api ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>API 연결: {testResults.api ? '성공' : '실패'}</span>
            </li>
            <li className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${testResults.server ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>서버 연결: {testResults.server ? '성공' : '실패'}</span>
            </li>
          </ul>
          
          <button 
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            다시 테스트
          </button>
        </div>
        
        {/* 클라이언트 정보 */}
        {networkInfo && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">클라이언트 정보</h2>
            <p><strong>IP 주소:</strong> {networkInfo.client.ip}</p>
            <p className="mt-2"><strong>브라우저:</strong> </p>
            <p className="text-sm text-gray-600 break-all">{networkInfo.client.userAgent}</p>
            <p className="mt-2"><strong>접속 시간:</strong> {new Date(networkInfo.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>
      
      {/* 문제 해결 가이드 */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">문제 해결 가이드</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-blue-600">1. 같은 Wi-Fi 네트워크에 연결되어 있는지 확인</h3>
            <p className="mt-1 text-gray-600">서버(192.168.1.33)와 모바일 기기가 동일한 Wi-Fi 네트워크에 연결되어 있어야 합니다.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-blue-600">2. 방화벽 설정 확인</h3>
            <p className="mt-1 text-gray-600">서버의 방화벽에서 3000번 포트가 열려 있는지 확인하세요.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-blue-600">3. 모바일 네트워크 설정 확인</h3>
            <p className="mt-1 text-gray-600">모바일 기기의 개인 DNS나 프록시 설정이 로컬 IP 접근을 차단하고 있을 수 있습니다.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-blue-600">4. 브라우저 캐시 및 쿠키 삭제</h3>
            <p className="mt-1 text-gray-600">모바일 브라우저의 캐시와 쿠키를 삭제한 후 다시 시도해보세요.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-blue-600">5. 서버 재시작</h3>
            <p className="mt-1 text-gray-600">서버를 재시작하여 네트워크 연결을 초기화해보세요.</p>
            <pre className="mt-2 bg-gray-100 p-2 rounded">
              <code>npm run dev -- -H 0.0.0.0</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
} 