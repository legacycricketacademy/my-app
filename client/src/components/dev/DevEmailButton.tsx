import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface EmailsResponse {
  success: boolean;
  count: number;
}

export function DevEmailButton() {
  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const { data } = useQuery<EmailsResponse>({
    queryKey: ["/api/dev/test-emails"],
    queryFn: () => api.get("/dev/test-emails"),
    refetchInterval: 5000,
    retry: false,
  });

  const emailCount = data?.count || 0;

  return (
    <Link to="/dev/emails">
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 shadow-lg z-50 gap-2"
      >
        <Mail className="h-4 w-4" />
        <span>Dev Emails</span>
        {emailCount > 0 && (
          <Badge variant="destructive" className="ml-1">
            {emailCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}
