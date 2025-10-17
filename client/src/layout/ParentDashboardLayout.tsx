import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/session";
import { 
  Home, 
  Calendar, 
  Bell, 
  Users,
  DollarSign,
  User,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { cn } from "@/lib/utils";

export function ParentDashboardLayout() {
  const location = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const navigation = [
    { name: "Dashboard", href: "/dashboard/parent", icon: Home },
    { name: "Schedule", href: "/parent/schedule", icon: Calendar },
    { name: "Announcements", href: "/parent/announcements", icon: Bell },
    { name: "Connect Child", href: "/parent/connect-child", icon: Users },
    { name: "Payments", href: "/parent/payments", icon: DollarSign },
    { name: "My Profile", href: "/parent/profile", icon: User },
  ];
  
  const Logo = () => (
    <Link to="/dashboard/parent">
      <div className="flex items-center gap-2 font-bold text-xl text-primary cursor-pointer">
        <span className="bg-primary text-white p-1 rounded">
          🏏
        </span>
        <span>Legacy Cricket</span>
      </div>
    </Link>
  );
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6">
          <Logo />
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link key={item.name} to={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary hover:bg-primary/15" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile */}
        <div className="border-t p-4">
          {user && (
            <div className="mb-4">
              <Link to="/parent/profile" className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                <Avatar className="h-8 w-8">
                  {user.profileImage ? (
                    <AvatarImage src={user.profileImage} alt={user.fullName || "User"} />
                  ) : null}
                  <AvatarFallback>
                    {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.fullName || 'Parent'}</p>
                  <p className="text-xs text-gray-500">Parent Portal</p>
                </div>
              </Link>
            </div>
          )}
          <Button 
            variant="outline" 
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Parent Portal</h1>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
