"use client"

import { useState, useCallback } from "react"
import { ScanLine, Download, CheckCircle, AlertTriangle, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UploadBox } from "@/components/cards/upload-box"
import { cn } from "@/lib/utils"

type DetectionResult = {
  detected: boolean
  confidence: number
  region: string
  timestamp: string
}

export default function ScanPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)

  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file)
    setResult(null)

    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }, [])

  const handleDetect = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    // Simulate AI detection
    await new Promise((resolve) => setTimeout(resolve, 2500))

    // Simulate random result
    const detected = Math.random() > 0.7
    setResult({
      detected,
      confidence: detected ? 94.2 + Math.random() * 5 : 97.5 + Math.random() * 2.5,
      region: "North Atlantic Ocean",
      timestamp: new Date().toLocaleString(),
    })
    setIsAnalyzing(false)
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">New Detection Scan</h2>
        <p className="mt-1 text-muted-foreground">
          Upload a satellite image to analyze for potential oil spills
        </p>
      </div>

      {/* Upload section */}
      {!result && (
        <UploadBox
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          preview={preview}
        />
      )}

      {/* Detect button */}
      {selectedFile && !result && (
        <div className="flex justify-center">
          <Button
            size="lg"
            className="h-12 rounded-xl px-8"
            onClick={handleDetect}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Analyzing Image...
              </div>
            ) : (
              <>
                <ScanLine className="mr-2 h-5 w-5" />
                Start Detection
              </>
            )}
          </Button>
        </div>
      )}

      {/* Loading animation */}
      {isAnalyzing && (
        <div className="rounded-2xl border border-border bg-card/50 p-8 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-6">
              <div className="h-24 w-24 animate-pulse rounded-full bg-primary/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="h-10 w-10 animate-pulse text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground">AI Analysis in Progress</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Our advanced neural network is scanning the satellite image for oil spill patterns...
            </p>
            <div className="mt-4 h-2 w-64 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-full animate-[progress_2.5s_ease-in-out] bg-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Result badge */}
          <div
            className={cn(
              "flex items-center justify-center gap-3 rounded-2xl border p-6",
              result.detected
                ? "border-destructive/50 bg-destructive/10"
                : "border-accent/50 bg-accent/10"
            )}
          >
            {result.detected ? (
              <>
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <h3 className="text-xl font-bold text-destructive">Oil Spill Detected</h3>
                  <p className="text-sm text-destructive/80">Immediate attention recommended</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="h-8 w-8 text-accent" />
                <div>
                  <h3 className="text-xl font-bold text-accent">No Oil Detected</h3>
                  <p className="text-sm text-accent/80">Water appears to be clean</p>
                </div>
              </>
            )}
          </div>

          {/* Images grid */}
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Original */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Original Image</p>
              <div className="aspect-video overflow-hidden rounded-xl border border-border">
                {preview && (
                  <img
                    src={preview || "/placeholder.svg"}
                    alt="Original satellite image"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>

            {/* Mask */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Detection Mask</p>
              <div className="aspect-video overflow-hidden rounded-xl border border-border bg-muted">
                <div className="relative h-full w-full">
                  {preview && (
                    <img
                      src={preview || "/placeholder.svg"}
                      alt="Detection mask"
                      className="h-full w-full object-cover opacity-30 grayscale"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium",
                        result.detected
                          ? "bg-destructive/20 text-destructive"
                          : "bg-accent/20 text-accent"
                      )}
                    >
                      AI Processed
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Overlay Result</p>
              <div className="aspect-video overflow-hidden rounded-xl border border-border">
                <div className="relative h-full w-full">
                  {preview && (
                    <img
                      src={preview || "/placeholder.svg"}
                      alt="Overlay result"
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div
                    className={cn(
                      "absolute inset-0",
                      result.detected ? "bg-destructive/20" : "bg-accent/10"
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm">
            <h4 className="mb-4 font-semibold text-foreground">Detection Details</h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="text-lg font-semibold text-foreground">
                  {result.confidence.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Region</p>
                <p className="text-lg font-semibold text-foreground">{result.region}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Timestamp</p>
                <p className="text-lg font-semibold text-foreground">{result.timestamp}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">File Name</p>
                <p className="truncate text-lg font-semibold text-foreground">
                  {selectedFile?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="h-12 rounded-xl px-6">
              <Download className="mr-2 h-5 w-5" />
              Download Report
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-xl px-6 bg-transparent"
              onClick={handleReset}
            >
              <ScanLine className="mr-2 h-5 w-5" />
              New Scan
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
