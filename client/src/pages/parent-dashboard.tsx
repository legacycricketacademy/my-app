import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { SummaryCard } from "@/components/parent/SummaryCard";
import { Schedule } from "@/components/parent/Schedule";
import { Fitness } from "@/components/parent/Fitness";
import { MealPlan } from "@/components/parent/MealPlan";
import { Performance } from "@/components/parent/Performance";
import { ChatBox } from "@/components/parent/ChatBox";
import { Separator } from "@/components/ui/separator";
import { ParentLayout } from "@/layout/parent-layout";

export default function ParentDashboard() {
  const { user } = useAuth();
  const [currentDate] = useState(new Date());

  return (
    <ParentLayout title="Dashboard">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.fullName || 'Parent'}</h1>
        <p className="text-muted-foreground">
          {format(currentDate, "EEEE, MMMM d, yyyy")} | Academy Dashboard
        </p>
      </div>

      <Separator className="my-6" />
      
      {/* Summary Cards Section */}
      <div className="mb-8">
        <SummaryCard />
      </div>
      
      {/* Two Column Grid for Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Schedule />
        <Fitness />
      </div>
      
      {/* Two Column Grid for Secondary Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <MealPlan />
        <Performance />
      </div>
      
      {/* Chat Section */}
      <div className="mb-8">
        <ChatBox />
      </div>
    </ParentLayout>
  );
}