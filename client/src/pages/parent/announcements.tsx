import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Megaphone, Calendar, Users, Eye, Search, Info } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";

export default function ParentAnnouncementsPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Fetch announcements
  const { data: announcementsData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/parent/announcements"],
    queryFn: () => fetch("/api/parent/announcements").then(res => res.json())
  });
  
  // Safe array handling with logging for debugging
  const announcements = Array.isArray(announcementsData) ? announcementsData : [];
  if (!Array.isArray(announcementsData)) {
    console.log('DEBUG: announcements data is not an array:', typeof announcementsData, announcementsData);
  }
  
  // Format date for display
  const formatAnnouncementDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const exactDate = format(date, "MMM d, yyyy");
      const relativeDate = formatDistanceToNow(date, { addSuffix: true });
      
      return {
        exact: exactDate,
        relative: relativeDate
      };
    } catch (error) {
      return {
        exact: "Unknown date",
        relative: "Unknown"
      };
    }
  };
  
  // Format target groups for display
  const formatTargetGroups = (groups: string[]) => {
    if (!groups || groups.length === 0) return "Unknown";
    if (groups.includes("All")) return "All Parents";
    return groups.join(", ");
  };
  
  // Filter announcements based on search and tab
  const filteredAnnouncements = announcements?.filter(announcement => {
    // Apply tab filter
    if (activeTab !== "all") {
      if (!announcement.targetGroups?.includes(activeTab)) {
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
  
  // Get announcement border class based on index
  const getAnnouncementBorderClass = (index: number) => {
    if (index % 3 === 0) return "border-primary bg-primary/5";
    if (index % 3 === 1) return "border-warning bg-warning/5";
    return "border-accent bg-accent/5";
  };

  return (
    <div className="space-y-6">
        {/* Header and search */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <h1 className="text-2xl font-bold">Announcements</h1>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Filter tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Under 12s">Under 12s</TabsTrigger>
            <TabsTrigger value="Under 14s">Under 14s</TabsTrigger>
            <TabsTrigger value="Under 16s">Under 16s</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Announcements list */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="border-l-4 border-gray-200">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full mb-1.5" />
                  <Skeleton className="h-4 w-full mb-1.5" />
                  <Skeleton className="h-4 w-2/3 mb-3" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredAnnouncements && filteredAnnouncements.length > 0 ? (
            // Announcement cards
            filteredAnnouncements.map((announcement, index) => {
              const dateInfo = formatAnnouncementDate(announcement.createdAt);
              return (
                <Card 
                  key={announcement.id} 
                  className={`border-l-4 ${getAnnouncementBorderClass(index)}`}
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h3 className="text-lg font-semibold">{announcement.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {dateInfo.relative}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{announcement.content}</p>
                    
                    <div className="flex flex-wrap gap-y-2 justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{dateInfo.exact}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          <span>Sent to: {formatTargetGroups(announcement.targetGroups)}</span>
                        </span>
                        {announcement.viewCount !== undefined && (
                          <span className="flex items-center text-secondary">
                            <Eye className="h-3 w-3 mr-1" />
                            <span>{announcement.viewCount} viewed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            // Empty state
            <Card>
              <CardContent className="p-10 text-center">
                <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Announcements Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? "No announcements match your search criteria."
                    : "There are no announcements for you at this time."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
    </div>
  );
}