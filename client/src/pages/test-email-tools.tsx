import React, { useState } from "react";
import { MainLayout } from "@/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function TestEmailTools() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<any>(null);
  
  // Template test email state
  const [templateType, setTemplateType] = useState("verification");
  const [templateName, setTemplateName] = useState("Test User");
  const [templateEmail, setTemplateEmail] = useState("");
  
  // View template state
  const [viewTemplateType, setViewTemplateType] = useState("verification");
  const [viewTemplateName, setViewTemplateName] = useState("Test User");
  const [viewTemplateResult, setViewTemplateResult] = useState<any>(null);
  const [viewTemplateLoading, setViewTemplateLoading] = useState(false);
  
  // Custom test email state
  const [customEmail, setCustomEmail] = useState("");
  const [customSubject, setCustomSubject] = useState("Test Email");
  const [customText, setCustomText] = useState("This is a test email.");
  
  const sendTemplateEmail = async () => {
    if (!templateEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to send to",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/test-email", {
        email: templateEmail,
        template: templateType,
        name: templateName,
      });
      
      const data = await res.json();
      setEmailResult(data);
      
      if (res.ok) {
        toast({
          title: "Email Sent",
          description: `Successfully sent ${templateType} test email to ${templateEmail}`,
        });
      } else {
        toast({
          title: "Failed to Send Email",
          description: data.message || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const sendCustomEmail = async () => {
    if (!customEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to send to",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/test-email", {
        email: customEmail,
        subject: customSubject,
        text: customText,
      });
      
      const data = await res.json();
      setEmailResult(data);
      
      if (res.ok) {
        toast({
          title: "Email Sent",
          description: `Successfully sent custom test email to ${customEmail}`,
        });
      } else {
        toast({
          title: "Failed to Send Email",
          description: data.message || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const viewTemplate = async () => {
    setViewTemplateLoading(true);
    try {
      const res = await apiRequest("GET", `/api/test-email-templates?type=${viewTemplateType}&name=${encodeURIComponent(viewTemplateName)}`);
      
      const data = await res.json();
      setViewTemplateResult(data);
      
      if (!res.ok) {
        toast({
          title: "Failed to Get Template",
          description: data.message || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setViewTemplateLoading(false);
    }
  };
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    });
  };
  
  return (
    <MainLayout title="Email Testing Tools">
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Email Testing Tools</h1>
        
        <Tabs defaultValue="send">
          <TabsList className="mb-6">
            <TabsTrigger value="send">Send Test Emails</TabsTrigger>
            <TabsTrigger value="view">View Email Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="send">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Template Email Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Template Email</CardTitle>
                  <CardDescription>
                    Send a test email using a predefined template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-type">Template Type</Label>
                    <Select
                      value={templateType}
                      onValueChange={setTemplateType}
                    >
                      <SelectTrigger id="template-type">
                        <SelectValue placeholder="Select template type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verification">Email Verification</SelectItem>
                        <SelectItem value="coach-approval-pending">Coach Pending Approval</SelectItem>
                        <SelectItem value="coach-approved">Coach Approved</SelectItem>
                        <SelectItem value="admin-notification">Admin Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Name</Label>
                    <Input
                      id="template-name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Name used in the email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-email">Email Address</Label>
                    <Input
                      id="template-email"
                      type="email"
                      value={templateEmail}
                      onChange={(e) => setTemplateEmail(e.target.value)}
                      placeholder="Where to send the test email"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={sendTemplateEmail} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Template Email
                  </Button>
                </CardFooter>
              </Card>

              {/* Custom Email Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Custom Email</CardTitle>
                  <CardDescription>
                    Send a test email with custom content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-email">Email Address</Label>
                    <Input
                      id="custom-email"
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="Where to send the test email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="custom-subject">Subject</Label>
                    <Input
                      id="custom-subject"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="Email subject"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="custom-text">Message</Label>
                    <textarea
                      id="custom-text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="w-full min-h-[100px] p-2 border rounded"
                      placeholder="Email content"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={sendCustomEmail} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Custom Email
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Result Display */}
            {emailResult && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Email Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify(emailResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="view">
            <Card>
              <CardHeader>
                <CardTitle>View Email Template</CardTitle>
                <CardDescription>
                  Preview email templates without sending them
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="view-template-type">Template Type</Label>
                    <Select
                      value={viewTemplateType}
                      onValueChange={setViewTemplateType}
                    >
                      <SelectTrigger id="view-template-type">
                        <SelectValue placeholder="Select template type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verification">Email Verification</SelectItem>
                        <SelectItem value="coach-approval-pending">Coach Pending Approval</SelectItem>
                        <SelectItem value="coach-approved">Coach Approved</SelectItem>
                        <SelectItem value="admin-notification">Admin Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="view-template-name">Name</Label>
                    <Input
                      id="view-template-name"
                      value={viewTemplateName}
                      onChange={(e) => setViewTemplateName(e.target.value)}
                      placeholder="Name used in the email"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={viewTemplate} 
                  disabled={viewTemplateLoading}
                >
                  {viewTemplateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Template
                </Button>
              </CardContent>
            </Card>
            
            {/* Template Preview */}
            {viewTemplateResult && (
              <div className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Template Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <div className="mb-4">
                        <Label className="block mb-1">Subject</Label>
                        <div className="bg-muted p-2 rounded flex justify-between items-center">
                          <span>{viewTemplateResult.template.subject}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(viewTemplateResult.template.subject)}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                      
                      {viewTemplateResult.template.testLink && (
                        <div className="mb-4">
                          <Label className="block mb-1">Test Link</Label>
                          <div className="bg-muted p-2 rounded flex justify-between items-center overflow-hidden">
                            <span className="truncate">{viewTemplateResult.template.testLink}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyToClipboard(viewTemplateResult.template.testLink)}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>HTML Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded p-4 bg-white">
                      <div dangerouslySetInnerHTML={{ __html: viewTemplateResult.template.html }} />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Plain Text Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded whitespace-pre-wrap">
                      {viewTemplateResult.template.text}
                    </pre>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Raw Template Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded overflow-auto">
                      {JSON.stringify(viewTemplateResult, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}