import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Jan", uses: 0, earnings: 0 },
  { name: "Feb", uses: 0, earnings: 0 },
  { name: "Mar", uses: 0, earnings: 0 },
  { name: "Apr", uses: 0, earnings: 0 },
  { name: "May", uses: 0, earnings: 0 },
  { name: "Jun", uses: 0, earnings: 0 },
  { name: "Jul", uses: 0, earnings: 0 },
];

export function UsageChart() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-lg font-semibold">Usage Overview</h3>
          <p className="text-sm text-muted-foreground">Voice generation activity</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Uses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span className="text-sm text-muted-foreground">Earnings</span>
          </div>
        </div>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="usesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(270, 60%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(270, 60%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(215, 20%, 55%)"
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
            />
            <YAxis 
              stroke="hsl(215, 20%, 55%)"
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 8%)',
                border: '1px solid hsl(222, 30%, 18%)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
            />
            <Area
              type="monotone"
              dataKey="uses"
              stroke="hsl(187, 100%, 50%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#usesGradient)"
            />
            <Area
              type="monotone"
              dataKey="earnings"
              stroke="hsl(270, 60%, 50%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#earningsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
