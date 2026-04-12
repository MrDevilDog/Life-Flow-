"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Droplet, HeartPulse, ArrowRight } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

export function HeroSection() {
  const { user } = useAuth()

  return (
    <section className="relative overflow-hidden bg-card">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--primary)_0%,_transparent_50%)] opacity-[0.07]" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1 text-xs font-medium">
              <HeartPulse className="h-3.5 w-3.5 text-primary" />
              Saving lives, one donation at a time
            </Badge>

            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground font-mono md:text-5xl lg:text-6xl">
              Your Blood Can{" "}
              <span className="text-primary">Save Lives</span>
            </h1>

            <p className="max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
              Join thousands of donors who are making a difference every day.
              Register as a blood donor or find the blood you need in minutes.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!user && (
                <Button size="lg" asChild className="gap-2">
                  <Link href="/register">
                    <Droplet className="h-4 w-4" />
                    Register as Donor
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" asChild className="gap-2">
                <Link href="/request">
                  Request Blood
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-2">
                {[
                  "bg-primary/80",
                  "bg-primary/60",
                  "bg-primary/40",
                  "bg-primary/20",
                ].map((bg, i) => (
                  <div
                    key={i}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-card ${bg}`}
                  >
                    <span className="text-[10px] font-bold text-primary-foreground">
                      {["A+", "O-", "B+", "AB"][i]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">2,400+</span>{" "}
                active donors this month
              </p>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative mx-auto flex aspect-square max-w-md items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/5" />
              <div className="absolute inset-8 rounded-full bg-primary/8" />
              <div className="absolute inset-16 rounded-full bg-primary/12" />
              <div className="relative flex flex-col items-center gap-4">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/20">
                  <Droplet className="h-14 w-14 text-primary-foreground" />
                </div>
                <p className="text-center text-lg font-semibold text-foreground">
                  Every 2 seconds,
                  <br />
                  someone needs blood
                </p>
              </div>

              <div className="absolute left-4 top-1/4 rounded-xl border border-border bg-card p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-xs font-bold text-primary">A+</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Available</p>
                    <p className="text-[10px] text-muted-foreground">12 donors near you</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-1/4 right-4 rounded-xl border border-border bg-card p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-xs font-bold text-primary">O-</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Urgent Need</p>
                    <p className="text-[10px] text-muted-foreground">3 requests pending</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
