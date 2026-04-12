"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  Droplet,
  Menu,
  Home,
  UserPlus,
  Search,
  LayoutDashboard,
  History,
  LogIn,
  AlertTriangle,
  Radar,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-context"

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/emergency", label: "Emergency", icon: AlertTriangle },
  { href: "/nearby", label: "Nearby", icon: Radar },
  { href: "/hospitals", label: "Hospitals", icon: Building2 },
  { href: "/search", label: "Find Donors", icon: Search },
  { href: "/history", label: "History", icon: History },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, loading } = useAuth()
  const [open, setOpen] = useState(false)

  const dashboardHref = user?.role === "hospital" ? "/hospital/dashboard" : "/dashboard"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Droplet className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground font-mono">
            LifeFlow
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!loading && user ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={dashboardHref}>
                  <LayoutDashboard className="mr-1.5 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await logout()
                  router.push("/login")
                  router.refresh()
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Login
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/register">
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Register
                </Link>
              </Button>
            </>
          )}
          <Button size="sm" asChild>
            <Link href="/request" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Request Blood
            </Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="flex items-center gap-2 px-2 pt-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Droplet className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold font-mono">LifeFlow</span>
            </SheetTitle>
            <nav className="flex flex-col gap-1 pt-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
              <div className="mt-4 flex flex-col gap-2 px-3">
                {!loading && user ? (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={dashboardHref}
                        onClick={() => setOpen(false)}
                      >
                        <LayoutDashboard className="mr-1.5 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await logout()
                        setOpen(false)
                        router.push("/login")
                        router.refresh()
                      }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/login" onClick={() => setOpen(false)}>
                        <LogIn className="mr-1.5 h-4 w-4" />
                        Login
                      </Link>
                    </Button>
                    <Button variant="default" size="sm" asChild>
                      <Link href="/register" onClick={() => setOpen(false)}>
                        <UserPlus className="mr-1.5 h-4 w-4" />
                        Register
                      </Link>
                    </Button>
                  </>
                )}
                <Button size="sm" asChild>
                  <Link href="/request" onClick={() => setOpen(false)} className="gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Request Blood
                  </Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
