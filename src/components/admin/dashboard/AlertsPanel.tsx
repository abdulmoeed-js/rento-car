
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Bell, BellOff, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Alert = {
  id: string;
  type: 'booking_duplicate' | 'id_mismatch' | 'suspicious_activity';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  read: boolean;
};

export const AlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [alertsMuted, setAlertsMuted] = useState(false);

  // This is a mock function to demonstrate real-time alerts
  // In a real app, you'd use Supabase Realtime or webhooks
  const monitorSuspiciousActivity = () => {
    // For demo purposes, we'll generate a fake alert every minute
    const generateRandomAlert = () => {
      const alertTypes = ['booking_duplicate', 'id_mismatch', 'suspicious_activity'];
      const alertMessages = [
        'Multiple bookings from the same user in a short time frame',
        'User ID mismatch detected during verification',
        'Unusual booking pattern detected'
      ];
      const severities = ['low', 'medium', 'high'];
      
      const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)] as Alert['type'];
      const randomSeverity = severities[Math.floor(Math.random() * severities.length)] as Alert['severity'];
      const randomMessage = alertMessages[alertTypes.indexOf(randomType)];
      
      const newAlert: Alert = {
        id: `alert-${Date.now()}`,
        type: randomType,
        message: randomMessage,
        severity: randomSeverity,
        timestamp: new Date(),
        read: false
      };
      
      // Only add a new alert if not muted
      if (!alertsMuted && Math.random() < 0.3) { // 30% chance of an alert
        setAlerts(prev => [newAlert, ...prev]);
        
        if (!isOpen) {
          toast.warning("New security alert detected", {
            description: newAlert.message,
            action: {
              label: "View",
              onClick: () => setIsOpen(true)
            }
          });
        }
      }
    };
    
    // Check for suspicious activities every minute
    const intervalId = setInterval(generateRandomAlert, 60000);
    
    return () => clearInterval(intervalId);
  };

  useEffect(() => {
    const cleanup = monitorSuspiciousActivity();
    
    // Initialize with some sample alerts
    const initialAlerts: Alert[] = [
      {
        id: 'alert-1',
        type: 'booking_duplicate',
        message: 'User created 3 bookings in 5 minutes',
        severity: 'medium',
        timestamp: new Date(Date.now() - 25 * 60000),
        read: false
      },
      {
        id: 'alert-2',
        type: 'id_mismatch',
        message: 'KYC document doesn\'t match user details',
        severity: 'high',
        timestamp: new Date(Date.now() - 120 * 60000),
        read: true
      }
    ];
    
    setAlerts(initialAlerts);
    
    return cleanup;
  }, [alertsMuted]);

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const unreadCount = alerts.filter(alert => !alert.read).length;

  const toggleAlertsMuted = () => {
    setAlertsMuted(!alertsMuted);
    toast(alertsMuted ? "Alerts unmuted" : "Alerts muted");
  };

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            {alertsMuted ? <BellOff className="h-4 w-4 mr-1" /> : <Bell className="h-4 w-4 mr-1" />}
            <span>Alerts</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 md:w-96 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Security Alerts</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={toggleAlertsMuted}>
                {alertsMuted ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No alerts to display</p>
              </div>
            ) : (
              <div className="divide-y">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-3 ${alert.read ? 'bg-background' : 'bg-muted/20'}`}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                          alert.severity === 'high' ? 'text-red-500' :
                          alert.severity === 'medium' ? 'text-amber-500' :
                          'text-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">
                            {alert.type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground mb-1">
                            {alert.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissAlert(alert.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 border-t">
            <Button variant="outline" size="sm" className="w-full" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
