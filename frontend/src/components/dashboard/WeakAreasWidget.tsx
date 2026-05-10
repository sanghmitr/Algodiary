import type { WeakArea } from "../../types";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";

interface Props {
  areas: WeakArea[];
}

export function WeakAreasWidget({ areas }: Props) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Weak areas</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {areas.slice(0, 5).map((area) => (
          <div key={area.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{area.topic}</p>
              <p className="text-xs text-slate-500">{area.category}</p>
            </div>
            <Badge tone={area.severity === "fixed" ? "green" : area.severity === "improving" ? "gold" : "red"}>{area.severity}</Badge>
          </div>
        ))}
        {!areas.length ? <p className="text-sm text-slate-500">No weak areas logged.</p> : null}
      </CardContent>
    </Card>
  );
}

