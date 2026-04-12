import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { History, Search, AlertTriangle, Radar } from "lucide-react"

const actions = [
  {
    icon: History,
    label: "View Donation History",
    href: "/history",
    description: "See your past donations",
  },
  {
    icon: AlertTriangle,
    label: "Emergency Requests",
    href: "/emergency",
    description: "View active blood requests",
  },
  {
    icon: Radar,
    label: "Nearby Donors",
    href: "/nearby",
    description: "Find donors near you",
  },
  {
    icon: Search,
    label: "Find Donors",
    href: "/search",
    description: "Search all blood donors",
  },
]

export function QuickActions() {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="flex h-auto flex-col items-start gap-1 p-4 text-left"
              asChild
            >
              <Link href={action.href}>
                <action.icon className="mb-1 h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{action.label}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {action.description}
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
