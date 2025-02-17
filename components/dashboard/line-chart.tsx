import { Card } from "@/components/ui/card"
import { useTheme } from "next-themes"
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  TooltipProps
} from "recharts"

interface DataPoint {
  date: string
  hours: number
}

interface LineChartProps {
  data: DataPoint[]
}

type CustomTooltipProps = {
  active?: boolean
  payload?: {
    value: number
    dataKey: string
    payload: DataPoint
  }[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <Card className="p-2 !border-primary/50">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">
        {payload[0].value.toFixed(1)} hours
      </p>
    </Card>
  )
}

export function LineChart({ data }: LineChartProps) {
  const { theme: applicationTheme } = useTheme()
  const isDark = applicationTheme === "dark"

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart 
        data={data} 
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false} 
          stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
          horizontal
        />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fill: isDark ? "#888" : "#444" }}
          tickMargin={8}
          padding={{ left: 10 }}
          dy={10}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: isDark ? "#888" : "#444" }}
          tickMargin={8}
          tickFormatter={(value: number) => `${value}h`}
          width={40}
          dx={-10}
        />
        <Tooltip
          content={(props) => <CustomTooltip {...props as CustomTooltipProps} />}
          cursor={{
            strokeWidth: 1,
            stroke: "hsl(var(--primary))"
          }}
        />
        <Line
          type="monotone"
          dataKey="hours"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{
            r: 6,
            style: {
              fill: "hsl(var(--primary))",
              stroke: "var(--background)",
              strokeWidth: 2,
            },
          }}
          isAnimationActive={true}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}