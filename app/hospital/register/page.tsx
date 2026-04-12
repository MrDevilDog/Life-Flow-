"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Mail, Lock, ArrowRight, MapPin } from "lucide-react"

export default function HospitalRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [location, setLocation] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (!name || !email || !password || !location) {
        throw new Error("Please fill out all fields.")
      }

      const res = await fetch("/api/hospital/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, location }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error ?? "Registration failed")
      }

      router.push("/hospital/login")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="flex flex-col items-center gap-4 pb-2 pt-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive">
            <Building2 className="h-7 w-7 text-destructive-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
              Register Hospital
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Join the blood donation network
            </p>
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
              <Label htmlFor="name" className="flex items-center gap-1.5 text-sm font-medium">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Hospital Name
              </Label>
              <Input
                id="name"
                placeholder="City General Hospital"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="location" className="flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                City / Location
              </Label>
              <Input
                id="location"
                placeholder="New York"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="flex items-center gap-1.5 text-sm font-medium">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@hospital.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="flex items-center gap-1.5 text-sm font-medium">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Secure password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" variant="destructive" className="w-full gap-2 mt-4" disabled={loading}>
              {loading ? "Registering..." : "Register Hospital"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="flex justify-center border-t border-border bg-muted/30 px-6 py-4">
          <p className="text-sm text-muted-foreground">
            {"Already registered? "}
            <Link
              href="/hospital/login"
              className="font-medium text-destructive hover:underline"
            >
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
