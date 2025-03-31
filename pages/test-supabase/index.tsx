import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Head from 'next/head';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TestSupabasePage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTodos() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from('todos').select();
        
        if (error) throw error;
        
        setTodos(data || []);
      } catch (err) {
        console.error('할 일 데이터를 불러오는 중 오류 발생:', err);
        setError('데이터를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTodos();
  }, []);

  return (
    <div className="p-4">
      <Head>
        <title>Supabase 테스트 - 공장 관리 시스템</title>
        <meta name="description" content="Supabase 연결 테스트 페이지입니다." />
      </Head>
      
      <h1 className="text-2xl font-bold mb-4">Supabase 테스트 페이지</h1>
      
      {isLoading ? (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <>
          {todos && todos.length > 0 ? (
            <ul className="list-disc pl-5">
              {todos.map((todo) => (
                <li key={todo.id} className="mb-2">
                  {JSON.stringify(todo)}
                </li>
              ))}
            </ul>
          ) : (
            <p>현재 데이터가 없거나 todos 테이블이 없습니다.</p>
          )}
        </>
      )}
      
      <div className="mt-4 p-4 bg-yellow-100 rounded">
        <p>데이터베이스 연결 방법:</p>
        <ol className="list-decimal pl-5">
          <li>Supabase 계정에 로그인</li>
          <li>프로젝트 설정에서 SQL 편집기를 열기</li>
          <li>todos 테이블 생성: <code>CREATE TABLE todos (id SERIAL PRIMARY KEY, title TEXT, is_complete BOOLEAN DEFAULT FALSE);</code></li>
          <li>샘플 데이터 추가: <code>INSERT INTO todos (title) VALUES ('할 일 1'), ('할 일 2');</code></li>
        </ol>
      </div>
    </div>
  );
} 