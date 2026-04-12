"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  ShieldCheck,
  Menu,
  LayoutDashboard,
  Users,
  HeartPulse,
  Droplet,
  Building2,
  History,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/donors", label: "Donors", icon: Users },
  { href: "/admin/requests", label: "Blood Requests", icon: HeartPulse },
  { href: "/admin/blood-stock", label: "Blood Stock", icon: Droplet },
  { href: "/admin/hospitals", label: "Hospitals", icon: Building2 },
  { href: "/admin/history", label: "Donation History", icon: History },
]

export function AdminMobileHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const currentPage = sidebarLinks.find(
    (l) =>
      pathname === l.href || (l.href !== "/admin" && pathname.startsWith(l.href))
  )

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open admin menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="flex items-center gap-2 border-b border-border px-4 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ShieldCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold font-mono">LifeFlow</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Admin Panel
              </span>
            </div>
          </SheetTitle>
          <nav className="flex flex-col gap-1 p-3">
            {sidebarLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/admin" && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto border-t border-border p-3">
            <Separator className="mb-3" />
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" asChild>
              <Link href="/" onClick={() => setOpen(false)}>
                <LogOut className="h-4 w-4" />
                Exit Admin
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          {currentPage?.label ?? "Admin"}
        </span>
      </div>
    </header>
  )
}
