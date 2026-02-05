"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ScanLine, History, AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatsCard } from "@/components/cards/stats-card"
import { getDashboardData } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    total_scans: 0,
    oil_scans: 0,
    no_oil_scans: 0,
    last_image: null as string | null,
    last_original: null as string | null,
    last_mask: null as string | null,
    last_time: "No scans yet"
  })
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getDashboardData()
        setData(response.data)
      } catch (error: any) {
        console.error("Failed to fetch dashboard data:", error)
        if (error.response && error.response.status === 401) {
          router.push("/login")
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  console.log("Dashboard Data State:", data)

  const stats = [
    {
      title: "Total Scans",
      value: data.total_scans.toLocaleString(),
      icon: Activity,
      // trend: { value: 12, isPositive: true },
    },
    {
      title: "Oil Detected",
      value: data.oil_scans.toLocaleString(),
      icon: AlertTriangle,
      description: "Requires attention",
    },
    {
      title: "No Oil Detected",
      value: data.no_oil_scans.toLocaleString(),
      icon: CheckCircle,
      // trend: { value: 8, isPositive: true },
    },
    {
      title: "Last Scan",
      value: data.last_image ? "Recent" : "None",
      icon: Clock,
      description: data.last_time !== "No scans yet"
        ? new Date(data.last_time).toLocaleDateString()
        : "No activity",
    },
  ]

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
        <p className="mt-1 text-muted-foreground">
          {"Here's an overview of your detection activity"}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        /* Stats grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>
      )}

      {/* Last scan preview */}
      <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Last Scan Preview</h3>
            <p className="text-sm text-muted-foreground">Most recent detection result</p>
          </div>
          {data.last_image && (
            <div className="flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-accent">
              <History className="h-4 w-4" />
              Latest Scan
            </div>
          )}
        </div>

        {data.last_image ? (
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Original Image */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Original Image</p>
              <div className="aspect-video overflow-hidden rounded-xl border border-border bg-muted">
                <div className="relative h-full w-full">
                  <img
                    src={`${baseUrl}/static/${data.last_original}`}
                    alt="Original satellite image"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Mask Image */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Detection Mask</p>
              <div className="aspect-video overflow-hidden rounded-xl border border-border bg-muted">
                <div className="relative h-full w-full">
                  <img
                    src={`${baseUrl}/static/${data.last_mask}`}
                    alt="Detection mask"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Overlay Image */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Overlay Result</p>
              <div className="aspect-video overflow-hidden rounded-xl border border-border bg-muted">
                <div className="relative h-full w-full">
                  <img
                    src={`${baseUrl}/static/${data.last_image}`}
                    alt="Last scan overlay"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-muted-foreground/25">
            <p className="text-muted-foreground">No scans recorded yet</p>
          </div>
        )}

        {/* Scan details */}
        {data.last_image && (
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Date:</span>
              <span className="text-sm font-medium text-foreground">{data.last_time}</span>
            </div>
          </div>
        )}
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
