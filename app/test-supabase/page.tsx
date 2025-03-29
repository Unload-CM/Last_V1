import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase 테스트 페이지</h1>
      
      {todos && todos.length > 0 ? (
        <ul className="list-disc pl-5">
          {todos.map((todo: any) => (
            <li key={todo.id} className="mb-2">
              {JSON.stringify(todo)}
            </li>
          ))}
        </ul>
      ) : (
        <p>현재 데이터가 없거나 todos 테이블이 없습니다.</p>
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
  )
} 