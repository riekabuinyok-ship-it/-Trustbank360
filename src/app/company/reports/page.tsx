"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Download, FileText, FileSpreadsheet, FileDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const weeklyData = [
  { name: "Mon", transfers: 12, revenue: 240 },
  { name: "Tue", transfers: 18, revenue: 360 },
  { name: "Wed", transfers: 15, revenue: 300 },
  { name: "Thu", transfers: 22, revenue: 440 },
  { name: "Fri", transfers: 28, revenue: 560 },
  { name: "Sat", transfers: 8, revenue: 160 },
  { name: "Sun", transfers: 5, revenue: 100 },
]

const branchData = [
  { name: "Juba Main", transfers: 45, revenue: 900 },
  { name: "Nairobi", transfers: 32, revenue: 640 },
  { name: "Kampala", transfers: 28, revenue: 560 },
]

export default function ReportsPage() {
  const [period, setPeriod] = useState("weekly")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">View and export reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <FileDown className="h-4 w-4" />
            CSV
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
                    <BarChart data={weeklyData}>
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
                    <BarChart data={branchData}>
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
              <div className="space-y-4">
                {branchData.map((b) => (
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Commission Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">Commission report data will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
