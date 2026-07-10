"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { PhoneInput } from "@/components/ui/phone-input"
import { Building2, Palette, Shield, User, Camera, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const user = session?.user as any
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [companyName, setCompanyName] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [website, setWebsite] = useState("")

  const [primaryColor, setPrimaryColor] = useState("#0F4C81")
  const [secondaryColor, setSecondaryColor] = useState("#00A86B")
  const [logo, setLogo] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [profileName, setProfileName] = useState("")
  const [profileEmail, setProfileEmail] = useState("")
  const [profilePhone, setProfilePhone] = useState("")
  const [profilePosition, setProfilePosition] = useState("")
  const [profileImage, setProfileImage] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(true)
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [savingBranding, setSavingBranding] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (user?.companyId) {
      fetch("/api/company")
        .then((r) => r.json())
        .then((data) => {
          if (data.name) setCompanyName(data.name)
          if (data.registrationNumber) setRegistrationNumber(data.registrationNumber)
          if (data.email) setEmail(data.email)
          if (data.phone) setPhone(data.phone)
          if (data.address) setAddress(data.address)
          if (data.website) setWebsite(data.website)
          if (data.primaryColor) setPrimaryColor(data.primaryColor)
          if (data.secondaryColor) setSecondaryColor(data.secondaryColor)
          if (data.logo) setLogo(data.logo)
        })
        .catch(() => toast.error("Unable to load company data. Please try again."))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "")
      setProfileEmail(user.email || "")
      setProfilePhone(user.phone || "")
      setProfilePosition(user.position || "")
      setProfileImage(user.image || "")
    }
  }, [user])

  async function handleSaveGeneral() {
    setSavingGeneral(true)
    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          registrationNumber,
          email,
          phone,
          address,
          website,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save")
      }
      toast.success("General settings saved")
    } catch (err: any) {
      toast.error(err.message || "Failed to save general settings")
    } finally {
      setSavingGeneral(false)
    }
  }

  async function handleSaveBranding() {
    setSavingBranding(true)
    try {
      let logoUrl = logo

      if (logoFile) {
        const formData = new FormData()
        formData.append("file", logoFile)
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        if (!uploadRes.ok) throw new Error("Failed to upload logo")
        const uploadData = await uploadRes.json()
        logoUrl = uploadData.url
      }

      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryColor,
          secondaryColor,
          logo: logoUrl,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save")
      }
      const data = await res.json()
      if (data.logo) setLogo(data.logo)
      setLogoFile(null)
      toast.success("Branding saved")
    } catch (err: any) {
      toast.error(err.message || "Failed to save branding")
    } finally {
      setSavingBranding(false)
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    setChangingPassword(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to change password")
      }
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password changed successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleSaveProfile() {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setSavingProfile(true)
    try {
      let imageUrl = profileImage

      if (avatarFile) {
        const formData = new FormData()
        formData.append("file", avatarFile)
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        if (!uploadRes.ok) throw new Error("Failed to upload avatar")
        const uploadData = await uploadRes.json()
        imageUrl = uploadData.url
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          phone: profilePhone,
          position: profilePosition,
          image: imageUrl,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save")
      }
      await update()
      setAvatarFile(null)
      setProfileImage(imageUrl)
      toast.success("Profile updated")
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile")
    } finally {
      setSavingProfile(false)
    }
  }

  const checks = newPassword ? [
    { label: "Min 8 characters", met: newPassword.length >= 8 },
    { label: "Has uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "Has lowercase letter", met: /[a-z]/.test(newPassword) },
    { label: "Has number", met: /\d/.test(newPassword) },
    { label: "Has special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
  ] : []

  const strengthScore = checks.filter((c) => c.met).length

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your company and account settings</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            <Building2 className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Update your company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regNumber">Registration Number</Label>
                  <Input
                    id="regNumber"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="Registration Number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Phone</Label>
                  <PhoneInput
                    id="companyPhone"
                    value={phone}
                    onChange={setPhone}
                    placeholder="924 440 899"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Address</Label>
                <Input
                  id="companyAddress"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Company Address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Website</Label>
                <Input
                  id="companyWebsite"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://company.com"
                />
              </div>
              <Button onClick={handleSaveGeneral} disabled={savingGeneral}>
                {savingGeneral && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {savingGeneral ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Customize your company branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-10 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="secondaryColor"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-10 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
                {logo && (
                  <div className="mt-2">
                    <img
                      src={logoFile ? URL.createObjectURL(logoFile) : logo}
                      alt="Company logo"
                      className="h-16 w-auto object-contain rounded border"
                    />
                  </div>
                )}
              </div>
              <Button onClick={handleSaveBranding} disabled={savingBranding}>
                {savingBranding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {savingBranding ? "Saving..." : "Save Branding"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-2 flex-1 rounded-full transition-colors ${
                          strengthScore >= level
                            ? strengthScore <= 2
                              ? "bg-red-500"
                              : strengthScore <= 3
                              ? "bg-yellow-500"
                              : "bg-green-500"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="space-y-1">
                    {checks.map((check, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div
                          className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            check.met
                              ? "bg-green-500/20 text-green-500"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {check.met ? "✓" : "✕"}
                        </div>
                        <span className={check.met ? "text-green-500" : "text-muted-foreground"}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={handleChangePassword} disabled={changingPassword}>
                {changingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {changingPassword ? "Changing..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileImage || undefined} />
                  <AvatarFallback className="bg-muted">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    ref={avatarInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setAvatarFile(file)
                        setProfileImage(URL.createObjectURL(file))
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  {profileImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAvatarFile(null)
                        setProfileImage("")
                      }}
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profileName">Name</Label>
                  <Input
                    id="profileName"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profilePosition">Job Title</Label>
                  <Input
                    id="profilePosition"
                    value={profilePosition}
                    onChange={(e) => setProfilePosition(e.target.value)}
                    placeholder="Your job title"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profileEmail">Email</Label>
                  <Input
                    id="profileEmail"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profilePhone">Phone</Label>
                  <PhoneInput
                    id="profilePhone"
                    value={profilePhone}
                    onChange={setProfilePhone}
                    placeholder="924 440 899"
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {savingProfile ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
