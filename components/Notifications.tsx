import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import { Bell, Check, Trash2, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  issue: {
    id: number;
    title: string;
    department: {
      id: number;
      name: string;
      label: string;
    };
  };
}

export default function Notifications() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!session) return;

    try {
      const response = await fetch("/api/notifications?limit=20");
      if (!response.ok) {
        throw new Error("알림을 불러오는데 실패했습니다.");
      }
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("알림 로딩 중 오류 발생:", error);
      toast.error("알림을 불러오는데 실패했습니다.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, session]);

  // 알림 자동 새로고침 (1분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      if (session) fetchNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, [session]);

  // 알림 읽음 처리
  const markAsRead = async (id: number) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("알림 읽음 처리에 실패했습니다.");
      }

      // 알림 상태 업데이트
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
    } catch (error) {
      console.error("알림 읽음 처리 중 오류 발생:", error);
      toast.error("알림 읽음 처리에 실패했습니다.");
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ readAll: true }),
      });

      if (!response.ok) {
        throw new Error("모든 알림 읽음 처리에 실패했습니다.");
      }

      // 알림 상태 업데이트
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
      toast.success("모든 알림을 읽음 처리했습니다.");
    } catch (error) {
      console.error("알림 읽음 처리 중 오류 발생:", error);
      toast.error("모든 알림 읽음 처리에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 알림 삭제
  const deleteNotification = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("알림 삭제에 실패했습니다.");
      }

      // 알림 상태 업데이트
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
      
      // 읽지 않은 알림이었다면 카운트 감소
      const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
      if (wasUnread) {
        setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
      }
    } catch (error) {
      console.error("알림 삭제 중 오류 발생:", error);
      toast.error("알림 삭제에 실패했습니다.");
    }
  };

  // 모든 알림 삭제
  const deleteAllNotifications = async () => {
    if (notifications.length === 0) return;
    
    if (!window.confirm("모든 알림을 삭제하시겠습니까?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications?deleteAll=true", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("모든 알림 삭제에 실패했습니다.");
      }

      // 알림 상태 업데이트
      setNotifications([]);
      setUnreadCount(0);
      toast.success("모든 알림이 삭제되었습니다.");
    } catch (error) {
      console.error("알림 삭제 중 오류 발생:", error);
      toast.error("모든 알림 삭제에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 알림 클릭시 해당 이슈로 이동
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    router.push(`/issues/${notification.issue.id}`);
  };

  // 알림 타입에 따른 아이콘
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ASSIGNED":
        return <div className="w-2 h-2 rounded-full bg-blue-500" />;
      case "TRANSFERRED":
        return <div className="w-2 h-2 rounded-full bg-yellow-500" />;
      case "COMPLETED":
        return <div className="w-2 h-2 rounded-full bg-green-500" />;
      case "COMMENT":
        return <div className="w-2 h-2 rounded-full bg-purple-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {/* 알람 아이콘 버튼 - 나중에 구현 예정 */}
      {/* <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-1 py-0.5 min-w-[18px] h-[18px] text-xs"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger> */}
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">알림</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={markAllAsRead}
              disabled={unreadCount === 0 || isLoading}
              title="모두 읽음 처리"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={deleteAllNotifications}
              disabled={notifications.length === 0 || isLoading}
              title="모두 삭제"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="max-h-[300px]">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start p-3 gap-2 hover:bg-muted cursor-pointer ${
                  !notification.isRead ? "bg-muted/40" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {notification.issue.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(notification.createdAt), "PPP p", {
                      locale: ko,
                    })}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      title="읽음 처리"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    title="삭제"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              알림이 없습니다.
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
} 