"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ForgotPassword } from "@/components/auth/forgot-password"
import { Droplet, Mail, Lock, ArrowRight, Building2, User } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { cn } from "@/lib/utils"

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"donor" | "hospital">("donor")
  const [error, setError] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { setUser } = useAuth()

  // Smart placeholder detection
  const getInputPlaceholder = () => {
    if (role === "hospital") {
      return "hospital@example.com"
    }
    return "Email or phone number"
  }

  const getInputType = () => {
    if (role === "hospital") {
      return "email"
    }
    return "text"
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, password, role }),
        credentials: "include", // Important: include cookies
      })

      const data = await res.json()
      console.log("Frontend response:", { status: res.status, data })
      
      if (!res.ok) {
        const errorMessage = data?.error || data?.message || "Login failed"
        setError(errorMessage)
        return
      }

      const user = data?.user
      if (!user) {
        setError("Login failed - no user data received")
        return
      }

      // Token is now set as HTTP-only cookie, no need to store in localStorage
      setUser(user)
      if (role === "hospital") {
        router.push("/hospital/dashboard")
      } else {
        router.push("/dashboard")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  if (showForgotPassword) {
    return (
      <ForgotPassword
        onBack={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setShowForgotPassword(false)
          setError("Password reset successful! Please login with your new password.")
        }}
      />
    )
  }

  return (
    <Card className="w-full max-w-md border-border">
      <CardHeader className="flex flex-col items-center gap-4 pb-2 pt-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          {role === "donor" ? (
            <Droplet className="h-7 w-7 text-primary-foreground" />
          ) : (
            <Building2 className="h-7 w-7 text-primary-foreground" />
          )}
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
            Welcome Back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to access your {role === "donor" ? "donor" : "hospital"} dashboard
          </p>
        </div>
        
        {/* Role Selector Tabs */}
        <div className="flex w-full bg-muted/40 p-1 rounded-lg mt-2">
          <button
            type="button"
            onClick={() => setRole("donor")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
              role === "donor" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <User className="h-4 w-4" />
            Donor Login
          </button>
          <button
            type="button"
            onClick={() => setRole("hospital")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
              role === "hospital" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <Building2 className="h-4 w-4" />
            Hospital Login
          </button>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-5 px-6 pt-4 md:px-8">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="emailOrPhone" className="flex items-center gap-1.5 text-sm font-medium">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              {role === "hospital" ? "Email Address" : "Email or Phone"}
            </Label>
            <Input
              id="emailOrPhone"
              type={getInputType()}
              placeholder={getInputPlaceholder()}
              required
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="flex items-center gap-1.5 text-sm font-medium">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Password
              </Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="cursor-pointer text-sm text-muted-foreground">
              Remember me for 30 days
            </Label>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm"
            onClick={() => setShowForgotPassword(true)}
          >
            Forgot Password?
          </Button>
        </CardContent>
      </form>

      {role === "donor" && (
        <CardFooter className="flex justify-center border-t border-border bg-muted/30 px-6 py-4">
          <p className="text-sm text-muted-foreground">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Register
            </Link>
          </p>
        </CardFooter>
      )}
    </Card>
  )
}
