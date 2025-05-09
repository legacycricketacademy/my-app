import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  Calendar, 
  Heart, 
  Bell, 
  Utensils, 
  LogOut, 
  Menu, 
  X, 
  User,
  Users,
  Link as LinkIcon,
  DollarSign
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ParentLayoutProps {
  children: ReactNode;
  title?: string;
}

export function ParentLayout({ 
  children,
  title = "Dashboard"
}: ParentLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useMobile();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navigation = [
    { name: "Dashboard", href: "/parent", icon: Home },
    { name: "Schedule", href: "/parent/schedule", icon: Calendar },
    { name: "Announcements", href: "/parent/announcements", icon: Bell },
    { name: "Connect Child", href: "/parent/connect-child", icon: Users },
    { name: "Payments", href: "/parent/payments", icon: DollarSign },
    { name: "My Profile", href: "/profile", icon: User },
  ];
  
  const Logo = () => (
    <Link href="/">
      <div className="flex items-center gap-2 font-bold text-xl text-primary cursor-pointer">
        <span className="bg-primary text-white p-1 rounded">
          🏏
        </span>
        <span>Legacy Cricket</span>
      </div>
    </Link>
  );
  
  const Sidebar = () => (
    <div className="w-64 bg-card border-r h-full flex flex-col">
      <div className="p-6">
        <Logo />
      </div>
      <div className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
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
      </div>
      <div className="border-t p-4">
        {user && (
          <div className="flex items-center gap-2 mb-4">
            <Avatar>
              <AvatarImage src={user.profileImage || ""} />
              <AvatarFallback>
                {user.fullName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2 justify-start text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
  
  const MobileSidebar = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
  
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b bg-card h-14 flex items-center px-4 gap-4">
          <MobileSidebar />
          
          <div className="md:hidden">
            <Logo />
          </div>
          
          <div className="flex-1 md:flex items-center">
            <h1 className="text-lg font-semibold hidden md:block">{title}</h1>
          </div>

          {/* Notification Dropdown */}
          <NotificationDropdown />
          
          <Button variant="ghost" size="icon" asChild className="md:hidden">
            <Link href="/profile">
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Link>
          </Button>
        </header>
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}