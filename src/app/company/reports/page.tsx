"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, FileSpreadsheet, FileDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import toast from "react-hot-toast"

function downloadCSV(filename: string, headers: string[], rows: any[][]) {
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadExcel(filename: string, sheets: { name: string; data: any[] }[]) {
  const wb = XLSX.utils.book_new()
  sheets.forEach((s) => {
    const ws = XLSX.utils.json_to_sheet(s.data)
    XLSX.utils.book_append_sheet(wb, ws, s.name)
  })
  XLSX.writeFile(wb, filename)
}

function downloadPDF(title: string, sections: { heading: string; lines: string[] }[]) {
  const doc = new jsPDF()
  let y = 20
  doc.setFontSize(16)
  doc.text(title, 14, y)
  y += 10
  sections.forEach((s) => {
    doc.setFontSize(12)
    doc.text(s.heading, 14, y)
    y += 7
    doc.setFontSize(10)
    s.lines.forEach((line) => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(line, 14, y)
      y += 5
    })
    y += 3
  })
  doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}.pdf`)
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("weekly")
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setDashboard)
      .finally(() => setLoading(false))
  }, [])

  const weeklyData = dashboard?.moneyFlow?.weekly?.length
    ? dashboard.moneyFlow.weekly
    : [
        { label: "Mon", incoming: 0, outgoing: 0 },
        { label: "Tue", incoming: 0, outgoing: 0 },
        { label: "Wed", incoming: 0, outgoing: 0 },
        { label: "Thu", incoming: 0, outgoing: 0 },
        { label: "Fri", incoming: 0, outgoing: 0 },
        { label: "Sat", incoming: 0, outgoing: 0 },
        { label: "Sun", incoming: 0, outgoing: 0 },
      ]

  const volumeData = weeklyData.map((d: any) => ({
    name: d.label?.[0] || "",
    transfers: (d.incoming || 0) + (d.outgoing || 0),
    revenue: Math.round((d.incoming || 0) * 0.02),
  }))

  const branchData = dashboard?.branchBalances?.length
    ? dashboard.branchBalances.map((b: any) => ({
        name: b.branchName || b.name || "Branch",
        transfers: b.transferCount || b.count || 0,
        revenue: b.commission || b.balance || 0,
      }))
    : []

  const topBranches = dashboard?.topBranches || []

  // Build chart data
  const chartData = period === "daily"
    ? volumeData
    : volumeData.reduce((acc: any[], d: any, i: number) => {
        const weekIdx = Math.floor(i / 7)
        if (!acc[weekIdx]) acc[weekIdx] = { name: `W${weekIdx + 1}`, transfers: 0, revenue: 0 }
        acc[weekIdx].transfers += d.transfers
        acc[weekIdx].revenue += d.revenue
        return acc
      }, [])

  function exportCSV() {
    const headers = ["Period", "Transfers", "Revenue"]
    const rows = chartData.map((d: any) => [d.name, d.transfers, d.revenue])
    downloadCSV(`report_${period}.csv`, headers, rows)
    toast.success("CSV downloaded")
  }

  function exportExcel() {
    const sheets = [
      {
        name: "Overview",
        data: chartData.map((d: any) => ({ Period: d.name, Transfers: d.transfers, Revenue: d.revenue })),
      },
    ]
    if (branchData.length > 0) {
      sheets.push({
        name: "Branches",
        data: branchData.map((b: any) => ({ Branch: b.name, Transfers: b.transfers, Revenue: b.revenue })),
      })
    }
    downloadExcel(`report_${period}.xlsx`, sheets)
    toast.success("Excel downloaded")
  }

  function exportPDF() {
    const sections = [
      {
        heading: `${period.charAt(0).toUpperCase() + period.slice(1)} Overview`,
        lines: chartData.map((d: any) => `${d.name}: ${d.transfers} transfers, ${formatCurrency(d.revenue, "USD")}`),
      },
    ]
    if (branchData.length > 0) {
      sections.push({
        heading: "Branch Performance",
        lines: branchData.map((b: any) => `${b.name}: ${b.transfers} transfers, ${formatCurrency(b.revenue, "USD")}`),
      })
    }
    downloadPDF(`Report ${period}`, sections)
    toast.success("PDF downloaded")
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground">Loading reports...</div>
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm">View and export reports</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={exportPDF}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportExcel}>
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
            <FileDown className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="branches">Branch Reports</TabsTrigger>
          <TabsTrigger value="commission">Commission Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Transaction Volume</CardTitle>
                  <div className="flex gap-1">
                    {["daily", "weekly", "monthly"].map((p) => (
                      <Button key={p} variant={period === p ? "default" : "ghost"} size="sm" onClick={() => setPeriod(p)}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" tickLine={false} axisLine={false} />
                      <YAxis className="text-xs" tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="transfers" fill="#0F4C81" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue by Branch</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchData.length > 0 ? branchData : [{ name: "No data", transfers: 0, revenue: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" tickLine={false} axisLine={false} />
                      <YAxis className="text-xs" tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#00A86B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branches">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Branch Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {branchData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No branch data available</p>
              ) : (
                <div className="space-y-4">
                  {branchData.map((b: any) => (
                    <div key={b.name} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{b.name}</p>
                        <p className="text-sm text-muted-foreground">{b.transfers} transfers</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-semibold text-secondary-600">{formatCurrency(b.revenue, "USD")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Commission Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.commissionFlow ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Commission</p>
                      <p className="text-2xl font-bold">{formatCurrency(dashboard.commissionFlow.totalCommission || 0, "USD")}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">This Period</p>
                      <p className="text-2xl font-bold">{formatCurrency(dashboard.commissionFlow.periodCommission || 0, "USD")}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg per Transfer</p>
                      <p className="text-2xl font-bold">{formatCurrency(dashboard.commissionFlow.averageCommission || 0, "USD")}</p>
                    </div>
                  </div>
                  {dashboard.byCurrency?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">By Currency</p>
                      <div className="space-y-2">
                        {dashboard.byCurrency.map((c: any) => (
                          <div key={c.currency} className="flex items-center justify-between p-3 rounded-lg border">
                            <span className="font-medium">{c.currency}</span>
                            <span className="text-sm">{formatCurrency(c.totalAmount || c.amount || 0, "USD")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Commission data will appear here</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
