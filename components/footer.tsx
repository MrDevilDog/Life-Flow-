"use client"

import Link from "next/link"
import { Droplet, Heart } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

export function Footer() {
  const { user } = useAuth()
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Droplet className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold font-mono text-foreground">LifeFlow</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Connecting blood donors with those in need. Every drop counts, every donor matters.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Quick Links</h4>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              {!user && (
                <li>
                  <Link href="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Register as Donor
                  </Link>
                </li>
              )}
              <li>
                <Link href="/search" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Find Donors
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Resources</h4>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Donor Dashboard
                </Link>
              </li>
              <li>
                <Link href="/history" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Donation History
                </Link>
              </li>
              <li>
                <Link href="/request-dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Request Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Emergency</h4>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/request" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Request Blood
                </Link>
              </li>
              <li>
                <Link href="/emergency" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Active Emergencies
                </Link>
              </li>
              <li>
                <Link href="/nearby" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Nearby Donors
                </Link>
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              24/7 Helpline:
            </p>
            <p className="text-lg font-bold text-primary">1-800-BLOOD</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            2026 LifeFlow. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            Made with <Heart className="h-3.5 w-3.5 text-primary fill-primary" /> for saving lives
          </p>
        </div>
      </div>
    </footer>
  )
}
