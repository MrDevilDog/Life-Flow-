"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RequestRow = {
  id: number | string;
  patient_name: string;
  blood_group: string;
  units: number;
  hospital: string;
  city: string;
  urgency: "low" | "medium" | "high";
  status: "active" | "fulfilled" | "cancelled";
  created_at?: string;
};

export function AdminBloodRequests() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/requests", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as RequestRow[];
        if (isMounted) setRows(data);
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Incoming Blood Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="space-y-4">
            {rows.length === 0 ? (
              <p>No requests found.</p>
            ) : (
              rows.slice(0, 50).map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{r.patient_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {r.hospital} - {r.city}
                      </p>
                      <p className="text-sm">
                        Blood group: <span className="font-medium">{r.blood_group}</span>{" "}
                        | Units: <span className="font-medium">{r.units}</span>
                      </p>
                    </div>
                    <Badge variant="secondary">{r.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

