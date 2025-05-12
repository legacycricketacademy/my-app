import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SimpleLogoutButton() {
  const handleSimpleLogout = () => {
    // NUCLEAR OPTION - bypass all logic and just set direct values
    try {
      // 1. Clear all cookies forcefully
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
      });
      
      // 2. Use a stronger cookie deletion approach for alternative paths
      const cookieNames = document.cookie.match(/[^ =;]+(?==)/g) || [];
      cookieNames.forEach(name => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname}`;
      });
      
      // 3. Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // 4. Set various flags to ensure logout state
      localStorage.setItem('emergency_logout', Date.now().toString());
      
      // 5. Try server-side logout in fire-and-forget mode
      fetch("/api/logout", {
        method: "POST", 
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      }).catch(() => { /* ignore */ });
      
      // 6. Force immediate redirect
      window.location.href = "/auth?logout=" + Date.now();
    } catch (error) {
      console.error("Absolute last resort logout error:", error);
      // Just redirect anyway as a last resort
      window.location.href = "/auth";
    }
  };

  return (
    <Button
      variant="destructive"
      className="w-full justify-start px-2"
      onClick={handleSimpleLogout}
    >
      <LogOut className="h-5 w-5 mr-2" />
      <span>Force Sign Out</span>
    </Button>
  );
}