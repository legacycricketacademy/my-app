import { useState } from "react";
import { MainLayout } from "@/layout/main-layout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Megaphone, Eye, Clock, Users, Calendar, Search, Filter } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function AnnouncementsPage() {
  const [tab, setTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isNewAnnouncementOpen, setIsNewAnnouncementOpen] = useState<boolean>(false);
  
  const { data: announcements, isLoading } = useQuery<any[]>({
    queryKey: ["/api/announcements/recent", 100], // Fetch up to 100 announcements
    queryFn: () => fetch("/api/announcements/recent?limit=100").then(res => res.json())
  });
  
  const filteredAnnouncements = announcements?.filter(announcement => {
    // Apply tab filter
    if (tab !== "all") {
      if (!announcement.targetGroups?.includes(tab)) {
        return false;
      }
    }
    
    // Apply search filter
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      return (
        announcement.title.toLowerCase().includes(lowerSearch) ||
        announcement.content.toLowerCase().includes(lowerSearch)
      );
    }
    
    return true;
  });
  
  const getAnnouncementBorderClass = (index: number) => {
    if (index % 3 === 0) return "border-primary bg-primary/5";
    if (index % 3 === 1) return "border-warning bg-warning/5";
    return "border-accent bg-accent/5";
  };
  
  const formatTargetGroups = (groups: string[]) => {
    if (!groups || groups.length === 0) return "Unknown";
    if (groups.includes("All")) return "All Parents";
    return groups.join(", ");
  };
  
  const formatCreatedAt = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        exact: format(date, "MMM d, yyyy 'at' h:mm a")
      };
    } catch (e) {
      return {
        relative: "Unknown date",
        exact: "Unknown date"
      };
    }
  };

  return (
    <MainLayout title="Announcements">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 heading">Announcements</h1>
            <p className="text-gray-600">Create and manage parent communications</p>
          </div>
          
          <Dialog open={isNewAnnouncementOpen} onOpenChange={setIsNewAnnouncementOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>New Announcement</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>
                  Create an announcement to send to parents. You can target specific age groups or send to all parents.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="title" className="text-sm font-medium">Title</label>
                  <Input id="title" placeholder="Enter announcement title" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="content" className="text-sm font-medium">Content</label>
                  <Textarea id="content" placeholder="Enter announcement content" rows={5} />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="target" className="text-sm font-medium">Target Groups</label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">Under 12s</Button>
                    <Button variant="outline" size="sm">Under 14s</Button>
                    <Button variant="outline" size="sm">Under 16s</Button>
                    <Button variant="default" size="sm">All Parents</Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewAnnouncementOpen(false)}>Cancel</Button>
                <Button type="submit">Send Announcement</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-lg shadow">
          <div className="relative flex-1">
            <Input
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
          </div>
          
          <Tabs value={tab} onValueChange={setTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="Under 12s">Under 12s</TabsTrigger>
              <TabsTrigger value="Under 14s">Under 14s</TabsTrigger>
              <TabsTrigger value="Under 16s">Under 16s</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Announcements List */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg heading flex items-center">
              <Megaphone className="h-5 w-5 mr-2" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="border-l-4 border-gray-200 p-3 rounded-r animate-pulse">
                    <div className="flex justify-between items-start mb-2">
                      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-100 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-gray-100 rounded w-full mb-3"></div>
                    <div className="h-4 bg-gray-100 rounded w-2/3 mb-3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-3 bg-gray-100 rounded w-28"></div>
                      <div className="h-3 bg-gray-100 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAnnouncements && filteredAnnouncements.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredAnnouncements.map((announcement, index) => {
                  const dateInfo = formatCreatedAt(announcement.createdAt);
                  
                  return (
                    <div key={announcement.id} className={`p-5 ${getAnnouncementBorderClass(index)} border-l-4`}>
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg">{announcement.title}</h3>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {dateInfo.relative}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-700 whitespace-pre-line">{announcement.content}</p>
                      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
                        <div className="flex items-center mb-2 sm:mb-0">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{dateInfo.exact}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            <span>Sent to: {formatTargetGroups(announcement.targetGroups)}</span>
                          </span>
                          <span className="flex items-center text-secondary">
                            <Eye className="h-3 w-3 mr-1" />
                            <span>32/38 viewed</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-end">
                        <Button variant="outline" size="sm">
                          Resend
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center">
                <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Announcements Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? "No announcements match your search criteria." 
                    : "There are no announcements yet."}
                </p>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Create First Announcement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
