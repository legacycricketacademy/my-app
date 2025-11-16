import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Trash2, RefreshCw, Inbox, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SandboxEmail {
  timestamp: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  type: string;
}

interface EmailsResponse {
  success: boolean;
  count: number;
  emails: SandboxEmail[];
}

export default function EmailMailbox() {
  const queryClient = useQueryClient();
  const [selectedEmail, setSelectedEmail] = useState<SandboxEmail | null>(null);
  const [viewMode, setViewMode] = useState<'text' | 'html'>('html');

  const { data, isLoading, error, refetch } = useQuery<EmailsResponse>({
    queryKey: ["/api/dev/test-emails"],
    queryFn: () => api.get("/dev/test-emails"),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const clearMutation = useMutation({
    mutationFn: () => api.delete("/dev/test-emails"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/test-emails"] });
      setSelectedEmail(null);
    },
  });

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all emails?")) {
      clearMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading emails...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load emails. Make sure EMAIL_SANDBOX=true is set in your .env.local file.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const emails = data?.emails || [];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="h-8 w-8" />
              Email Sandbox
            </h1>
            <p className="text-muted-foreground mt-1">
              Development email capture - all emails sent in dev mode appear here
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClear}
              disabled={emails.length === 0 || clearMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Inbox
              </span>
              <Badge variant="secondary">{emails.length}</Badge>
            </CardTitle>
            <CardDescription>
              Captured emails from registration and other flows
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {emails.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No emails captured yet</p>
                <p className="text-sm mt-1">
                  Register a new user to see emails here
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {emails.map((email, index) => (
                  <button
                    key={index}
                    data-email-item
                    onClick={() => setSelectedEmail(email)}
                    className={`w-full text-left p-4 hover:bg-accent transition-colors ${
                      selectedEmail === email ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {email.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(email.timestamp), 'HH:mm')}
                      </span>
                    </div>
                    <p className="font-medium text-sm truncate">{email.subject}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      To: {email.to}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Email Preview</CardTitle>
              {selectedEmail && (
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'html' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('html')}
                  >
                    HTML
                  </Button>
                  <Button
                    variant={viewMode === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('text')}
                  >
                    Text
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedEmail ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Select an email to preview</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">From:</span>
                    <span className="text-sm text-muted-foreground">
                      noreply@cricketacademy.com
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">To:</span>
                    <span className="text-sm text-muted-foreground">{selectedEmail.to}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Subject:</span>
                    <span className="text-sm text-muted-foreground">{selectedEmail.subject}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Type:</span>
                    <Badge variant="outline">{selectedEmail.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Time:</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(selectedEmail.timestamp), 'PPpp')}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="border rounded-lg p-4 bg-muted/30 min-h-[400px]">
                  {viewMode === 'html' && selectedEmail.html ? (
                    <iframe
                      srcDoc={selectedEmail.html}
                      className="w-full h-[400px] border-0"
                      title="Email HTML Preview"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {selectedEmail.body}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
