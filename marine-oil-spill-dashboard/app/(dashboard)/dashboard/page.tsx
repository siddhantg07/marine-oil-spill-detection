import Link from "next/link"
import { ScanLine, History, AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatsCard } from "@/components/cards/stats-card"

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Scans",
      value: "1,284",
      icon: Activity,
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Oil Detected",
      value: "47",
      icon: AlertTriangle,
      description: "Requires attention",
    },
    {
      title: "No Oil Detected",
      value: "1,237",
      icon: CheckCircle,
      trend: { value: 8, isPositive: true },
    },
    {
      title: "Last Scan",
      value: "2h ago",
      icon: Clock,
      description: "Jan 28, 2026",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome back, John</h2>
        <p className="mt-1 text-muted-foreground">
          {"Here's an overview of your detection activity"}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Last scan preview */}
      <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Last Scan Preview</h3>
            <p className="text-sm text-muted-foreground">Most recent detection result</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-accent">
            <CheckCircle className="h-4 w-4" />
            No Oil Detected
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Original Image */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Original Image</p>
            <div className="aspect-video overflow-hidden rounded-xl border border-border bg-muted">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <ScanLine className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Satellite Image</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detection Mask */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Detection Mask</p>
            <div className="aspect-video overflow-hidden rounded-xl border border-border bg-muted">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                    <Activity className="h-6 w-6 text-accent" />
                  </div>
                  <p className="text-sm text-muted-foreground">AI Analysis</p>
                </div>
              </div>
            </div>
          </div>

          {/* Overlay */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Overlay Result</p>
            <div className="aspect-video overflow-hidden rounded-xl border border-border bg-muted">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-chart-2/10">
                    <CheckCircle className="h-6 w-6 text-chart-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">Clean Water</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scan details */}
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <span className="text-sm font-medium text-foreground">98.7%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Region:</span>
            <span className="text-sm font-medium text-foreground">North Atlantic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Date:</span>
            <span className="text-sm font-medium text-foreground">Jan 28, 2026 14:32</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-4">
        <Link href="/scan">
          <Button size="lg" className="h-12 rounded-xl px-6">
            <ScanLine className="mr-2 h-5 w-5" />
            New Scan
          </Button>
        </Link>
        <Link href="/history">
          <Button size="lg" variant="outline" className="h-12 rounded-xl px-6 bg-transparent">
            <History className="mr-2 h-5 w-5" />
            View History
          </Button>
        </Link>
      </div>
    </div>
  )
}
