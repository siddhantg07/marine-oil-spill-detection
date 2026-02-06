"use client"

import { useState, useEffect } from "react"
import { LogOut, Lock, Activity, Calendar, Mail, User, Shield, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProfileAvatar } from "@/components/cards/profile-avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import api, { endpoints } from "@/lib/api"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    username: "",
    role: "",
    profileImage: "",
  })

  // Add profileImageFile state
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)

  // Add profileImage state if needed, though ProfileAvatar handling might need its own logic
  // For now we trust ProfileAvatar uses a prop or context, but looking at the component usage:
  // <ProfileAvatar fallback="JD" /> -> It likely needs a specific image URL prop if we want to show the uploaded one.
  // I will check ProfileAvatar component later if it doesn't support image src.
  // For now let's focus on text fields.

  const [stats, setStats] = useState({
    totalScans: 0,
    lastScanDate: "No scans yet",
    memberSince: "New Member",
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(endpoints.profile)
        // axios returns data in response.data
        const data = response.data

        setProfile({
          fullName: data.fullName,
          email: data.email,
          username: data.username,
          role: data.role,
          profileImage: data.profileImage ? "http://127.0.0.1:5000/" + data.profileImage : ""
        })
        setStats({
          totalScans: data.stats.totalScans,
          lastScanDate: data.stats.lastScanDate,
          memberSince: data.stats.memberSince
        })
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      }
    }

    fetchProfile()
  }, [])

  const handleFileSelect = (file: File) => {
    setProfileImageFile(file)
    // Create a preview URL
    const objectUrl = URL.createObjectURL(file)
    setProfile(prev => ({ ...prev, profileImage: objectUrl }))
    setIsEditing(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append("username", profile.username)
      formData.append("full_name", profile.fullName)
      formData.append("email", profile.email)
      formData.append("role", profile.role)
      if (profileImageFile) {
        formData.append("profile_image", profileImageFile)
      }

      // axios automatically sets Content-Type to multipart/form-data when body is FormData
      // and handles credentials
      const response = await api.post(endpoints.profile, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      const data = response.data
      if (data.success) {
        setProfile(prev => ({
          ...prev,
          fullName: data.user.fullName,
          email: data.user.email,
          role: data.user.role,
          profileImage: data.user.profileImage ? "http://127.0.0.1:5000/" + data.user.profileImage : ""
        }))
        setProfileImageFile(null) // Reset file selection
      }
    } catch (error) {
      console.error("Failed to save profile:", error)
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
        <p className="mt-1 text-muted-foreground">Manage your account information and preferences</p>
      </div>

      {/* Profile header card */}
      <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <ProfileAvatar
            fallback={profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
            src={profile.profileImage}
            onFileSelect={handleFileSelect}
          />
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-semibold text-foreground">{profile.fullName}</h3>
            <p className="text-muted-foreground">@{profile.username}</p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Shield className="h-3 w-3" />
              {profile.role}
            </div>
          </div>
        </div>
      </div>

      {/* Account information */}
      <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between">
          <h4 className="text-lg font-semibold text-foreground">Account Information</h4>
          <Button
            variant={isEditing ? "outline" : "secondary"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  id="fullName"
                  value={profile.fullName}
                  onChange={(e) =>
                    setProfile({ ...profile, fullName: e.target.value })
                  }
                  className="h-10 rounded-xl bg-background/50"
                />
              ) : (
                <p className="py-2 text-foreground">{profile.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Username
              </Label>
              {isEditing ? (
                <Input
                  id="username"
                  value={profile.username}
                  onChange={(e) =>
                    setProfile({ ...profile, username: e.target.value })
                  }
                  className="h-10 rounded-xl bg-background/50"
                />
              ) : (
                <p className="py-2 text-foreground">@{profile.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  className="h-10 rounded-xl bg-background/50"
                />
              ) : (
                <p className="py-2 text-foreground">{profile.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Role
              </Label>
              {isEditing ? (
                <Input
                  id="role"
                  value={profile.role}
                  onChange={(e) =>
                    setProfile({ ...profile, role: e.target.value })
                  }
                  className="h-10 rounded-xl bg-background/50"
                />
              ) : (
                <p className="py-2 text-foreground">{profile.role}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end border-t border-border pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="rounded-xl">
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Saving...
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm">
        <h4 className="mb-6 text-lg font-semibold text-foreground">Account Statistics</h4>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalScans.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Scans</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Calendar className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{stats.lastScanDate}</p>
              <p className="text-sm text-muted-foreground">Last Scan</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-3/10">
              <User className="h-6 w-6 text-chart-3" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{stats.memberSince}</p>
              <p className="text-sm text-muted-foreground">Member Since</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm">
        <h4 className="mb-6 text-lg font-semibold text-foreground">Account Actions</h4>
        <div className="flex flex-wrap gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl bg-transparent">
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter your current password and choose a new one.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      className="h-10 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      className="h-10 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="rounded-xl">
                  Update Password
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link href="/login">
            <Button variant="destructive" className="rounded-xl">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
