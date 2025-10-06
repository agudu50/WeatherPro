"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function OrdersPage() {
  const orders = [
    {
      id: "ORD-001",
      customer: "John Doe",
      amount: "$299.00",
      status: "Completed",
      date: "2024-01-15",
    },
    {
      id: "ORD-002", 
      customer: "Jane Smith",
      amount: "$199.00",
      status: "Processing",
      date: "2024-01-16",
    },
    {
      id: "ORD-003",
      customer: "Bob Johnson", 
      amount: "$399.00",
      status: "Shipped",
      date: "2024-01-17",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "default"
      case "processing": return "secondary"  
      case "shipped": return "outline"
      default: return "secondary"
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage and track customer orders
          </p>
        </div>
        <Button>Create Order</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            A list of recent customer orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.amount}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}