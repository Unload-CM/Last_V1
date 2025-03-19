import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Paperclip, X, FileText, Image, File } from "lucide-react";

interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
}

interface IssueAttachmentsProps {
  issueId: number;
}

export default function IssueAttachments({ issueId }: IssueAttachmentsProps) {
  const { data: session } = useSession();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/issues/${issueId}/attachments`);
      if (!response.ok) {
        throw new Error("첨부 파일을 불러오는데 실패했습니다.");
      }
      const data = await response.json();
      setAttachments(data);
    } catch (error) {
      console.error("첨부 파일 로딩 중 오류 발생:", error);
      toast.error("첨부 파일을 불러오는데 실패했습니다.");
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [issueId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`/api/issues/${issueId}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("파일 업로드에 실패했습니다.");
      }

      const data = await response.json();
      setAttachments((prev) => [data, ...prev]);
      setSelectedFile(null);
      // 파일 입력 필드 초기화
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      toast.success("파일이 업로드되었습니다.");
    } catch (error) {
      console.error("파일 업로드 중 오류 발생:", error);
      toast.error("파일 업로드에 실패했습니다.");
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
    } catch (error) {
      console.error("파일 삭제 중 오류 발생:", error);
      toast.error("파일 삭제에 실패했습니다.");
    }
  };

  // 파일 유형에 따른 아이콘 반환
  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="w-4 h-4" />;
    if (fileType.startsWith("image/")) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "크기 알 수 없음";
    const units = ["바이트", "KB", "MB", "GB", "TB", "PB"];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="space-y-4">
      {session && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-primary file:text-primary-foreground
              hover:file:bg-primary/90"
            />
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || !selectedFile}
              size="sm"
            >
              {isUploading ? "업로드 중..." : "업로드"}
            </Button>
          </div>
          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              선택된 파일: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {attachments.length > 0 ? (
          attachments.map((attachment) => (
            <Card key={attachment.id}>
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(attachment.fileType)}
                    <a 
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {attachment.fileName}
                    </a>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(attachment.fileSize)})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(attachment.createdAt), "yyyy-MM-dd", {
                        locale: ko,
                      })}
                    </span>
                    {session && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(attachment.id)}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            첨부 파일이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
} 