"use client"

import { useTheme } from "next-themes"
import { Card } from "@/components/ui/card"
import { Calendar as CalendarIcon } from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DayContent } from "react-day-picker"

interface Task {
  id: number
  title: string
  date: Date
  type: "assignment" | "quiz" | "project"
}

interface CalendarProps {
  tasks: Task[]
}

export function TaskCalendar({ tasks }: CalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const { theme: applicationTheme } = useTheme()
  const isDark = applicationTheme === "dark"

  // Get tasks for the selected date
  const selectedDateTasks = tasks.filter((task) => 
    date && format(task.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
  )

  // Get all dates with tasks for highlighting
  const taskDates = tasks.map((task) => format(task.date, "yyyy-MM-dd"))

  return (
    <div className="grid gap-4">
      <Card className="p-3">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="w-full"
          modifiers={{
            booked: (date: Date) => taskDates.includes(format(date, "yyyy-MM-dd")),
          }}
          modifiersStyles={{
            booked: {
              fontWeight: "700",
              color: "hsl(var(--primary))",
              backgroundColor: isDark ? "hsl(var(--primary)/0.1)" : "hsl(var(--primary)/0.1)",
            }
          }}
          components={{
            DayContent: ({ date: dayDate }: { date: Date }) => (
              <div className="relative">
                {dayDate.getDate()}
                {taskDates.includes(format(dayDate, "yyyy-MM-dd")) && (
                  <div className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </div>
            ),
          }}
        />
      </Card>
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">{date ? format(date, "MMMM d, yyyy") : ""}</h3>
          <Button variant="outline" className="h-8 text-xs">
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            Add Task
          </Button>
        </div>
        <ScrollArea className="h-[200px]">
          {selectedDateTasks.length > 0 ? (
            <div className="space-y-3">
              {selectedDateTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:border-primary/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge variant="outline" className="text-[10px]">
                        {task.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Due {format(task.date, "h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[160px] items-center justify-center text-sm text-muted-foreground">
              No tasks scheduled for this date
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  )
}
