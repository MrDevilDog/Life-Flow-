"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Droplet, ArrowRight } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

export function CTASection() {
  const { user } = useAuth()
  return (
    <section className="bg-background py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary p-8 text-center md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />
          <div className="relative">
            <Droplet className="mx-auto mb-4 h-12 w-12 text-primary-foreground opacity-80" />
            <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground font-mono md:text-4xl">
              Ready to Make a Difference?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty text-primary-foreground/80">
              Whether you want to donate blood or need it urgently, we are here to help.
              Join our community of life-savers today.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {!user && (
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="gap-2"
                >
                  <Link href="/register">
                    <Droplet className="h-4 w-4" />
                    Register as Donor
                  </Link>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                asChild
                className="gap-2 border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link href="/request">
                  Request Blood
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
