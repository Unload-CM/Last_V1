import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Paperclip, X, FileText, Image as ImageIcon, File, Video } from "lucide-react";
import useTranslation from "@/utils/i18n";

interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt?: string;
  uploaderId?: number | null;
  uploader?: {
    id: number;
    koreanName: string;
    thaiName?: string;
    nickname?: string;
    department?: {
      id: number;
      name: string;
      label: string;
    };
  } | null;
}

interface IssueAttachmentsProps {
  issueId: number;
  initialAttachments?: Attachment[];
}

export default function IssueAttachments({ issueId, initialAttachments = [] }: IssueAttachmentsProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [compressImage, setCompressImage] = useState(true);
  const [compressSize, setCompressSize] = useState(800); // 기본 800px
  const [fileUrls, setFileUrls] = useState<{[key: string]: string}>({});

  // URL 객체 관리를 위한 useEffect 추가
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 생성한 URL 객체들 정리
      Object.values(fileUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [fileUrls]);

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/issues/${issueId}/attachments`);
      if (!response.ok) {
        throw new Error(t('issues.attachmentLoadError'));
      }
      const data = await response.json();
      setAttachments(data);
    } catch (error) {
      console.error("첨부 파일 로딩 중 오류 발생:", error);
      toast.error(t('issues.attachmentLoadError'));
    }
  };

  useEffect(() => {
    // initialAttachments가 제공되었고 비어있지 않으면 API 호출 건너뜀
    if (initialAttachments && initialAttachments.length > 0) {
      console.log('초기 첨부 파일 데이터 사용:', initialAttachments.length);
      setAttachments(initialAttachments);
    } else {
      console.log('API에서 첨부 파일 로드');
      fetchAttachments();
    }
  }, [issueId, initialAttachments]);

  // 파일 첨부 처리 함수
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // 새 파일에 대한 URL 생성
      const newUrls: {[key: string]: string} = {};
      newFiles.forEach(file => {
        newUrls[file.name + file.size] = URL.createObjectURL(file);
      });
      
      setFileUrls(prev => ({...prev, ...newUrls}));
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };
  
  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 파일 제거 함수
  const removeFile = (index: number) => {
    const fileToRemove = selectedFiles[index];
    if (fileToRemove) {
      const key = fileToRemove.name + fileToRemove.size;
      if (fileUrls[key]) {
        URL.revokeObjectURL(fileUrls[key]);
        setFileUrls(prev => {
          const updated = {...prev};
          delete updated[key];
          return updated;
        });
      }
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 이미지 압축 함수
  const compressImageFile = async (file: File, maxWidth: number): Promise<Blob> => {
    return new Promise<Blob>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        // @ts-ignore - Image 생성자 오류 무시
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // 비율 계산
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          // 압축된 이미지 반환
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('이미지 압축 실패'));
              }
            },
            file.type,
            0.85 // 품질 (0-1)
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    toast.info(`총 ${selectedFiles.length}개 파일 업로드를 시작합니다.`);
    
    let successCount = 0;
    let failCount = 0;
    
    try {
      // 세션 확인
      if (!session?.user) {
        toast.error('파일 업로드를 위해 로그인이 필요합니다.');
        setIsUploading(false);
        return;
      }
      
      console.log(`[IssueAttachments] 총 ${selectedFiles.length}개 파일 업로드 시작 - 이슈 ID: ${issueId}, 유저 ID: ${session.user.id}`);
      
      // 모든 파일 하나씩 업로드
      for (let i = 0; i < selectedFiles.length; i++) {
        const selectedFile = selectedFiles[i];
        let fileToUpload = selectedFile;
        
        // 이미지이고 압축 옵션이 켜져있으면 압축
        if (compressImage && selectedFile.type.startsWith('image/')) {
          try {
            const compressedBlob = await compressImageFile(selectedFile, compressSize);
            // @ts-ignore - File 생성자 오류 무시
            const newFile = new File([compressedBlob], selectedFile.name, { type: selectedFile.type });
            fileToUpload = newFile;
            console.log(`[IssueAttachments] 이미지가 압축되었습니다. (${formatFileSize(selectedFile.size)} → ${formatFileSize(fileToUpload.size)})`);
          } catch (error) {
            console.error('[IssueAttachments] 이미지 압축 중 오류:', error);
            toast.error('이미지 압축 실패. 원본 이미지를 업로드합니다.');
          }
        }
        
        console.log(`[IssueAttachments] [${i+1}/${selectedFiles.length}] 파일 업로드 시작: ${fileToUpload.name} (${formatFileSize(fileToUpload.size)}), 타입: ${fileToUpload.type}`);
        toast.info(`파일 업로드 중... (${i+1}/${selectedFiles.length}): ${fileToUpload.name}`);
        
        // FormData 객체 생성 및 파일 추가
        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("fileName", fileToUpload.name); // 명시적으로 파일명도 추가
        console.log('[IssueAttachments] FormData 객체 생성 완료, 파일 추가됨:', fileToUpload.name);
        
        // 최대 3번 재시도 로직
        let response: Response | null = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            console.log(`[IssueAttachments] 파일 업로드 요청 시작 (시도 ${retryCount + 1}/${maxRetries})`);
            console.log(`[IssueAttachments] 요청 URL: /api/issues/${issueId}/attachments`);
            
            // API 요청 - multipart/form-data 형식으로 전송 (Content-Type 헤더 제거)
            response = await fetch(`/api/issues/${issueId}/attachments`, {
              method: "POST",
              body: formData,
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              },
              credentials: 'include'  // 세션 쿠키 포함
            });
            
            console.log(`[IssueAttachments] 응답 상태 코드: ${response.status}`);
            break; // 성공하면 루프 종료
          } catch (error) {
            retryCount++;
            console.error(`[IssueAttachments] 업로드 시도 ${retryCount}/${maxRetries} 실패:`, error);
            
            if (retryCount >= maxRetries) {
              throw error; // 최대 재시도 횟수 초과
            }
            
            // 잠시 대기 후 재시도
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (!response) {
          console.error(`[IssueAttachments] 파일 '${fileToUpload.name}' 업로드 실패: 서버에 연결할 수 없습니다.`);
          failCount++;
          continue;
        }

        if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `텍스트 추출 실패: ${e}`;
          }
          
          console.error(`[IssueAttachments] 파일 '${fileToUpload.name}' 업로드 실패 (HTTP ${response.status}):`, errorText);
          toast.error(`파일 '${fileToUpload.name}' 업로드 실패: ${response.status}`);
          failCount++;
          continue;
        }

        let responseText = '';
        try {
          responseText = await response.text();
          console.log(`[IssueAttachments] 파일 '${fileToUpload.name}' 업로드 응답 (${response.status}):`, responseText);
          const data = JSON.parse(responseText);
          // 성공적으로 업로드된 파일을 첨부 파일 목록에 추가
          console.log(`[IssueAttachments] 파일 '${fileToUpload.name}' 업로드 성공! 응답 데이터:`, data);
          setAttachments((prev) => [data, ...prev]);
          toast.success(`파일 '${fileToUpload.name}' 업로드 성공!`);
          successCount++;
        } catch (parseError) {
          console.error('[IssueAttachments] 응답 파싱 오류:', parseError, '원본 응답:', responseText);
          failCount++;
        }
      }
      
      // 결과 요약 및 상태 업데이트
      console.log(`[IssueAttachments] 파일 업로드 완료. 결과: 성공 ${successCount}개, 실패 ${failCount}개`);
      
      if (successCount === selectedFiles.length) {
        toast.success(`모든 파일(${successCount}개)이 성공적으로 업로드되었습니다.`);
      } else if (successCount > 0) {
        toast.warning(`일부 파일만 업로드되었습니다. (성공: ${successCount}개, 실패: ${failCount}개)`);
      } else {
        toast.error(`모든 파일(${selectedFiles.length}개) 업로드에 실패했습니다.`);
      }
      
      // 파일 URL 정리
      Object.values(fileUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
      setFileUrls({});
      
      // 모든 파일 업로드 후 초기화
      setSelectedFiles([]);
      
      // 파일 입력 필드 초기화
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      // 첨부 파일 목록 새로고침
      fetchAttachments();
    } catch (error) {
      console.error("[IssueAttachments] 파일 업로드 중 오류 발생:", error);
      toast.error(`파일 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!confirm("이 파일을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(
        `/api/issues/${issueId}/attachments?attachmentId=${attachmentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("파일 삭제에 실패했습니다.");
      }

      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast.success("파일이 삭제되었습니다.");
      
      // 첨부 파일 목록 새로고침
      fetchAttachments();
    } catch (error) {
      console.error("파일 삭제 중 오류 발생:", error);
      toast.error("파일 삭제에 실패했습니다.");
    }
  };

  // 파일 유형에 따른 아이콘 반환
  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="w-4 h-4" />;
    if (fileType.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    if (fileType.startsWith("video/")) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  // 파일 타입에 따라 미리보기 렌더링
  const renderPreview = (attachment: Attachment) => {
    if (!attachment.fileUrl) return null;

    if (attachment.fileType && attachment.fileType.startsWith('image/')) {
      return (
        <div className="group relative">
          <img 
            src={attachment.fileUrl} 
            alt={attachment.fileName} 
            className="rounded-md max-h-40 object-contain cursor-pointer" 
            onClick={() => window.open(attachment.fileUrl, '_blank')}
          />
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(attachment.id);
            }}
            title={t('issues.deleteAttachment')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    } else if (attachment.fileType && attachment.fileType.startsWith('video/')) {
      return (
        <div className="relative group">
          <video 
            src={attachment.fileUrl} 
            controls 
            className="rounded-md max-h-40 max-w-full"
          />
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleDelete(attachment.id)}
            title={t('issues.deleteAttachment')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-between p-3 bg-muted rounded-md">
        <div className="flex items-center space-x-2">
          {getFileIcon(attachment.fileType || "")}
          <div>
            <div className="font-medium">{attachment.fileName}</div>
            <div className="text-xs text-muted-foreground">
              {formatFileSize(attachment.fileSize || 0)}
            </div>
          </div>
        </div>
        <Button 
          variant="destructive" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => handleDelete(attachment.id)}
          title={t('issues.deleteAttachment')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4 pt-6">
      {session && (
        <div className="space-y-2">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="mr-2"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  {t('fileUpload.selectFile')}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                />
                {selectedFiles.length === 0 && (
                  <span className="text-sm text-gray-500 ml-2">{t('fileUpload.noFileSelected')}</span>
                )}
              </div>
              
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || selectedFiles.length === 0}
                size="sm"
                id="upload-button"
                className="bg-blue-500 hover:bg-blue-600 text-white ml-2 shrink-0"
              >
                {isUploading ? t('issues.uploading') : t('issues.upload')}
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={compressImage}
                  onChange={(e) => setCompressImage(e.target.checked)}
                  className="rounded"
                />
                {t('issues.autoCompressImage')}
              </label>
              
              <select 
                value={compressSize} 
                onChange={(e) => setCompressSize(parseInt(e.target.value))}
                className="text-sm rounded border p-1"
                disabled={!compressImage}
              >
                <option value="400">{t('issues.maxWidth400')}</option>
                <option value="800">{t('issues.maxWidth800')}</option>
                <option value="1200">{t('issues.maxWidth1200')}</option>
                <option value="1600">{t('issues.maxWidth1600')}</option>
              </select>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-sm font-medium">{t('issues.selectedFiles')}:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="border rounded-md overflow-hidden">
                      {file.type.startsWith('image/') ? (
                        <div className="relative group">
                          <div className="w-full h-40 bg-gray-100">
                            <img 
                              src={fileUrls[file.name + file.size] || ''} 
                              alt={file.name}
                              className="w-full h-full object-contain" 
                            />
                          </div>
                          <div className="p-2 text-sm">
                            <div className="truncate font-medium">{file.name}</div>
                            <div className="text-gray-500">{formatFileSize(file.size)}</div>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : file.type.startsWith('video/') ? (
                        <div className="relative group">
                          <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                            <video 
                              src={fileUrls[file.name + file.size] || ''}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="p-2 text-sm">
                            <div className="truncate font-medium">{file.name}</div>
                            <div className="text-gray-500">{formatFileSize(file.size)}</div>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-sm bg-muted p-3 rounded">
                          <div className="truncate">
                            {file.name} ({formatFileSize(file.size)})
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {attachments.length > 0 ? (
          attachments.map((attachment) => (
            <Card key={attachment.id}>
              <CardContent className="p-3">
                {renderPreview(attachment)}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            {t('issues.noAttachments')}
          </div>
        )}
      </div>
    </div>
  );
} 