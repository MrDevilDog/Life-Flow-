"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  Droplet,
  Building2,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const sidebarLinks = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/donors",
    label: "Donors",
    icon: Users,
  },
  {
    href: "/admin/requests",
    label: "Blood Requests",
    icon: HeartPulse,
  },
  {
    href: "/admin/blood-stock",
    label: "Blood Stock",
    icon: Droplet,
  },
  {
    href: "/admin/hospitals",
    label: "Hospitals",
    icon: Building2,
  },
  {
    href: "/admin/history",
    label: "Donation History",
    icon: History,
  },
]

interface AdminSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground font-mono">
                LifeFlow
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Admin Panel
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {!collapsed && (
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Management
            </p>
          )}
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/admin" && pathname.startsWith(link.href))
            const linkContent = (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <link.icon className={cn("h-4.5 w-4.5 shrink-0", collapsed && "h-5 w-5")} />
                {!collapsed && link.label}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {link.label}
                  </TooltipContent>
                </Tooltip>
              )
            }
            return <div key={link.href}>{linkContent}</div>
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-sidebar-border p-3">
          {!collapsed && (
            <>
              <div className="mb-3 flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  A
                </div>
                <div className="flex-1 truncate">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">Admin User</p>
                  <p className="truncate text-xs text-muted-foreground">admin@lifeflow.org</p>
                </div>
              </div>
              <Separator className="mb-3" />
            </>
          )}
          <div className="flex items-center justify-between gap-2">
            {!collapsed && (
              <Button variant="ghost" size="sm" className="flex-1 justify-start gap-2 text-muted-foreground hover:text-foreground" asChild>
                <Link href="/">
                  <LogOut className="h-4 w-4" />
                  Exit Admin
                </Link>
              </Button>
            )}
            {collapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="mx-auto text-muted-foreground hover:text-foreground" asChild>
                    <Link href="/">
                      <LogOut className="h-4 w-4" />
                      <span className="sr-only">Exit Admin</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Exit Admin
                </TooltipContent>
              </Tooltip>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              <span className="sr-only">
                {collapsed ? "Expand sidebar" : "Collapse sidebar"}
              </span>
            </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
