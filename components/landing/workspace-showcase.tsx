"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, SectionContent } from "@/components/landing/section";
import {
  Split,
  Terminal,
  FileText,
  Settings,
  Users,
  GitBranch,
  Play,
  Maximize2,
  Minimize2,
  X,
  Plus,
  Folder,
  Search,
  Code
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceShowcaseProps {
  className?: string;
}

export function WorkspaceShowcase({ className }: WorkspaceShowcaseProps) {
  return (
    <Section className={cn("bg-gradient-to-b from-muted/50 to-background", className)}>
      <SectionHeader
        title="Professional Development Environment"
        description="Experience a fully-featured IDE with resizable panels, tabbed interface, and all the tools you need for modern development"
        badge="Workspace Interface"
        align="center"
      />
      
      <SectionContent>
        <div className="w-full">
          {/* Main Workspace Preview */}
          <Card className="overflow-hidden border-2 shadow-2xl mb-8">
            <div className="bg-slate-900 text-white">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm font-medium ml-2">VibeKraft Workspace</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    3 collaborators
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <GitBranch className="h-3 w-3 mr-1" />
                    main
                  </Badge>
                </div>
              </div>

              {/* Workspace Layout */}
              <div className="flex h-96">
                {/* Left Sidebar */}
                <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
                  {/* Activity Bar */}
                  <div className="flex border-b border-slate-700">
                    <div className="w-12 bg-slate-950 dark:bg-slate-900 flex flex-col items-center py-2 space-y-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <Search className="h-5 w-5 text-muted-foreground" />
                      <GitBranch className="h-5 w-5 text-muted-foreground" />
                      <Settings className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 p-3">
                      <div className="text-xs text-slate-400 mb-2">EXPLORER</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1 text-foreground">
                          <Folder className="h-3 w-3" />
                          <span>my-react-app</span>
                        </div>
                        <div className="ml-4 space-y-1">
                          <div className="text-muted-foreground">src/</div>
                          <div className="ml-2 space-y-1">
                            <div className="text-primary">App.js</div>
                            <div className="text-muted-foreground">index.js</div>
                            <div className="text-muted-foreground">styles.css</div>
                          </div>
                          <div className="text-muted-foreground">package.json</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col">
                  {/* Tab Bar */}
                  <div className="flex items-center bg-slate-800 border-b border-slate-700">
                    <div className="flex">
                      <div className="flex items-center gap-2 px-3 py-2 bg-accent border-r border-border">
                        <Code className="h-3 w-3 text-primary" />
                        <span className="text-sm text-accent-foreground">App.js</span>
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 border-r border-border">
                        <FileText className="h-3 w-3 text-chart-2" />
                        <span className="text-sm text-muted-foreground">package.json</span>
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" />
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="px-2">
                      <Plus className="h-4 w-4 text-slate-400 hover:text-white cursor-pointer" />
                    </div>
                  </div>

                  {/* Split Panels */}
                  <div className="flex-1 flex">
                    {/* Editor Panel */}
                    <div className="flex-1 p-4 bg-slate-900">
                      <div className="space-y-2 text-sm font-mono">
                        <div><span className="text-purple-400">import</span> <span className="text-blue-400">React</span> <span className="text-purple-400">from</span> <span className="text-green-400">'react'</span>;</div>
                        <div><span className="text-purple-400">import</span> <span className="text-green-400">'./App.css'</span>;</div>
                        <div></div>
                        <div><span className="text-purple-400">function</span> <span className="text-yellow-400">App</span>() {`{`}</div>
                        <div className="ml-4"><span className="text-purple-400">return</span> (</div>
                        <div className="ml-8">&lt;<span className="text-red-400">div</span> <span className="text-blue-400">className</span>=<span className="text-green-400">"App"</span>&gt;</div>
                        <div className="ml-12">&lt;<span className="text-red-400">h1</span>&gt;Welcome to VibeKraft&lt;/<span className="text-red-400">h1</span>&gt;</div>
                        <div className="ml-12">&lt;<span className="text-red-400">p</span>&gt;Browser-based development&lt;/<span className="text-red-400">p</span>&gt;</div>
                        <div className="ml-8">&lt;/<span className="text-red-400">div</span>&gt;</div>
                        <div className="ml-4">);</div>
                        <div>{`}`}</div>
                      </div>
                    </div>

                    {/* Right Panel - Terminal */}
                    <div className="w-80 bg-slate-900 border-l border-slate-700 flex flex-col">
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4" />
                          <span className="text-sm">Terminal</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Minimize2 className="h-3 w-3 text-slate-400 hover:text-white cursor-pointer" />
                          <Maximize2 className="h-3 w-3 text-slate-400 hover:text-white cursor-pointer" />
                          <X className="h-3 w-3 text-slate-400 hover:text-white cursor-pointer" />
                        </div>
                      </div>
                      <div className="flex-1 p-3 font-mono text-sm space-y-1">
                        <div className="text-green-400">$ npm start</div>
                        <div className="text-slate-400">Starting development server...</div>
                        <div className="text-slate-400">Compiled successfully!</div>
                        <div className="text-slate-400">Local: http://localhost:3000</div>
                        <div className="text-green-400">$ <span className="animate-pulse">|</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Split className="h-10 w-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Resizable Panels</h3>
                <p className="text-sm text-muted-foreground">
                  Customize your workspace layout with flexible, resizable panels
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <FileText className="h-10 w-10 mx-auto mb-3 text-chart-2" />
                <h3 className="font-semibold mb-2">Tabbed Interface</h3>
                <p className="text-sm text-muted-foreground">
                  Work with multiple files using familiar VS Code-like tabs
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Terminal className="h-10 w-10 mx-auto mb-3 text-chart-4" />
                <h3 className="font-semibold mb-2">Integrated Terminal</h3>
                <p className="text-sm text-muted-foreground">
                  Full Linux terminal with package managers and build tools
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="h-10 w-10 mx-auto mb-3 text-chart-5" />
                <h3 className="font-semibold mb-2">Live Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  See team members' cursors and edits in real-time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Play className="h-5 w-5 mr-2" />
                Create Your Account
              </Button>
            </Link>
          </div>
        </div>
      </SectionContent>
    </Section>
  );
}
