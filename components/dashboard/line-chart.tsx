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
  TooltipProps,
  Area
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
    <Card className="p-3 shadow-lg !border-primary/20">
      <p className="text-sm font-medium text-primary mb-1">{label}</p>
      <p className="text-lg font-semibold">
        {payload[0].value.toFixed(1)}h <span className="text-xs text-muted-foreground">study time</span>
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
        <defs>
          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="5 5" 
          vertical={false} 
          stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
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
        <Area
          type="monotone"
          dataKey="hours"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          fillOpacity={1}
          fill="url(#colorHours)"
        />
        <Line
          type="monotone"
          dataKey="hours"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          dot={false}
          activeDot={{
            r: 8,
            style: {
              fill: "hsl(var(--primary))",
              stroke: "var(--background)",
              strokeWidth: 3,
            },
          }}
          isAnimationActive={true}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
