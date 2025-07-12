"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface DashboardFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  activeTab: string;
}

export interface FilterState {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  projectId?: string;
  workspaceId?: string;
}

const statusOptions = {
  projects: [],
  workspaces: [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "ARCHIVED", label: "Archived" },
    { value: "ERROR", label: "Error" },
  ],
  instances: [
    { value: "RUNNING", label: "Running" },
    { value: "STOPPED", label: "Stopped" },
    { value: "STARTING", label: "Starting" },
    { value: "STOPPING", label: "Stopping" },
    { value: "ERROR", label: "Error" },
    { value: "SUSPENDED", label: "Suspended" },
  ],
};

const sortOptions = {
  projects: [
    { value: "name", label: "Name" },
    { value: "createdAt", label: "Created Date" },
    { value: "updatedAt", label: "Updated Date" },
  ],
  workspaces: [
    { value: "name", label: "Name" },
    { value: "status", label: "Status" },
    { value: "createdAt", label: "Created Date" },
    { value: "updatedAt", label: "Updated Date" },
  ],
  instances: [
    { value: "name", label: "Name" },
    { value: "status", label: "Status" },
    { value: "createdAt", label: "Created Date" },
    { value: "updatedAt", label: "Updated Date" },
  ],
};

export function DashboardFilters({ onFiltersChange, activeTab }: DashboardFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "",
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const clearFilters = () => {
    const cleared: FilterState = {
      search: "",
      status: "",
      sortBy: "updatedAt",
      sortOrder: "desc",
    };
    setFilters(cleared);
    onFiltersChange(cleared);
  };

  const hasActiveFilters = filters.search || filters.status;
  const currentStatusOptions = statusOptions[activeTab as keyof typeof statusOptions] || [];
  const currentSortOptions = sortOptions[activeTab as keyof typeof sortOptions] || [];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-1 gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {[filters.search, filters.status].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              {currentStatusOptions.length > 0 && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => updateFilters({ status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      {currentStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Sort by</Label>
                <div className="flex gap-2">
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => updateFilters({ sortBy: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentSortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value: "asc" | "desc") => updateFilters({ sortOrder: value })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Desc</SelectItem>
                      <SelectItem value="asc">Asc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {hasActiveFilters && (
        <div className="flex gap-2 flex-wrap">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => updateFilters({ search: "" })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {currentStatusOptions.find(opt => opt.value === filters.status)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => updateFilters({ status: "" })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
