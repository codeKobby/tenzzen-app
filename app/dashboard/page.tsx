"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bell,
  Plus,
  BarChart2,
  Clock,
  GraduationCap,
  Target,
  Award,
} from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { LineChart } from "@/components/dashboard/line-chart"
import { useState } from "react"

const stats = [
  {
    label: "Learning Hours",
    value: "32.5h",
    icon: Clock,
    change: { value: "2.1h", positive: true }
  },
  {
    label: "Courses",
    value: "5",
    icon: GraduationCap
  },
  {
    label: "Completion",
    value: "85%",
    icon: Target,
    change: { value: "5%", positive: true }
  },
  {
    label: "Achievements",
    value: "12",
    icon: Award
  }
]

const generateActivityData = (days: number) => {
  const data = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      hours: Math.random() * 5 + 1
    })
  }

  return data
}

export default function DashboardPage() {
  const [timeRange] = useState("week")
  const activityData = generateActivityData(7)

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Welcome back, Alex</h1>
            <p className="text-muted-foreground">
              Track your progress and continue learning
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button className="shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              New Course
            </Button>
            <Button variant="outline" size="icon" className="relative shadow">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                3
              </span>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Learning Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <StatsCard key={stat.label} {...stat} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Graph */}
        <Card className="border-2">
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>Learning Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Hours spent learning
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <LineChart data={activityData} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}