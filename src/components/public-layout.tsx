import { PublicNavbar } from "@/components/public-navbar"
import { PublicFooter } from "@/components/public-footer"
import { NetworkStatusIndicator } from "@/components/network-status"

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <PublicNavbar />
      <main>{children}</main>
      <PublicFooter />
      <NetworkStatusIndicator />
    </div>
  )
}
