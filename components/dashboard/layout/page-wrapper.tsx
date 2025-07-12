"use client";

import { ReactNode } from "react";
import { DashboardBreadcrumb } from "./dashboard-breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface BreadcrumbSegment {
  title: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbSegment[];
  showBreadcrumbs?: boolean;
  actions?: ReactNode;
  className?: string;
}

export function PageWrapper({
  children,
  title,
  description,
  breadcrumbs,
  showBreadcrumbs = true,
  actions,
  className = "",
}: PageWrapperProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <DashboardBreadcrumb customSegments={breadcrumbs} />
      )}

      {/* Page Header */}
      {(title || description || actions) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && (
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              )}
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
          <Separator />
        </div>
      )}

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}
