"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Check,
  ChevronsUpDown,
  Building,
  Users,
  Crown,
  Shield,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommandPalette } from "./command-palette";
import { QuickActions } from "./quick-actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
}

// Mock organizations - in real app, this would come from props or API
const organizations: Organization[] = [
  { id: "1", name: "Acme Corp", slug: "acme", role: "OWNER" },
  { id: "2", name: "TechStart Inc", slug: "techstart", role: "ADMIN" },
  { id: "3", name: "DevTeam", slug: "devteam", role: "MEMBER" },
];



export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization>(organizations[0]);

  const handleSignOut = () => {
    signOut({
      redirectTo: "/",
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case "ADMIN":
        return <Shield className="h-3 w-3 text-blue-500" />;
      default:
        return <Users className="h-3 w-3 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Badge variant="default" className="text-xs">Owner</Badge>;
      case "ADMIN":
        return <Badge variant="secondary" className="text-xs">Admin</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Member</Badge>;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 gap-4">
          {/* Sidebar Toggle */}
          <SidebarTrigger className="-ml-1" />

          {/* Organization Selector */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[200px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span className="truncate">{selectedOrg.name}</span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search organizations..." />
                <CommandEmpty>No organization found.</CommandEmpty>
                <CommandGroup>
                  {organizations.map((org) => (
                    <CommandItem
                      key={org.id}
                      value={org.id}
                      onSelect={() => {
                        setSelectedOrg(org);
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Building className="h-4 w-4" />
                        <span>{org.name}</span>
                        {getRoleIcon(org.role)}
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedOrg.id === org.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search projects, workspaces, instances..."
                className="pl-10 pr-4"
                onClick={() => setCommandOpen(true)}
                readOnly
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback>
                    {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(selectedOrg.role)}
                    <span className="text-xs text-muted-foreground">in {selectedOrg.name}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <a href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                    <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
