import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Author {
  id: number;
  name: string;
  email: string;
  department: {
    id: number;
    name: string;
  };
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
}

interface IssueCommentsProps {
  issueId: number;
}

export default function IssueComments({ issueId }: IssueCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`);
      if (!response.ok) {
        throw new Error("댓글을 불러오는데 실패했습니다.");
      }
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("댓글 로딩 중 오류 발생:", error);
      toast.error("댓글을 불러오는데 실패했습니다.");
    }
  };

  useEffect(() => {
    fetchComments();
  }, [issueId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) {
        throw new Error("댓글 작성에 실패했습니다.");
      }

      const data = await response.json();
      setComments((prev) => [data, ...prev]);
      setNewComment("");
      toast.success("댓글이 작성되었습니다.");
    } catch (error) {
      console.error("댓글 작성 중 오류 발생:", error);
      toast.error("댓글 작성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(
        `/api/issues/${issueId}/comments?commentId=${commentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("댓글 삭제에 실패했습니다.");
      }

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      toast.success("댓글이 삭제되었습니다.");
    } catch (error) {
      console.error("댓글 삭제 중 오류 발생:", error);
      toast.error("댓글 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-4">
      {session && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="댓글을 입력하세요..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <Button type="submit" disabled={isLoading || !newComment.trim()}>
            {isLoading ? "작성 중..." : "댓글 작성"}
          </Button>
        </form>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold">
                    {comment.author.name} ({comment.author.department.name})
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(comment.createdAt), "PPP p", {
                      locale: ko,
                    })}
                  </div>
                </div>
                {session?.user?.email === comment.author.email && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(comment.id)}
                  >
                    삭제
                  </Button>
                )}
              </div>
              <div className="whitespace-pre-wrap">{comment.content}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 