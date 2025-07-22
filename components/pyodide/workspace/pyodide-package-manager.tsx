'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package,
  Search,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePyodide } from '../hooks/use-pyodide';
import { PackageInfo, InstallationProgress } from '../core/pyodide-packages';

interface PyodidePackageManagerProps {
  workspaceId: string;
  className?: string;
}

export function PyodidePackageManager({
  workspaceId,
  className
}: PyodidePackageManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [installationProgress, setInstallationProgress] = useState<Map<string, InstallationProgress>>(new Map());
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [packageToInstall, setPackageToInstall] = useState('');
  const [showRequirementsDialog, setShowRequirementsDialog] = useState(false);
  const [requirementsText, setRequirementsText] = useState('');

  const {
    isInitialized,
    installedPackages,
    installPackage,
    uninstallPackage,
    searchPackages,
    refreshPackages,
    packageManager
  } = usePyodide({ workspaceId });

  // Search for packages
  const handleSearch = async () => {
    if (!searchQuery.trim() || !packageManager) return;

    setIsSearching(true);
    try {
      const results = await searchPackages(searchQuery);
      setAvailablePackages(results);
    } catch (error) {
      console.error('Failed to search packages:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Install package with progress tracking
  const handleInstallPackage = async (packageName: string) => {
    if (!packageManager) return;

    const success = await installPackage(packageName, (progress) => {
      setInstallationProgress(prev => new Map(prev.set(packageName, progress)));
    });

    // Clear progress after completion
    setTimeout(() => {
      setInstallationProgress(prev => {
        const newMap = new Map(prev);
        newMap.delete(packageName);
        return newMap;
      });
    }, 2000);

    if (success) {
      await refreshPackages();
    }
  };

  // Uninstall package
  const handleUninstallPackage = async (packageName: string) => {
    if (!packageManager) return;

    const success = await uninstallPackage(packageName);
    if (success) {
      await refreshPackages();
    }
  };

  // Install from requirements.txt
  const handleInstallFromRequirements = async () => {
    if (!requirementsText.trim() || !packageManager) return;

    const lines = requirementsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    for (const line of lines) {
      const packageName = line.split('==')[0].split('>=')[0].split('<=')[0].trim();
      await handleInstallPackage(packageName);
    }

    setShowRequirementsDialog(false);
    setRequirementsText('');
  };

  // Export requirements
  const handleExportRequirements = async () => {
    if (!packageManager) return;

    const requirements = await packageManager.exportRequirements();
    const blob = new Blob([requirements], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'requirements.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get package status
  const getPackageStatus = (packageName: string) => {
    const progress = installationProgress.get(packageName);
    if (progress) {
      return progress;
    }
    return null;
  };

  // Check if package is installed
  const isPackageInstalled = (packageName: string) => {
    return installedPackages.some(pkg => pkg.name === packageName);
  };

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Package Manager
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshPackages}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            
            <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Plus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Install Package</DialogTitle>
                  <DialogDescription>
                    Enter the name of the Python package to install.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="package-name">Package Name</Label>
                  <Input
                    id="package-name"
                    value={packageToInstall}
                    onChange={(e) => setPackageToInstall(e.target.value)}
                    placeholder="numpy, pandas, matplotlib..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleInstallPackage(packageToInstall);
                        setShowInstallDialog(false);
                        setPackageToInstall('');
                      }
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowInstallDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      handleInstallPackage(packageToInstall);
                      setShowInstallDialog(false);
                      setPackageToInstall('');
                    }}
                    disabled={!packageToInstall.trim()}
                  >
                    Install
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showRequirementsDialog} onOpenChange={setShowRequirementsDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Upload className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Install from Requirements</DialogTitle>
                  <DialogDescription>
                    Paste your requirements.txt content to install multiple packages.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={requirementsText}
                    onChange={(e) => setRequirementsText(e.target.value)}
                    placeholder="numpy==1.21.0&#10;pandas>=1.3.0&#10;matplotlib"
                    rows={8}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowRequirementsDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleInstallFromRequirements}
                    disabled={!requirementsText.trim()}
                  >
                    Install All
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportRequirements}
              className="h-7 w-7 p-0"
            >
              <FileText className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        <Tabs defaultValue="installed" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-3">
            <TabsTrigger value="installed">Installed</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="installed" className="flex-1 overflow-auto p-3 space-y-2">
            {installedPackages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">No packages installed</div>
                <div className="text-xs mt-1">Install packages to get started</div>
              </div>
            ) : (
              installedPackages.map((pkg) => {
                const progress = getPackageStatus(pkg.name);
                return (
                  <div
                    key={pkg.name}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm">{pkg.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {pkg.version}
                        </Badge>
                      </div>
                      {pkg.description && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {pkg.description}
                        </div>
                      )}
                      {progress && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span>{progress.status}</span>
                            {progress.status === 'downloading' && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                          </div>
                          <Progress value={progress.progress} className="h-1 mt-1" />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUninstallPackage(pkg.name)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="search" className="flex-1 overflow-auto p-3">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Search packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  size="sm"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                {availablePackages.length === 0 && searchQuery && !isSearching && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No packages found</div>
                    <div className="text-xs mt-1">Try a different search term</div>
                  </div>
                )}

                {availablePackages.map((pkg) => {
                  const installed = isPackageInstalled(pkg.name);
                  const progress = getPackageStatus(pkg.name);
                  
                  return (
                    <div
                      key={pkg.name}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm">{pkg.name}</div>
                          <Badge variant="outline" className="text-xs">
                            {pkg.version}
                          </Badge>
                          {installed && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                        {pkg.description && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {pkg.description}
                          </div>
                        )}
                        {progress && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span>{progress.status}</span>
                              {progress.status === 'downloading' && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                            </div>
                            <Progress value={progress.progress} className="h-1 mt-1" />
                          </div>
                        )}
                      </div>
                      <Button
                        variant={installed ? "outline" : "default"}
                        size="sm"
                        onClick={() => installed ? handleUninstallPackage(pkg.name) : handleInstallPackage(pkg.name)}
                        disabled={!!progress}
                        className="h-7"
                      >
                        {installed ? (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3 mr-1" />
                            Install
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
