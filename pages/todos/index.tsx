import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Head from 'next/head';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Todo 타입 정의
type Todo = {
  id: number;
  task: string;
  is_complete: boolean;
  created_at: string;
};

export default function TodosPage({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 할 일 불러오기
  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setTodos(data || []);
    } catch (err) {
      console.error('할 일을 불러오는 중 오류 발생:', err);
      setError('할 일을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 할 일 추가
  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('todos')
        .insert([{ task: newTask, is_complete: false }])
        .select();
      
      if (error) throw error;
      
      setTodos([...(data || []), ...todos]);
      setNewTask('');
    } catch (err) {
      console.error('할 일을 추가하는 중 오류 발생:', err);
      setError('할 일을 추가할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 할 일 완료 상태 토글
  const toggleTodo = async (id: number) => {
    try {
      const todoToUpdate = todos.find(todo => todo.id === id);
      if (!todoToUpdate) return;
      
      const { error } = await supabase
        .from('todos')
        .update({ is_complete: !todoToUpdate.is_complete })
        .eq('id', id);
      
      if (error) throw error;
      
      setTodos(todos.map(todo => 
        todo.id === id 
          ? { ...todo, is_complete: !todo.is_complete } 
          : todo
      ));
    } catch (err) {
      console.error('할 일 상태를 변경하는 중 오류 발생:', err);
      setError('할 일 상태를 변경할 수 없습니다.');
    }
  };

  // 할 일 삭제
  const deleteTodo = async (id: number) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      console.error('할 일을 삭제하는 중 오류 발생:', err);
      setError('할 일을 삭제할 수 없습니다.');
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Head>
        <title>할 일 목록 - 공장 관리 시스템</title>
        <meta name="description" content="공장 관리 시스템의 할 일 목록 페이지입니다." />
      </Head>
      
      <h1 className="text-2xl font-bold mb-6">할 일 목록</h1>
      
      {/* 할 일 추가 폼 */}
      <form onSubmit={addTodo} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="새 할 일 입력..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !newTask.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            추가
          </button>
        </div>
      </form>
      
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* 로딩 인디케이터 */}
      {isLoading && (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* 할 일 목록 */}
      {todos.length === 0 ? (
        <p className="text-gray-500 text-center py-8">할 일이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li 
              key={todo.id} 
              className="flex items-center justify-between p-4 bg-white rounded-md shadow"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={todo.is_complete}
                  onChange={() => toggleTodo(todo.id)}
                  className="h-5 w-5 text-blue-500 rounded mr-3"
                />
                <span className={todo.is_complete ? 'line-through text-gray-500' : ''}>
                  {todo.task}
                </span>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-500 hover:text-red-700"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 서버 사이드에서 초기 데이터 가져오기
export async function getServerSideProps() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data, error } = await supabaseServer
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return {
      props: {
        initialTodos: data || [],
      },
    };
  } catch (error) {
    console.error('서버 사이드에서 할 일을 가져오는 중 오류 발생:', error);
    return {
      props: {
        initialTodos: [],
      },
    };
  }
} 