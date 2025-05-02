import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export function AnnouncementsCard() {
  const { data: announcements, isLoading } = useQuery<any[]>({
    queryKey: ["/api/announcements/recent"],
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
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "Unknown date";
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="flex items-center justify-between border-b border-gray-200 p-4">
        <CardTitle className="font-semibold text-lg heading">Announcements</CardTitle>
        <Button size="sm">
          New Announcement
        </Button>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, index) => (
            <div key={index} className="border-l-4 border-gray-200 bg-gray-50 p-3 rounded-r animate-pulse">
              <div className="flex justify-between items-start mb-2">
                <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-100 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-100 rounded w-full mb-3"></div>
              <div className="h-3 bg-gray-100 rounded w-1/3"></div>
            </div>
          ))
        ) : announcements && announcements.length > 0 ? (
          announcements.map((announcement, index) => (
            <div key={announcement.id} className={`border-l-4 ${getAnnouncementBorderClass(index)} p-3 rounded-r`}>
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-800">{announcement.title}</h4>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {formatCreatedAt(announcement.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">
                  Sent to: {formatTargetGroups(announcement.targetGroups)}
                </span>
                <div className="flex items-center text-xs text-secondary">
                  <Eye className="h-3 w-3 mr-1" />
                  <span>32/38 viewed</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p>No announcements available</p>
          </div>
        )}
        
        {announcements && announcements.length > 0 && (
          <div className="mt-3 text-center">
            <Link href="/announcements" className="text-primary text-sm hover:underline flex items-center justify-center">
              <span>View All Announcements</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
