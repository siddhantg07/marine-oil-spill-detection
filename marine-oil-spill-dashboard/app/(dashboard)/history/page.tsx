"use client"

import { useEffect, useState } from "react"
import { Eye, Download, CheckCircle, AlertTriangle, Search, Filter, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
// import { getScanHistory } from "@/lib/api" // Ensure this is exported in api.ts
import { getScanHistory } from "@/lib/api"
import { useRouter } from "next/navigation"

type HistoryItem = {
  id: number
  date: string
  region: string
  detected: boolean
  confidence: number
  image_url: string
  report_url: string
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [showEmpty, setShowEmpty] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getScanHistory()
        const backendData = response.data

        // Transform backend data to match frontend interface
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

        const transformedData: HistoryItem[] = backendData.map((item: any, index: number) => ({
          id: index, // Backend doesn't return ID in JSON currently, using index
          date: item.timestamp,
          region: "Global", // Backend doesn't store region yet
          detected: item.result === "Oil Spill Detected",
          confidence: item.confidence || 0,
          image_url: `${baseUrl}/static/${item.original_image}`,
          report_url: `${baseUrl}/static/${item.report_file}`
        }))

        setHistory(transformedData)
      } catch (error: any) {
        console.error("Failed to fetch history:", error)
        if (error.response && error.response.status === 401) {
          router.push("/login")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [router])

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.date.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      filter === "all" ||
      (filter === "detected" && item.detected) ||
      (filter === "clean" && !item.detected)
    return matchesSearch && matchesFilter
  })

  // Toggle empty state for demonstration (can be removed or kept for testing)
  const displayHistory = showEmpty ? [] : filteredHistory

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Scan History</h2>
          <p className="mt-1 text-muted-foreground">
            View and manage your previous detection scans
          </p>
        </div>
        {/* Removed 'Show Empty State' button for cleanliness, or can keep it */}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by date or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-xl bg-background/50 pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-10 w-full rounded-xl bg-background/50 sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter results" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="detected">Oil Detected</SelectItem>
            <SelectItem value="clean">No Oil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted"></div>)}
        </div>
      ) : displayHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No scan history</h3>
          <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
            {searchQuery || filter !== "all"
              ? "No scans match your current filters. Try adjusting your search criteria."
              : "You haven't performed any scans yet. Start by uploading a satellite image."}
          </p>
        </div>
      ) : (
        /* History grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayHistory.map((scan) => (
            <div
              key={scan.id}
              className="group overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-card"
            >
              {/* Preview */}
              <div className="relative aspect-video bg-muted">
                {/* Show Image */}
                <img
                  src={scan.image_url}
                  alt="Scan"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium backdrop-blur-md",
                      scan.detected
                        ? "bg-destructive/80 text-destructive-foreground"
                        : "bg-accent/80 text-accent-foreground"
                    )}
                  >
                    {scan.detected ? "Oil Detected" : "Clean"}
                  </div>
                </div>
                {/* Overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
                  {/* View button logic could be complex (redirect to scan page with state? or modal?) */}
                  {/* For now removed View or keep simpler */}
                  {scan.report_url && (
                    <Button size="sm" variant="secondary" className="h-8 rounded-lg" onClick={() => window.open(scan.report_url, '_blank')}>
                      <Download className="mr-1 h-3 w-3" />
                      Report
                    </Button>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{scan.region}</p>
                    <p className="text-sm text-muted-foreground">{scan.date}</p>
                  </div>
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      scan.detected ? "bg-destructive/10" : "bg-accent/10"
                    )}
                  >
                    {scan.detected ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-accent" />
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">Affected Area</span>
                  <span className="text-sm font-medium text-foreground">
                    {scan.confidence.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination hint */}
      {displayHistory.length > 0 && (
        <div className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Showing {displayHistory.length} scan{displayHistory.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
