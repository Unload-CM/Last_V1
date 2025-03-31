import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoginForm from '@/components/LoginForm';
import Head from 'next/head';

export default function LoginPage() {
  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>로그인 - 공장 관리 시스템</title>
        <meta name="description" content="로그인 페이지" />
      </Head>
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">로그인</CardTitle>
            <p className="text-sm text-muted-foreground">계정 정보로 로그인하세요</p>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 