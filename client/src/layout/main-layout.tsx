import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [searchFocused, setSearchFocused] = useState(false);
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            {/* Mobile Menu Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>
            
            {/* Page Title (mobile only) */}
            <div className="md:hidden flex items-center">
              <span className="text-xl font-bold text-primary heading">Legacy Cricket Academy</span>
            </div>
            
            {/* Search (shown on larger screens) */}
            <div className="hidden md:flex items-center flex-1 mx-4">
              <div className="relative w-full max-w-md">
                <input 
                  type="text" 
                  placeholder="Search players, schedules, etc." 
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                <Search className={`absolute left-3 top-2.5 h-5 w-5 ${searchFocused ? 'text-primary' : 'text-gray-500'}`} />
              </div>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-accent text-white text-xs flex items-center justify-center">3</span>
              </Button>
              
              <div className="relative md:hidden">
                <Avatar>
                  <AvatarImage src={user?.profileImage} alt={user?.fullName || "User"} />
                  <AvatarFallback>{user?.fullName ? getInitials(user.fullName) : "U"}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
          
          {/* Mobile Search - Collapsible */}
          <div className="p-2 md:hidden border-t border-gray-200">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search players, schedules, etc." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <Search className={`absolute left-3 top-2.5 h-5 w-5 ${searchFocused ? 'text-primary' : 'text-gray-500'}`} />
            </div>
          </div>
        </header>
        
        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNav />}
    </div>
  );
}
