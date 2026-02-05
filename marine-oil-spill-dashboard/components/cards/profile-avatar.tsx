"use client"

import React from "react"

import { useState, useRef } from "react"
import { Camera } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ProfileAvatarProps {
  src?: string
  fallback: string
  className?: string
  onFileSelect?: (file: File) => void
}

export function ProfileAvatar({ src, fallback, className, onFileSelect }: ProfileAvatarProps) {
  const [isHovered, setIsHovered] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (onFileSelect) {
        onFileSelect(file)
      }
      // Handle file upload - for now just log
      console.log("[v0] Avatar file selected:", file.name)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
      />
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative block rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      >
        <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
          <AvatarImage src={src || "/placeholder.svg"} alt="Profile avatar" />
          <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
            {fallback}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-background/80 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="flex flex-col items-center gap-1">
            <Camera className="h-5 w-5 text-foreground" />
            <span className="text-xs font-medium text-foreground">Change</span>
          </div>
        </div>
      </button>
    </div>
  )
}
