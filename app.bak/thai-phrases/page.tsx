'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ThaiTextEditor } from '@/components/ui/thai-text-editor';
import { ThaiPhraseLibrary } from '@/components/ui/thai-phrase-library';
import { Button } from '@/components/ui/button';
import { Plus, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ThaiPhrase {
  id: number;
  text: string;
  tags: { id: number; name: string }[];
}

export default function ThaiPhrasesPage() {
  const [currentText, setCurrentText] = useState('');
  const [phrases, setPhrases] = useState<ThaiPhrase[]>([]);
  const { toast } = useToast();

  // 문구 목록 불러오기
  const fetchPhrases = async () => {
    try {
      const response = await fetch('/api/thai-phrases');
      const data = await response.json();
      if (response.ok) {
        setPhrases(data);
      } else {
        toast({
          title: 'ข้อผิดพลาด',
          description: data.error || 'ไม่สามารถโหลดข้อความได้',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
        variant: 'destructive',
      });
    }
  };

  // 새로운 문구 저장
  const handleSave = async () => {
    if (!currentText.trim()) {
      toast({
        title: 'แจ้งเตือน',
        description: 'กรุณาใส่ข้อความ',
        variant: 'default',
      });
      return;
    }

    try {
      const response = await fetch('/api/thai-phrases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: currentText,
          tags: [],
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'สำเร็จ',
          description: 'บันทึกข้อความเรียบร้อยแล้ว',
          variant: 'default',
        });
        setCurrentText('');
        fetchPhrases();
      } else {
        toast({
          title: 'ข้อผิดพลาด',
          description: data.error || 'ไม่สามารถบันทึกข้อความได้',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchPhrases();
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <CardTitle className="text-2xl font-bold text-gray-900">
            ระบบจัดการข้อความภาษาไทย
          </CardTitle>
          <Button 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-5 w-5 mr-2" />
            บันทึก
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-white rounded-lg border p-4">
            <ThaiTextEditor
              value={currentText}
              onChange={setCurrentText}
              placeholder="พิมพ์ข้อความของคุณที่นี่..."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-semibold text-gray-900">
            ข้อความที่บันทึกไว้
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ThaiPhraseLibrary
            onSelect={(text) => setCurrentText(text)}
          />
        </CardContent>
      </Card>
    </div>
  );
} 