import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Heart, 
  Utensils, 
  Send, 
  DollarSign, 
  Settings, 
  LogOut,
  Upload,
  Link2,
  UserPlus,
  ClipboardCheck,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CricketIcon } from "@/components/ui/cricket-icon";
import { queryClient } from "@/lib/queryClient";

// Add Firebase type to window
declare global {
  interface Window {
    firebase?: {
      auth: () => {
        signOut: () => Promise<void>;
      };
    };
  }
}

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const handleLogout = () => {
    // EMERGENCY FIX: Just redirect to auth page immediately
    try {
      // Set a flag in localStorage that we'll check on page load
      window.localStorage.setItem('force_logout', 'true');
      
      // Force redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error("Fallback logout error:", error);
      // Just redirect anyway
      window.location.href = '/auth';
    }
  };
  
  // Base nav items for admins/coaches
  const adminNavItems = [
    { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, path: "/" },
    { label: "Team Management", icon: <Users className="h-5 w-5" />, path: "/players" },
    { label: "Schedule", icon: <Calendar className="h-5 w-5" />, path: "/schedule" },
    { label: "Fitness Tracking", icon: <Heart className="h-5 w-5" />, path: "/fitness" },
    { label: "Meal Plans", icon: <Utensils className="h-5 w-5" />, path: "/meal-plans" },
    { label: "Announcements", icon: <Send className="h-5 w-5" />, path: "/announcements" },
    { label: "Payments", icon: <DollarSign className="h-5 w-5" />, path: "/payments" },
    { label: "Settings", icon: <Settings className="h-5 w-5" />, path: "/settings" },
  ];

  // Parent nav items
  const parentNavItems = [
    { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, path: "/parent" },
    { label: "Schedule", icon: <Calendar className="h-5 w-5" />, path: "/parent/schedule" },
    { label: "Fitness Tracking", icon: <Heart className="h-5 w-5" />, path: "/parent/fitness" },
    { label: "Meal Plans", icon: <Utensils className="h-5 w-5" />, path: "/parent/meal-plans" },
    { label: "Announcements", icon: <Send className="h-5 w-5" />, path: "/parent/announcements" },
    { label: "Connect Child", icon: <Link2 className="h-5 w-5" />, path: "/parent/connect-child" },
    { label: "Payments", icon: <DollarSign className="h-5 w-5" />, path: "/parent/payments" },
    { label: "My Profile", icon: <UserPlus className="h-5 w-5" />, path: "/profile" },
  ];
  
  // Admin/Coach specific items
  const adminItems = [
    { label: "Import Data", icon: <Upload className="h-5 w-5" />, path: "/import-data" },
    { label: "Manage Connections", icon: <UserPlus className="h-5 w-5" />, path: "/manage-connections" },
    { label: "Pending Players", icon: <ClipboardCheck className="h-5 w-5" />, path: "/players-pending-review" },
  ];
  
  // Admin-only items
  const adminOnlyItems = [
    { label: "Coach Approvals", icon: <UserCheck className="h-5 w-5" />, path: "/coaches-pending-approval" },
  ];
  
  // Final nav items based on user role
  const navItems = user?.role === "parent" 
    ? parentNavItems 
    : [...adminNavItems, ...adminItems, ...(user?.role === "admin" ? adminOnlyItems : [])];
  
  return (
    <aside className="flex flex-col h-full bg-white shadow-md z-10 w-64">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary heading">Legacy Cricket</span>
          <CricketIcon className="h-6 w-6 text-accent" />
        </div>
        <p className="text-gray-600 text-sm mt-1">
          {user?.role === "parent" ? "Parent Portal" : "Coach Dashboard"}
        </p>
      </div>
      
      {/* Coach Profile */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/profile" className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
          <Avatar>
            {user?.profileImage ? (
              <AvatarImage src={user.profileImage} alt={user?.fullName || "User"} />
            ) : null}
            <AvatarFallback>{user?.fullName ? getInitials(user.fullName) : "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="text-sm font-semibold">{user?.fullName || "User"}</h4>
            <p className="text-xs text-gray-600">{user?.role === "coach" ? "Head Coach" : user?.role === "admin" ? "Administrator" : "Parent"}</p>
          </div>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path} 
            className={`flex items-center space-x-3 p-2 rounded-lg font-medium ${
              isActive(item.path) 
                ? "bg-primary text-white" 
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      
      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-5 w-5 mr-2" />
          <span>{logoutMutation.isPending ? "Signing Out..." : "Sign Out"}</span>
        </Button>
      </div>
    </aside>
  );
}
