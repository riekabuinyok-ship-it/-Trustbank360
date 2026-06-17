"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Users2, Search, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { verificationStatusColors, riskLevelColors } from "@/lib/permissions"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import toast from "react-hot-toast"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ fullName: "", phone: "", nationality: "", idType: "", idNumber: "" })

  useEffect(() => {
    fetch(`/api/customers${search ? `?q=${search}` : ""}`)
      .then((r) => r.json()).then(setCustomers).finally(() => setLoading(false))
  }, [search])

  async function createCustomer() {
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      })
      if (res.ok) {
        toast.success("Customer created")
        setDialogOpen(false)
        setNewCustomer({ fullName: "", phone: "", nationality: "", idType: "", idNumber: "" })
        fetch(`/api/customers`).then((r) => r.json()).then(setCustomers)
      }
    } catch {
      toast.error("Failed to create customer")
    }
  }

  const columns: ColumnDef<any>[] = [
    { accessorKey: "fullName", header: "Name" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "nationality", header: "Nationality" },
    { accessorKey: "idType", header: "ID Type" },
    { accessorKey: "idNumber", header: "ID Number" },
    { accessorKey: "_count.transfersAsSender", header: "Transactions" },
    {
      accessorKey: "verificationStatus",
      header: "KYC",
      cell: ({ row }) => <Badge className={verificationStatusColors[row.original.verificationStatus]}>{row.original.verificationStatus}</Badge>,
    },
    {
      accessorKey: "riskLevel",
      header: "Risk",
      cell: ({ row }) => <Badge className={riskLevelColors[row.original.riskLevel]}>{row.original.riskLevel}</Badge>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Customer database</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Customers</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, phone, ID..." className="pl-9 w-80" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={customers} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Enter customer details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={newCustomer.fullName} onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input value={newCustomer.nationality} onChange={(e) => setNewCustomer({ ...newCustomer, nationality: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>ID Type</Label>
                <Select value={newCustomer.idType} onValueChange={(v) => setNewCustomer({ ...newCustomer, idType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                    <SelectItem value="PASSPORT">Passport</SelectItem>
                    <SelectItem value="DRIVER_LICENSE">Driver License</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>ID Number</Label>
              <Input value={newCustomer.idNumber} onChange={(e) => setNewCustomer({ ...newCustomer, idNumber: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={createCustomer}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
