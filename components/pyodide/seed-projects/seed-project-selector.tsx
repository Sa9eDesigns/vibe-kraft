'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  Clock, 
  Target, 
  Package, 
  BookOpen,
  Code,
  Database,
  Globe,
  Gamepad2,
  GraduationCap,
  Brain,
  Star,
  Download,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  SEED_PROJECTS, 
  SeedProject, 
  getSeedProjectsByCategory, 
  getSeedProjectsByDifficulty,
  searchSeedProjects 
} from './seed-project-templates';

interface SeedProjectSelectorProps {
  onProjectSelect: (project: SeedProject) => void;
  className?: string;
}

const categoryIcons = {
  'data-science': <Database className="h-5 w-5" />,
  'web-dev': <Globe className="h-5 w-5" />,
  'automation': <Code className="h-5 w-5" />,
  'games': <Gamepad2 className="h-5 w-5" />,
  'education': <GraduationCap className="h-5 w-5" />,
  'ai-ml': <Brain className="h-5 w-5" />
};

const difficultyColors = {
  'beginner': 'bg-green-500',
  'intermediate': 'bg-yellow-500',
  'advanced': 'bg-red-500'
};

export function SeedProjectSelector({ onProjectSelect, className }: SeedProjectSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<SeedProject | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);

  // Filter projects based on search and filters
  const filteredProjects = React.useMemo(() => {
    let projects = SEED_PROJECTS;

    // Apply search filter
    if (searchQuery.trim()) {
      projects = searchSeedProjects(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      projects = projects.filter(p => p.category === selectedCategory);
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      projects = projects.filter(p => p.difficulty === selectedDifficulty);
    }

    return projects;
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  // Get project counts by category
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    SEED_PROJECTS.forEach(project => {
      counts[project.category] = (counts[project.category] || 0) + 1;
    });
    return counts;
  }, []);

  const handleProjectClick = useCallback((project: SeedProject) => {
    setSelectedProject(project);
    setShowProjectDialog(true);
  }, []);

  const handleProjectSelect = useCallback(() => {
    if (selectedProject) {
      onProjectSelect(selectedProject);
      setShowProjectDialog(false);
    }
  }, [selectedProject, onProjectSelect]);

  const ProjectCard = ({ project }: { project: SeedProject }) => (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
      onClick={() => handleProjectClick(project)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {categoryIcons[project.category]}
            <CardTitle className="text-lg">{project.name}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <div className={cn(
              'w-2 h-2 rounded-full',
              difficultyColors[project.difficulty]
            )} />
            <span className="text-xs text-muted-foreground capitalize">
              {project.difficulty}
            </span>
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {project.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{project.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {project.estimatedTime}
            </div>
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {project.packages.length} packages
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose a Seed Project</h2>
        <p className="text-muted-foreground">
          Start with a pre-built Python project to learn and experiment
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all" className="text-xs">
              All ({SEED_PROJECTS.length})
            </TabsTrigger>
            <TabsTrigger value="education" className="text-xs">
              Education ({categoryCounts.education || 0})
            </TabsTrigger>
            <TabsTrigger value="data-science" className="text-xs">
              Data ({categoryCounts['data-science'] || 0})
            </TabsTrigger>
            <TabsTrigger value="web-dev" className="text-xs">
              Web ({categoryCounts['web-dev'] || 0})
            </TabsTrigger>
            <TabsTrigger value="games" className="text-xs">
              Games ({categoryCounts.games || 0})
            </TabsTrigger>
            <TabsTrigger value="automation" className="text-xs">
              Auto ({categoryCounts.automation || 0})
            </TabsTrigger>
            <TabsTrigger value="ai-ml" className="text-xs">
              AI/ML ({categoryCounts['ai-ml'] || 0})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button
            variant={selectedDifficulty === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDifficulty('all')}
          >
            All Levels
          </Button>
          <Button
            variant={selectedDifficulty === 'beginner' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDifficulty('beginner')}
            className="text-green-600"
          >
            Beginner
          </Button>
          <Button
            variant={selectedDifficulty === 'intermediate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDifficulty('intermediate')}
            className="text-yellow-600"
          >
            Intermediate
          </Button>
          <Button
            variant={selectedDifficulty === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDifficulty('advanced')}
            className="text-red-600"
          >
            Advanced
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* No Results */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mt-4">No projects found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Project Details Dialog */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {categoryIcons[selectedProject.category]}
                  <DialogTitle>{selectedProject.name}</DialogTitle>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-xs',
                      selectedProject.difficulty === 'beginner' && 'text-green-600',
                      selectedProject.difficulty === 'intermediate' && 'text-yellow-600',
                      selectedProject.difficulty === 'advanced' && 'text-red-600'
                    )}
                  >
                    {selectedProject.difficulty}
                  </Badge>
                </div>
                <DialogDescription className="text-base">
                  {selectedProject.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Estimated time: {selectedProject.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedProject.packages.length} packages required</span>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedProject.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Learning Objectives */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Learning Objectives
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {selectedProject.learningObjectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>

                {/* Required Packages */}
                {selectedProject.packages.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Required Packages</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedProject.packages.map(pkg => (
                        <Badge key={pkg} variant="outline" className="text-xs font-mono">
                          {pkg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files */}
                <div>
                  <h4 className="font-medium mb-2">Project Files</h4>
                  <div className="space-y-2">
                    {selectedProject.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Code className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{file.path}</span>
                        {file.description && (
                          <span className="text-muted-foreground">- {file.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowProjectDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleProjectSelect}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Project
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
