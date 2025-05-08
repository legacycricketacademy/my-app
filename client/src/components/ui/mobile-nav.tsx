import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  MoreHorizontal,
  Bell,
  UserCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    return location === path || location.startsWith(path);
  };
  
  // Parent-specific navigation
  if (user?.role === "parent") {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-10">
        <div className="flex items-center justify-around">
          <Link href="/parent">
            <div className={`flex flex-col items-center py-2 px-3 ${isActive('/parent') && !isActive('/parent/schedule') && !isActive('/parent/announcements') && !isActive('/parent/connect-child') && !isActive('/profile') ? 'text-primary' : 'text-gray-600'}`}>
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-xs mt-1">Dashboard</span>
            </div>
          </Link>
          
          <Link href="/parent/schedule">
            <div className={`flex flex-col items-center py-2 px-3 ${isActive('/parent/schedule') ? 'text-primary' : 'text-gray-600'}`}>
              <Calendar className="h-5 w-5" />
              <span className="text-xs mt-1">Schedule</span>
            </div>
          </Link>
          
          <Link href="/parent/announcements">
            <div className={`flex flex-col items-center py-2 px-3 ${isActive('/parent/announcements') ? 'text-primary' : 'text-gray-600'}`}>
              <Bell className="h-5 w-5" />
              <span className="text-xs mt-1">Updates</span>
            </div>
          </Link>
          
          <Link href="/profile">
            <div className={`flex flex-col items-center py-2 px-3 ${isActive('/profile') ? 'text-primary' : 'text-gray-600'}`}>
              <UserCircle className="h-5 w-5" />
              <span className="text-xs mt-1">Profile</span>
            </div>
          </Link>
        </div>
      </nav>
    );
  }
  
  // Admin/Coach navigation (default)
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-10">
      <div className="flex items-center justify-around">
        <Link href="/">
          <div className={`flex flex-col items-center py-2 px-3 ${isActive('/') && !isActive('/players') && !isActive('/schedule') && !isActive('/payments') ? 'text-primary' : 'text-gray-600'}`}>
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-xs mt-1">Dashboard</span>
          </div>
        </Link>
        
        <Link href="/players">
          <div className={`flex flex-col items-center py-2 px-3 ${isActive('/players') ? 'text-primary' : 'text-gray-600'}`}>
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Players</span>
          </div>
        </Link>
        
        <Link href="/schedule">
          <div className={`flex flex-col items-center py-2 px-3 ${isActive('/schedule') ? 'text-primary' : 'text-gray-600'}`}>
            <Calendar className="h-5 w-5" />
            <span className="text-xs mt-1">Schedule</span>
          </div>
        </Link>
        
        <Link href="/payments">
          <div className={`flex flex-col items-center py-2 px-3 ${isActive('/payments') ? 'text-primary' : 'text-gray-600'}`}>
            <DollarSign className="h-5 w-5" />
            <span className="text-xs mt-1">Payments</span>
          </div>
        </Link>
        
        <Link href="/more">
          <div className={`flex flex-col items-center py-2 px-3 ${
            isActive('/fitness') || 
            isActive('/meal-plans') || 
            isActive('/announcements') || 
            isActive('/settings') ||
            isActive('/profile') ||
            isActive('/players-pending-review') ? 'text-primary' : 'text-gray-600'
          }`}>
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-xs mt-1">More</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
