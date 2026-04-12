"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth/auth-context"
import { Droplet, Save, LogOut } from "lucide-react"
import { toast } from "sonner"

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

interface InventoryItem {
  blood_group: string;
  units: number;
  updated_at: string;
}

export default function HospitalDashboard() {
  const router = useRouter()
  const { user, setUser, loading, logout } = useAuth()
  const [inventory, setInventory] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/hospital/login")
      } else if (user.role !== "hospital") {
        router.push("/dashboard")
      } else {
        fetchInventory()
      }
    }
  }, [user, loading, router])

  async function fetchInventory() {
    try {
      const res = await fetch("/api/hospital/inventory", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (!res.ok) throw new Error("Failed to load inventory")
      const data: InventoryItem[] = await res.json()
      
      const invMap: Record<string, number> = {}
      data.forEach(item => {
        invMap[item.blood_group] = item.units
      })
      setInventory(invMap)
    } catch (e) {
      console.error(e)
    }
  }

  async function updateInventory(blood_group: string, units: number) {
    setSaving(prev => ({ ...prev, [blood_group]: true }))
    try {
      const res = await fetch("/api/hospital/inventory", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ blood_group, units }),
      })
      
      if (!res.ok) throw new Error("Failed to update inventory")
      toast("Inventory updated successfully")
    } catch (e) {
      console.error(e)
      toast("Error updating inventory")
    } finally {
      setSaving(prev => ({ ...prev, [blood_group]: false }))
    }
  }

  async function handleLogout() {
    await logout()
    router.push("/login")
    router.refresh()
  }

  if (loading || !user) return <div className="p-8">Loading...</div>

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospital Dashboard</h1>
          <p className="text-muted-foreground">{user.name} - Blood Inventory Management</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bloodGroups.map((bg) => (
          <Card key={bg} className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl font-mono text-primary">
                <Droplet className="h-5 w-5" />
                {bg}
              </CardTitle>
              <CardDescription>Available Units</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  value={inventory[bg] ?? 0}
                  onChange={(e) => setInventory({ ...inventory, [bg]: parseInt(e.target.value) || 0 })}
                  className="font-mono text-lg font-bold"
                />
                <Button 
                  size="icon" 
                  onClick={() => updateInventory(bg, inventory[bg] || 0)}
                  disabled={saving[bg]}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
