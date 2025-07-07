"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Section, SectionHeader, SectionContent } from "@/components/landing/section";
import {
  Play,
  Code,
  Terminal,
  Monitor,
  Zap,
  Users,
  FileText,
  Folder,
  ChevronRight,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WebVMPreviewProps {
  className?: string;
}

export function WebVMPreview({ className }: WebVMPreviewProps) {
  const [activeDemo, setActiveDemo] = useState("editor");

  const demoTabs = [
    {
      id: "editor",
      label: "Code Editor",
      icon: <Code className="h-4 w-4" />,
      description: "VS Code-like editing experience"
    },
    {
      id: "terminal",
      label: "Terminal",
      icon: <Terminal className="h-4 w-4" />,
      description: "Full Linux terminal access"
    },
    {
      id: "collaboration",
      label: "Collaboration",
      icon: <Users className="h-4 w-4" />,
      description: "Real-time team coding"
    }
  ];

  return (
    <Section id="demo" className={cn("bg-gradient-to-b from-background to-muted/50", className)}>
      <SectionHeader
        title="See VibeKraft in Action"
        description="Experience the power of browser-based development with our interactive preview"
        badge="Live Demo"
        align="center"
      />
      
      <SectionContent>
        <div className="w-full space-y-8">
          {/* Demo Selector */}
          <div className="flex justify-center w-full">
            <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full max-w-md">
              <TabsList className="grid w-full grid-cols-3">
                {demoTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Demo Preview */}
          <Card className="overflow-hidden border-2 shadow-2xl">
            <CardHeader className="bg-muted/50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm font-medium">VibeKraft Workspace</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Live Preview
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="aspect-video bg-slate-950 text-green-400 font-mono text-sm relative overflow-hidden dark:bg-slate-900">
                {activeDemo === "editor" && <EditorPreview />}
                {activeDemo === "terminal" && <TerminalPreview />}
                {activeDemo === "collaboration" && <CollaborationPreview />}
                
                {/* Overlay for interaction */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Link href="/auth/register">
                    <Button size="lg" className="bg-white/90 text-black hover:bg-white">
                      <Play className="h-5 w-5 mr-2" />
                      Get Started Free
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Monitor className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">No Installation Required</h3>
                <p className="text-sm text-muted-foreground">
                  Start coding immediately without downloading or installing anything
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Zap className="h-12 w-12 mx-auto mb-4 text-chart-3" />
                <h3 className="font-semibold mb-2">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Powered by CheerpX WebVM for near-native performance
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 mx-auto mb-4 text-chart-2" />
                <h3 className="font-semibold mb-2">Team Ready</h3>
                <p className="text-sm text-muted-foreground">
                  Built-in collaboration tools for seamless teamwork
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Maximize2 className="h-5 w-5 mr-2" />
                Start Your Free Account
              </Button>
            </Link>
          </div>
        </div>
      </SectionContent>
    </Section>
  );
}

// Mock preview components
function EditorPreview() {
  return (
    <div className="h-full flex">
      {/* File Explorer */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 p-4">
        <div className="text-xs text-slate-400 mb-2">EXPLORER</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-300">
            <ChevronRight className="h-3 w-3" />
            <Folder className="h-3 w-3" />
            <span>my-project</span>
          </div>
          <div className="ml-5 space-y-1">
            <div className="flex items-center gap-2 text-blue-400">
              <FileText className="h-3 w-3" />
              <span>index.js</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <FileText className="h-3 w-3" />
              <span>package.json</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Editor */}
      <div className="flex-1 p-4">
        <div className="text-xs text-slate-400 mb-4">index.js</div>
        <div className="space-y-2 text-sm">
          <div><span className="text-purple-400">const</span> <span className="text-blue-400">express</span> = <span className="text-yellow-400">require</span>(<span className="text-green-400">'express'</span>);</div>
          <div><span className="text-purple-400">const</span> <span className="text-blue-400">app</span> = <span className="text-yellow-400">express</span>();</div>
          <div></div>
          <div><span className="text-blue-400">app</span>.<span className="text-yellow-400">get</span>(<span className="text-green-400">'/'</span>, (<span className="text-orange-400">req</span>, <span className="text-orange-400">res</span>) =&gt; {`{`}</div>
          <div className="ml-4"><span className="text-orange-400">res</span>.<span className="text-yellow-400">send</span>(<span className="text-green-400">'Hello VibeKraft!'</span>);</div>
          <div>{`}`});</div>
        </div>
      </div>
    </div>
  );
}

function TerminalPreview() {
  return (
    <div className="h-full p-4 space-y-2">
      <div className="text-green-400">user@vibekraft:~/my-project$ npm install express</div>
      <div className="text-slate-400">+ express@4.18.2</div>
      <div className="text-slate-400">added 57 packages in 2.1s</div>
      <div></div>
      <div className="text-green-400">user@vibekraft:~/my-project$ node index.js</div>
      <div className="text-slate-400">Server running on port 3000</div>
      <div></div>
      <div className="text-green-400">user@vibekraft:~/my-project$ <span className="animate-pulse">|</span></div>
    </div>
  );
}

function CollaborationPreview() {
  return (
    <div className="h-full flex">
      <div className="flex-1 p-4">
        <div className="text-xs text-slate-400 mb-4">Collaborative Session - 3 users online</div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-blue-400">Alice</span>
            <span className="text-slate-400">is editing line 15</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-400">Bob</span>
            <span className="text-slate-400">is in terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-purple-400">You</span>
            <span className="text-slate-400">are viewing</span>
          </div>
        </div>
        
        <div className="mt-8 space-y-2 text-sm">
          <div><span className="text-purple-400">function</span> <span className="text-blue-400">calculateTotal</span>() {`{`}</div>
          <div className="ml-4 bg-blue-500/20 border-l-2 border-blue-500 pl-2">
            <span className="text-slate-300">// Alice is typing...</span>
          </div>
          <div className="ml-4"><span className="text-purple-400">return</span> <span className="text-orange-400">items</span>.<span className="text-yellow-400">reduce</span>(...);</div>
          <div>{`}`}</div>
        </div>
      </div>
    </div>
  );
}
