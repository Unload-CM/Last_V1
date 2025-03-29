import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Paperclip, X, Image, FileText, Film, XCircle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useTranslation from "@/utils/i18n";
import { 
  updateTextWithTranslation,
  detectLanguage,
  translateText,
  formatWithTranslation,
  removeExistingTranslation
} from '@/utils/translation';
import { useMediaQuery } from 'react-responsive';

interface Author {
  id: number;
  koreanName: string;
  thaiName?: string;
  nickname?: string;
  email: string;
  department: {
    id: number;
    name: string;
    label: string;
    thaiLabel?: string;
  };
}

interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
  attachments: Attachment[];
}

interface IssueCommentsProps {
  issueId: number;
}

export default function IssueComments({ issueId }: IssueCommentsProps) {
  const { t, language } = useTranslation();
  const { data: session } = useSession();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{url: string, fileName: string, fileType: string} | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/issues/${issueId}/comments?lang=${language}`);
      if (!response.ok) {
        throw new Error(t('issues.commentLoadError'));
      }
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("댓글 로딩 중 오류 발생:", error);
      toast.error(t('issues.commentLoadError'));
    }
  };

  // 사용자 정보 가져오기
  const fetchUserInfo = async () => {
    if (session?.user?.email) {
      try {
        const response = await fetch(`/api/employees/me`);
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin || false);
        }
      } catch (error) {
        console.error("사용자 정보 로딩 중 오류 발생:", error);
      }
    }
  };

  useEffect(() => {
    fetchComments();
    fetchUserInfo();
  }, [issueId, session]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCommentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target;
    const newValue = e.target.value;
    const selectionStart = input.selectionStart || 0;
    const selectionEnd = input.selectionEnd || 0;
    const previousValue = input.value;

    // 선택된 텍스트가 있거나 백스페이스/삭제 키를 사용한 경우
    if (selectionStart !== selectionEnd || previousValue.length !== newValue.length) {
      try {
        // 기존 번역 제거
        const cleanPrevValue = removeExistingTranslation(previousValue);
        const cleanNewValue = removeExistingTranslation(newValue);
        
        // 원본 텍스트의 선택된 부분만 업데이트
        const updatedText = 
          cleanPrevValue.substring(0, selectionStart) +
          cleanNewValue.substring(selectionStart, selectionEnd) +
          cleanPrevValue.substring(selectionEnd);

        // 번역 수행
        const sourceLang = detectLanguage(updatedText);
        const translatedText = await translateText(updatedText, sourceLang);
        const formattedText = formatWithTranslation(updatedText, translatedText);
        
        setNewComment(formattedText);
      } catch (error) {
        console.error('Comment update error:', error);
        setNewComment(newValue);
      }
    } else {
      // 일반 타이핑의 경우 번역 없이 바로 업데이트
      setNewComment(newValue);
    }
  };

  const handleCommentBlur = async (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.trim()) {
      try {
        // 기존 번역 제거 후 새로운 번역 생성
        const cleanValue = removeExistingTranslation(value);
        const sourceLang = detectLanguage(cleanValue);
        const translatedText = await translateText(cleanValue, sourceLang);
        const formattedText = formatWithTranslation(cleanValue, translatedText);
        setNewComment(formattedText);
      } catch (error) {
        console.error('Translation error:', error);
      }
    }
  };

  const resetCommentForm = () => {
    setNewComment("");
    setAttachments([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error(t('issues.pleaseEnterComment'));
      return;
    }

    try {
      setIsLoading(true);

      // 원본 텍스트에서 번역 부분 제거
      const originalText = removeExistingTranslation(newComment);
      
      // 번역 수행
      const sourceLang = detectLanguage(originalText);
      const translatedText = await translateText(originalText, sourceLang);
      
      // 원본과 번역을 포맷팅
      const formattedComment = formatWithTranslation(originalText, translatedText);

      // FormData 객체 생성
      const formData = new FormData();
      formData.append('content', formattedComment);
      formData.append('issueId', issueId.toString());
      
      // 첨부 파일 추가
      attachments.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(t('issues.commentCreateError'));
      }

      // 댓글 목록 새로고침
      await fetchComments();
      
      // 입력 폼 초기화
      resetCommentForm();
      
      toast.success(t('issues.commentCreateSuccess'));
    } catch (error) {
      console.error('댓글 저장 중 오류:', error);
      toast.error(t('issues.commentCreateError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 포커스 관련 함수들 추가
  const handleCommentFocus = () => {
    // 포커스 시 기존 번역이 있다면 원본 텍스트만 표시
    if (newComment.includes('[[')) {
      const originalText = removeExistingTranslation(newComment);
      setNewComment(originalText);
    }
  };

  const openDeleteDialog = (commentId: number) => {
    setCommentToDelete(commentId);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!commentToDelete) return;

    try {
      const response = await fetch(
        `/api/issues/${issueId}/comments?commentId=${commentToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(t('issues.commentDeleteError'));
      }

      setComments((prev) => prev.filter((comment) => comment.id !== commentToDelete));
      toast.success(t('issues.commentDeleteSuccess'));
    } catch (error) {
      console.error("댓글 삭제 중 오류 발생:", error);
      toast.error(t('issues.commentDeleteError'));
    } finally {
      setIsDeleteDialogOpen(false);
      setCommentToDelete(null);
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="w-4 h-4" />;
    
    if (fileType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    } else if (fileType.startsWith('video/')) {
      return <Film className="w-4 h-4" />;
    }
    
    return <FileText className="w-4 h-4" />;
  };
  
  const formatFileSize = (bytes: number | null) => {
    if (bytes === null) return '';
    
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  };
  
  const isImage = (fileType: string | null): boolean => {
    return !!fileType && fileType.startsWith('image/');
  };
  
  const isVideo = (fileType: string | null): boolean => {
    return !!fileType && fileType.startsWith('video/');
  };
  
  const closePreview = () => {
    setPreviewFile(null);
    setPreviewAttachment(null);
  };
  
  const openAttachmentPreview = (file: File) => {
    setPreviewAttachment({
      url: URL.createObjectURL(file),
      fileName: file.name,
      fileType: file.type
    });
  };

  const canDeleteComment = (comment: Comment): boolean => {
    // 세션 정보가 없는 경우
    if (!session?.user) {
      console.log('댓글 삭제 권한 없음: 세션 정보 없음');
      return false;
    }
    
    // 디버깅용 로그 추가
    console.log('댓글 삭제 권한 확인:', {
      sessionUserId: session.user.id,
      sessionUserEmail: session.user.email, // 이것은 사용자의 employeeId로 저장됨
      commentAuthorId: comment.author.id,
      commentAuthorEmail: comment.author.email,
      isMatch: session.user.id === String(comment.author.id) || session.user.email === comment.author.email,
    });
    
    // 방법 1: ID 비교 (우선)
    // next-auth의 session.user.id는 문자열, comment.author.id는 숫자
    if (session.user.id && comment.author.id) {
      if (session.user.id === String(comment.author.id)) {
        return true;
      }
    }
    
    // 방법 2: 이메일 비교 (session.user.email은 employeeId로 저장됨)
    if (session.user.email && comment.author.email) {
      if (session.user.email === comment.author.email) {
        return true;
      }
    }
    
    // 세션 ID가 있고 API에서 반환된 comment.author 정보가 불완전한 경우
    // 세션 정보를 신뢰하여 삭제 버튼을 표시 (세션은 서버에서 생성되므로 신뢰할 수 있음)
    if (session.user.id && !comment.author.id && !comment.author.email) {
      console.log('댓글 삭제 권한 부여: 댓글 작성자 정보 불완전하지만 세션 정보 존재');
      return true;
    }
    
    console.log('댓글 삭제 권한 없음: 작성자가 아님');
    return false;
  };

  const getDepartmentDisplayName = (dept: any) => {
    if (!dept) return '-';
    
    console.log('댓글 부서 표시 함수 호출됨:', {
      language,
      dept,
      name: dept.name,
      label: dept.label,
      thaiLabel: dept.thaiLabel
    });
    
    if (language === 'en') return dept.name;
    if (language === 'th') {
      if (dept.thaiLabel) {
        console.log(`부서 ${dept.name}의 thaiLabel 사용:`, dept.thaiLabel);
        return dept.thaiLabel;
      }
      
      try {
        const { departmentTranslationsThai } = require('@/lib/i18n/translations');
        if (departmentTranslationsThai[dept.name]) {
          console.log(`부서 ${dept.name}의 번역 찾음:`, departmentTranslationsThai[dept.name]);
          return departmentTranslationsThai[dept.name];
        }
      } catch (e) {
        console.error('번역 데이터 가져오기 오류:', e);
      }
      
      console.log(`부서 ${dept.name}의 한글 라벨로 폴백:`, dept.label);
      return dept.label;
    }
    return dept.label;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">{t('issues.comments')}</h3>
      
      {session && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder={t('issues.commentPlaceholder')}
            value={newComment}
            onChange={handleCommentChange}
            onBlur={handleCommentBlur}
            onFocus={handleCommentFocus}
            className="min-h-[100px] border border-gray-300 focus:border-primary p-4"
          />
          
          {attachments.length > 0 && (
            <div className="border border-gray-200 rounded-md p-2 bg-gray-50">
              <h3 className="text-sm font-medium mb-2">{t('issues.attachFiles')}</h3>
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between px-3 py-2 bg-white rounded border">
                    <div className="flex items-center">
                      {file.type.startsWith('image/') ? (
                        <Image className="w-4 h-4 mr-2" />
                      ) : file.type.startsWith('video/') ? (
                        <Film className="w-4 h-4 mr-2" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2" />
                      )}
                      <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4 mr-2" />
              {t('issues.attachFiles')}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                onChange={handleFileChange} 
              />
            </Button>
            
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? t('common.saving') : t('issues.addComment')}
            </Button>
          </div>
        </form>
      )}
      
      {comments.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          {t('issues.noComments')}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="bg-white">
              <CardContent className="p-3">
                {isMobile ? (
                  // 모바일 레이아웃
                  <>
                    <div className="mb-1">
                      <div className="whitespace-pre-line">{comment.content}</div>
                    </div>
                    
                    {comment.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="text-sm font-medium mb-2">{t('issues.attachFiles')}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {comment.attachments.map((attachment) => (
                            <div key={attachment.id} className="border rounded overflow-hidden">
                              {isImage(attachment.fileType) ? (
                                <div className="relative">
                                  <div 
                                    className="w-full h-16 bg-gray-100 cursor-pointer"
                                    onClick={() => setPreviewFile(attachment)}
                                  >
                                    <img 
                                      src={attachment.fileUrl} 
                                      alt={attachment.fileName}
                                      className="w-full h-full object-contain" 
                                    />
                                  </div>
                                  <div className="p-2 text-xs">
                                    <div className="truncate font-medium">{attachment.fileName}</div>
                                    <div className="text-gray-500">{formatFileSize(attachment.fileSize)}</div>
                                  </div>
                                </div>
                              ) : isVideo(attachment.fileType) ? (
                                <div className="relative">
                                  <div 
                                    className="w-full h-16 bg-gray-100 cursor-pointer flex items-center justify-center"
                                    onClick={() => setPreviewFile(attachment)}
                                  >
                                    <video 
                                      src={attachment.fileUrl}
                                      className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                                      <Film className="w-8 h-8 text-white" />
                                    </div>
                                  </div>
                                  <div className="p-2 text-xs">
                                    <div className="truncate font-medium">{attachment.fileName}</div>
                                    <div className="text-gray-500">{formatFileSize(attachment.fileSize)}</div>
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={attachment.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 p-2 text-sm hover:bg-gray-50"
                                >
                                  {getFileIcon(attachment.fileType)}
                                  <div className="truncate flex-1">
                                    <div className="truncate">{attachment.fileName}</div>
                                    <div className="text-xs text-gray-500">
                                      {formatFileSize(attachment.fileSize)}
                                    </div>
                                  </div>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 pt-2 border-t border-gray-100 flex flex-col gap-1">
                      <div className="text-xs text-muted-foreground">
                        {comment.author.koreanName}
                        {comment.author.thaiName && ` (${comment.author.thaiName})`}
                        {comment.author.nickname && ` - ${comment.author.nickname}`} | {getDepartmentDisplayName(comment.author.department)}
                      </div>
                      <div className="flex justify-end items-center text-xs text-muted-foreground">
                        <div>
                          {format(new Date(comment.createdAt), 'yyyy-MM-dd HH:mm')}
                        </div>
                        {canDeleteComment(comment) && (
                          <Button
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 text-red-500 hover:text-red-700 hover:bg-red-100 ml-1"
                            onClick={() => openDeleteDialog(comment.id)}
                            title={t('issues.deleteComment')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  // PC 레이아웃 (기존 코드 유지)
                  <>
                    <div className="flex justify-between items-center mb-1">
                      <div className="whitespace-pre-line">{comment.content}</div>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'yyyy-MM-dd HH:mm')}
                        </div>
                        {canDeleteComment(comment) && (
                          <Button
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 text-red-500 hover:text-red-700 hover:bg-red-100"
                            onClick={() => openDeleteDialog(comment.id)}
                            title={t('issues.deleteComment')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {comment.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="text-sm font-medium mb-2">{t('issues.attachFiles')}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {comment.attachments.map((attachment) => (
                            <div key={attachment.id} className="border rounded overflow-hidden">
                              {isImage(attachment.fileType) ? (
                                <div className="relative">
                                  <div 
                                    className="w-full h-16 bg-gray-100 cursor-pointer"
                                    onClick={() => setPreviewFile(attachment)}
                                  >
                                    <img 
                                      src={attachment.fileUrl} 
                                      alt={attachment.fileName}
                                      className="w-full h-full object-contain" 
                                    />
                                  </div>
                                  <div className="p-2 text-xs">
                                    <div className="truncate font-medium">{attachment.fileName}</div>
                                    <div className="text-gray-500">{formatFileSize(attachment.fileSize)}</div>
                                  </div>
                                </div>
                              ) : isVideo(attachment.fileType) ? (
                                <div className="relative">
                                  <div 
                                    className="w-full h-16 bg-gray-100 cursor-pointer flex items-center justify-center"
                                    onClick={() => setPreviewFile(attachment)}
                                  >
                                    <video 
                                      src={attachment.fileUrl}
                                      className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                                      <Film className="w-8 h-8 text-white" />
                                    </div>
                                  </div>
                                  <div className="p-2 text-xs">
                                    <div className="truncate font-medium">{attachment.fileName}</div>
                                    <div className="text-gray-500">{formatFileSize(attachment.fileSize)}</div>
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={attachment.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 p-2 text-sm hover:bg-gray-50"
                                >
                                  {getFileIcon(attachment.fileType)}
                                  <div className="truncate flex-1">
                                    <div className="truncate">{attachment.fileName}</div>
                                    <div className="text-xs text-gray-500">
                                      {formatFileSize(attachment.fileSize)}
                                    </div>
                                  </div>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-muted-foreground">
                      {comment.author.koreanName}
                      {comment.author.thaiName && ` (${comment.author.thaiName})`}
                      {comment.author.nickname && ` - ${comment.author.nickname}`} | {getDepartmentDisplayName(comment.author.department)}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('issues.confirmDeleteComment')}</DialogTitle>
            <DialogDescription>
              {t('issues.confirmDeleteCommentDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {(previewFile || previewAttachment) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4" onClick={closePreview}>
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <Button
              className="absolute top-2 right-2 z-10 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                closePreview();
              }}
            >
              <XCircle className="h-6 w-6" />
            </Button>
            
            {previewFile && isImage(previewFile.fileType) && (
              <img
                src={previewFile.fileUrl}
                alt={previewFile.fileName}
                className="w-full h-auto max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            {previewFile && isVideo(previewFile.fileType) && (
              <video
                src={previewFile.fileUrl}
                controls
                autoPlay
                className="w-full h-auto max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            {previewAttachment && previewAttachment.fileType.startsWith('image/') && (
              <img
                src={previewAttachment.url}
                alt={previewAttachment.fileName}
                className="w-full h-auto max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            {previewAttachment && previewAttachment.fileType.startsWith('video/') && (
              <video
                src={previewAttachment.url}
                controls
                autoPlay
                className="w-full h-auto max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            <div className="mt-2 text-center text-white text-sm">
              {previewFile ? previewFile.fileName : previewAttachment?.fileName}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 