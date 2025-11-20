import { useEffect, useState } from "react";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

type Row = { 
  id?: number | string; 
  sessionId: string | number; 
  date?: string; 
  title?: string; 
  status: "yes" | "no" | "" 
};

export default function ParentAvailability() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const parentId = "parent-1"; // replace with real user id from auth provider in your app

  useEffect(() => {
    (async () => {
      try {
        // sessions list (reuse existing endpoint)
        const sessions = await fetch("/api/sessions").then(r => r.json()).catch(() => []);
        const avail = await fetch(`/api/availability?parentId=${parentId}`).then(r => r.json()).catch(() => []);
        const mapped = (Array.isArray(sessions) ? sessions : []).slice(0, 8).map((s: any) => ({
          sessionId: s.id,
          date: s.startTime,
          title: s.title,
          status: (avail.find((a: any) => a.sessionId === s.id)?.status) || ""
        }));
        setRows(mapped);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function setStatus(sessionId: any, status: "yes" | "no") {
    await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, sessionId, status })
    });
    setRows(rs => rs.map(r => r.sessionId === sessionId ? { ...r, status } : r));
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch {
      return dateString.slice(0, 16);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full max-w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-6 md:py-8 overflow-x-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-gray-700 font-medium">Loading sessions...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-6 md:py-8 overflow-x-hidden">
      <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="heading-parent-availability">
              Session Availability
            </h1>
          </div>
          <p className="text-sm md:text-base text-gray-600">
            Let us know if you can attend upcoming sessions
          </p>
        </div>

        {/* Sessions List */}
        {rows.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No upcoming sessions available</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4" data-testid="list-availability">
            {rows.map(r => (
              <div
                key={r.sessionId}
                className="bg-white rounded-lg md:rounded-xl shadow-md p-4 md:p-5 border border-gray-200"
              >
                <div className="flex flex-col gap-3">
                  {/* Session Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-base md:text-lg text-gray-900 mb-1">
                      {r.title || 'Session'}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="h-3 w-3 md:h-4 md:w-4" />
                      {formatDate(r.date)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setStatus(r.sessionId, "yes")}
                      variant={r.status === 'yes' ? 'default' : 'outline'}
                      size="sm"
                      className={`flex-1 sm:flex-none ${r.status === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50'}`}
                      data-testid={`avail-yes-${r.sessionId}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Coming
                    </Button>
                    <Button
                      onClick={() => setStatus(r.sessionId, "no")}
                      variant={r.status === 'no' ? 'default' : 'outline'}
                      size="sm"
                      className={`flex-1 sm:flex-none ${r.status === 'no' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50'}`}
                      data-testid={`avail-no-${r.sessionId}`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Can't Attend
                    </Button>
                    {r.status && (
                      <Button
                        onClick={() => setRows(rs => rs.map(row => row.sessionId === r.sessionId ? { ...row, status: "" } : row))}
                        variant="ghost"
                        size="sm"
                        className="flex-1 sm:flex-none text-gray-600"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
