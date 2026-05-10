import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "../ui/card";

interface Props {
  data: Array<Record<string, string | number>>;
}

export function ProgressChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Score trend</h2>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Line type="monotone" dataKey="dsa_score" stroke="#f97316" strokeWidth={2} />
            <Line type="monotone" dataKey="hld_score" stroke="#0d9488" strokeWidth={2} />
            <Line type="monotone" dataKey="lld_score" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

