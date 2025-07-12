"use client";

import { useState, useEffect } from "react";
import {
  Cloud,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Server,
  Monitor,
  Bot,
  Container,
  HardDrive,
  Activity,
  Zap,
  Shield,
  Database
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusIndicatorProps {
  className?: string;
}

interface SystemStatus {
  online: boolean;
  cloudConnected: boolean;
  lastSync: Date | null;

  // WebVM Status
  instancesRunning: number;
  instancesTotal: number;
  workspacesActive: number;
  workspacesTotal: number;

  // Infrastructure Status
  containersRunning: number;
  containersTotal: number;
  cpuUsage: number;
  memoryUsage: number;

  // Storage Status
  storageUsed: number;
  storageTotal: number;
  storageHealth: 'healthy' | 'warning' | 'critical';

  // AI Services Status
  aiServicesOnline: boolean;
  aiRequestsPerMinute: number;
  aiResponseTime: number;

  // System Health
  systemHealth: number;
  activeAlerts: number;
  uptime: number;
}

export function StatusIndicator({ className }: StatusIndicatorProps) {
  const [status, setStatus] = useState<SystemStatus>({
    online: true,
    cloudConnected: true,
    lastSync: new Date(),

    // WebVM Status
    instancesRunning: 6,
    instancesTotal: 10,
    workspacesActive: 4,
    workspacesTotal: 8,

    // Infrastructure Status
    containersRunning: 8,
    containersTotal: 10,
    cpuUsage: 45,
    memoryUsage: 68,

    // Storage Status
    storageUsed: 6.2,
    storageTotal: 10,
    storageHealth: 'healthy',

    // AI Services Status
    aiServicesOnline: true,
    aiRequestsPerMinute: 25,
    aiResponseTime: 0.8,

    // System Health
    systemHealth: 98,
    activeAlerts: 1,
    uptime: 99.9,
  });

  useEffect(() => {
    // Fetch real-time status updates
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/dashboard/status');
        if (response.ok) {
          const data = await response.json();
          setStatus(prev => ({
            ...prev,
            ...data,
            lastSync: new Date(),
          }));
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
        setStatus(prev => ({
          ...prev,
          online: false,
          lastSync: new Date(),
        }));
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up interval for real-time updates
    const interval = setInterval(fetchStatus, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const getOverallStatus = () => {
    if (!status.online) return { color: "bg-red-500", text: "System Offline", icon: WifiOff };
    if (!status.cloudConnected) return { color: "bg-red-500", text: "Cloud Disconnected", icon: AlertCircle };
    if (!status.aiServicesOnline) return { color: "bg-yellow-500", text: "AI Services Down", icon: AlertCircle };
    if (status.activeAlerts > 2) return { color: "bg-yellow-500", text: "Multiple Alerts", icon: AlertCircle };
    if (status.systemHealth < 90) return { color: "bg-yellow-500", text: "System Degraded", icon: AlertCircle };
    if (status.storageHealth === 'critical') return { color: "bg-red-500", text: "Storage Critical", icon: AlertCircle };
    if (status.storageHealth === 'warning') return { color: "bg-yellow-500", text: "Storage Warning", icon: AlertCircle };
    return { color: "bg-green-500", text: "All Systems Operational", icon: CheckCircle };
  };

  const getStorageColor = () => {
    const usage = (status.storageUsed / status.storageTotal) * 100;
    if (usage > 90) return "text-red-500";
    if (usage > 75) return "text-yellow-500";
    return "text-green-500";
  };

  const getCpuColor = () => {
    if (status.cpuUsage > 80) return "text-red-500";
    if (status.cpuUsage > 60) return "text-yellow-500";
    return "text-green-500";
  };

  const getMemoryColor = () => {
    if (status.memoryUsage > 85) return "text-red-500";
    if (status.memoryUsage > 70) return "text-yellow-500";
    return "text-green-500";
  };

  const overallStatus = getOverallStatus();
  const StatusIcon = overallStatus.icon;

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer">
              <Shield className="h-3 w-3" />
              <span className="hidden sm:inline">System Status</span>
              <div className={`h-2 w-2 rounded-full ${overallStatus.color} animate-pulse`} />
            </div>
          </TooltipTrigger>
          <TooltipContent className="w-80">
            <div className="space-y-3">
              {/* Overall Status */}
              <div className="flex items-center gap-2 font-medium">
                <StatusIcon className="h-4 w-4" />
                <span>{overallStatus.text}</span>
              </div>

              {status.lastSync && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {status.lastSync.toLocaleTimeString()}
                </div>
              )}

              {/* WebVM Status */}
              <div className="space-y-2">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Monitor className="h-3 w-3" />
                  WebVM Services
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Instances:</span>
                    <span>{status.instancesRunning}/{status.instancesTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Workspaces:</span>
                    <span>{status.workspacesActive}/{status.workspacesTotal}</span>
                  </div>
                </div>
              </div>

              {/* Infrastructure Status */}
              <div className="space-y-2">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Server className="h-3 w-3" />
                  Infrastructure
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Containers:</span>
                    <span>{status.containersRunning}/{status.containersTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CPU Usage:</span>
                    <span className={getCpuColor()}>{status.cpuUsage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory:</span>
                    <span className={getMemoryColor()}>{status.memoryUsage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span>{status.uptime}%</span>
                  </div>
                </div>
              </div>

              {/* Storage Status */}
              <div className="space-y-2">
                <div className="font-medium text-sm flex items-center gap-2">
                  <HardDrive className="h-3 w-3" />
                  Storage
                </div>
                <div className="text-xs">
                  <div className="flex justify-between">
                    <span>Used:</span>
                    <span className={getStorageColor()}>
                      {status.storageUsed}GB / {status.storageTotal}GB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health:</span>
                    <Badge
                      variant={status.storageHealth === 'healthy' ? 'default' :
                              status.storageHealth === 'warning' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {status.storageHealth}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* AI Services Status */}
              <div className="space-y-2">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Bot className="h-3 w-3" />
                  AI Services
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={status.aiServicesOnline ? 'default' : 'destructive'} className="text-xs">
                      {status.aiServicesOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Requests/min:</span>
                    <span>{status.aiRequestsPerMinute}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <span>{status.aiResponseTime}s</span>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {status.activeAlerts > 0 && (
                <div className="space-y-2">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                    Active Alerts
                  </div>
                  <div className="text-xs">
                    <Badge variant="destructive" className="text-xs">
                      {status.activeAlerts} alert{status.activeAlerts > 1 ? 's' : ''} require attention
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
