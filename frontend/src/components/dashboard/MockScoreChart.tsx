import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MockFeedback } from "../../types";
import { Card, CardContent, CardHeader } from "../ui/card";

interface Props {
  mocks: MockFeedback[];
}

export function MockScoreChart({ mocks }: Props) {
  const data = mocks.map((mock) => ({ name: `Mock ${mock.mock_number}`, score: (mock.dsa_score + mock.hld_score + mock.lld_score + mock.behavioral_score) / 4 }));
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Mock scores</h2>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Bar dataKey="score" fill="#0f9f7a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

