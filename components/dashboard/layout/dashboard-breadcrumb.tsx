"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BreadcrumbSegment {
  title: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface DashboardBreadcrumbProps {
  customSegments?: BreadcrumbSegment[];
  showHome?: boolean;
}

const pathTitleMap: Record<string, string> = {
  dashboard: "Dashboard",
  management: "Management",
  projects: "Projects",
  workspaces: "Workspaces",
  instances: "Instances",
  webvm: "WebVM",
  settings: "Settings",
  team: "Team",
  analytics: "Analytics",
  security: "Security",
  help: "Help & Support",
  new: "New",
  edit: "Edit",
  metrics: "Metrics",
};

export function DashboardBreadcrumb({ 
  customSegments, 
  showHome = true 
}: DashboardBreadcrumbProps) {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbSegment[] => {
    if (customSegments) {
      return customSegments;
    }

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbSegment[] = [];

    if (showHome) {
      breadcrumbs.push({
        title: "Home",
        href: "/dashboard",
      });
    }

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip the first 'dashboard' segment if showHome is true
      if (showHome && segment === 'dashboard' && index === 0) {
        return;
      }

      const isLast = index === segments.length - 1;
      const title = pathTitleMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      breadcrumbs.push({
        title,
        href: isLast ? undefined : currentPath,
        isCurrentPage: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // If there are too many breadcrumbs, show ellipsis
  const shouldShowEllipsis = breadcrumbs.length > 4;
  const visibleBreadcrumbs = shouldShowEllipsis 
    ? [
        breadcrumbs[0], // First item (Home)
        ...breadcrumbs.slice(-2) // Last 2 items
      ]
    : breadcrumbs;

  const hiddenBreadcrumbs = shouldShowEllipsis 
    ? breadcrumbs.slice(1, -2) 
    : [];

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {shouldShowEllipsis ? (
          <>
            {/* First breadcrumb (Home) */}
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={visibleBreadcrumbs[0].href || "#"} className="flex items-center">
                  <Home className="h-4 w-4" />
                  <span className="sr-only">{visibleBreadcrumbs[0].title}</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>

            {/* Ellipsis with dropdown */}
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {hiddenBreadcrumbs.map((breadcrumb, index) => (
                    <DropdownMenuItem key={index} asChild>
                      <Link href={breadcrumb.href || "#"}>
                        {breadcrumb.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>

            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>

            {/* Last 2 breadcrumbs */}
            {visibleBreadcrumbs.slice(1).map((breadcrumb, index) => (
              <div key={index} className="flex items-center">
                <BreadcrumbItem>
                  {breadcrumb.isCurrentPage ? (
                    <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={breadcrumb.href || "#"}>
                        {breadcrumb.title}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < visibleBreadcrumbs.slice(1).length - 1 && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                )}
              </div>
            ))}
          </>
        ) : (
          // Normal breadcrumbs without ellipsis
          breadcrumbs.map((breadcrumb, index) => (
            <div key={index} className="flex items-center">
              <BreadcrumbItem>
                {breadcrumb.isCurrentPage ? (
                  <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={breadcrumb.href || "#"} className="flex items-center">
                      {index === 0 && showHome && (
                        <>
                          <Home className="h-4 w-4 mr-1" />
                        </>
                      )}
                      {breadcrumb.title}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </div>
          ))
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
