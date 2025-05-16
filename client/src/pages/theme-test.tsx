import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/theme-provider";

export default function ThemeTestPage() {
  const { theme } = useTheme();
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Theme Test Page</h1>
        <ThemeToggle />
      </div>
      
      <div className="p-6 bg-card rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Current Theme: {theme}</h2>
        <p className="mb-4">
          This page demonstrates the theme switching functionality. You can toggle between light, dark, and system preference.
        </p>
        <div className="flex gap-4 flex-wrap">
          <Button variant="default">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="destructive">Destructive Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-card rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Light Mode Features</h3>
          <p className="text-muted-foreground">
            Light mode is optimized for daytime viewing with high contrast between text and background.
          </p>
        </div>
        
        <div className="p-6 bg-card rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Dark Mode Features</h3>
          <p className="text-muted-foreground">
            Dark mode reduces eye strain in low-light environments and can save battery life on OLED displays.
          </p>
        </div>
      </div>
      
      <div className="p-6 bg-muted rounded-lg">
        <h3 className="text-xl font-semibold mb-3">System Preference</h3>
        <p className="text-muted-foreground">
          When set to "System", the theme will automatically match your device's theme preference. 
          Try changing your system settings to see this in action.
        </p>
      </div>
    </div>
  );
}