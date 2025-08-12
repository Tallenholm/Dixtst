import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  Bell, 
  BellRing, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  X,
  Settings,
  Lightbulb,
  Moon,
  Sun
} from "lucide-react";

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Circadian Schedule Active',
      message: 'Your lighting automatically adjusted to evening phase (warm 2700K)',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      isRead: false
    },
    {
      id: '2',
      type: 'info',
      title: 'Sleep Mode Recommended',
      message: 'Based on your schedule, consider activating sleep mode in 30 minutes',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      isRead: false
    },
    {
      id: '3',
      type: 'warning',
      title: 'Manual Override Active',
      message: 'Focus mode is overriding circadian schedule. Will resume at next phase.',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      isRead: true
    },
    {
      id: '4',
      type: 'success',
      title: 'Bridge Connection Restored',
      message: 'Successfully reconnected to Hue Bridge at 192.168.1.104',
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      isRead: true
    }
  ]);

  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400 border-green-400/30';
      case 'warning': return 'text-yellow-400 border-yellow-400/30';
      case 'error': return 'text-red-400 border-red-400/30';
      default: return 'text-blue-400 border-blue-400/30';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Add random notification every 2-5 minutes
      if (Math.random() > 0.7) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: 'info',
          title: 'Phase Transition',
          message: 'Circadian lighting smoothly transitioning to next phase',
          timestamp: new Date().toISOString(),
          isRead: false
        };
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
      }
    }, 120000); // Check every 2 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Floating Notification Bell */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="fixed top-4 left-4 z-50 p-2 rounded-full bg-black/60 backdrop-blur-sm border border-gray-700 hover:bg-gray-800/60"
          >
            <div className="relative">
              {unreadCount > 0 ? (
                <BellRing className="h-5 w-5 text-[--circadian-amber] animate-pulse" />
              ) : (
                <Bell className="h-5 w-5 text-gray-400" />
              )}
              {unreadCount > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white animate-bounce"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </div>
          </Button>
        </DialogTrigger>

        <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-[--circadian-amber] hover:text-[--circadian-amber]/80"
                >
                  Mark all read
                </Button>
              )}
            </div>

            <ScrollArea className="h-80">
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const IconComponent = getNotificationIcon(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={`
                          p-3 rounded-lg border transition-all duration-200 cursor-pointer
                          ${notification.isRead 
                            ? 'bg-gray-800/30 border-gray-700' 
                            : 'bg-gray-800/50 border-gray-600 hover:bg-gray-800/70'
                          }
                        `}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`mt-0.5 ${getNotificationColor(notification.type)}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium ${notification.isRead ? 'text-gray-300' : 'text-white'}`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center space-x-1">
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-[--circadian-amber] rounded-full animate-pulse"></div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                  className="h-6 w-6 p-0 text-gray-500 hover:text-gray-300"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <p className={`text-xs mt-1 ${notification.isRead ? 'text-gray-500' : 'text-gray-400'}`}>
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {new Date(notification.timestamp).toLocaleTimeString()}
                              </span>
                              
                              {notification.action && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    notification.action?.handler();
                                  }}
                                  className="text-[--circadian-amber] hover:text-[--circadian-amber]/80 text-xs h-6"
                                >
                                  {notification.action.label}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}