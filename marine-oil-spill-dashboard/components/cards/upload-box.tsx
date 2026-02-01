"use client"

import React from "react"

import { useCallback, useState } from "react"
import { Upload, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface UploadBoxProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  preview: string | null
}

export function UploadBox({ onFileSelect, selectedFile, preview }: UploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith("image/")) {
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  const handleRemove = useCallback(() => {
    onFileSelect(null)
  }, [onFileSelect])

  if (selectedFile && preview) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/50">
        <div className="relative aspect-video w-full">
          <img
            src={preview || "/placeholder.svg"}
            alt="Selected satellite image"
            className="h-full w-full object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute right-3 top-3 h-8 w-8 rounded-full"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove image</span>
          </Button>
        </div>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-foreground">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border bg-card/50 hover:border-primary/50 hover:bg-card"
      )}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
      />
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Upload className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        Drop your satellite image here
      </h3>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        or click to browse from your computer
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        Supports: JPG, PNG, TIFF (max 50MB)
      </p>
    </label>
  )
}
