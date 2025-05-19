import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, Coffee, UtensilsCrossed } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types for meal plan data
interface MealPlanItem {
  id: string;
  meal: string;
  description: string;
  time: string;
  calories: number;
  proteins: number;
  carbs: number;
}

interface DailyMealPlan {
  day: string;
  date: string;
  meals: MealPlanItem[];
}

export function MealPlan() {
  const { user } = useAuth();
  
  // Fetch meal plan data
  const { data: mealPlanData, isLoading } = useQuery({
    queryKey: ["/api/meal-plans/current"],
    queryFn: () => fetch("/api/meal-plans/current").then(res => res.json()),
    enabled: !!user,
  });

  // Sample meal plan data (use real data when API is ready)
  const sampleMealPlan: DailyMealPlan[] = [
    {
      day: "Monday",
      date: "2025-05-19",
      meals: [
        {
          id: "1",
          meal: "Breakfast",
          description: "Oatmeal with fruits and nuts, 1 boiled egg",
          time: "7:00 AM",
          calories: 450,
          proteins: 20,
          carbs: 60
        },
        {
          id: "2",
          meal: "Lunch",
          description: "Grilled chicken salad with quinoa",
          time: "12:30 PM",
          calories: 550,
          proteins: 35,
          carbs: 45
        },
        {
          id: "3",
          meal: "Dinner",
          description: "Baked salmon with steamed vegetables",
          time: "7:00 PM",
          calories: 580,
          proteins: 40,
          carbs: 30
        }
      ]
    },
    {
      day: "Tuesday",
      date: "2025-05-20",
      meals: [
        {
          id: "4",
          meal: "Breakfast",
          description: "Banana smoothie with protein powder",
          time: "7:00 AM",
          calories: 380,
          proteins: 25,
          carbs: 50
        },
        {
          id: "5",
          meal: "Lunch",
          description: "Turkey and avocado wrap with vegetables",
          time: "12:30 PM",
          calories: 520,
          proteins: 30,
          carbs: 40
        },
        {
          id: "6",
          meal: "Dinner",
          description: "Whole grain pasta with lean beef sauce",
          time: "7:00 PM",
          calories: 600,
          proteins: 35,
          carbs: 70
        }
      ]
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Meal Plan</CardTitle>
          <CardDescription>
            Nutrition plan to support cricket performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-full mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use real data or fallback to sample data
  const mealPlans = mealPlanData?.days || sampleMealPlan;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Weekly Meal Plan</CardTitle>
            <CardDescription>
              Nutrition plan to support cricket performance
            </CardDescription>
          </div>
          <Link href="/parent/meal-plans">
            <Button variant="outline" size="sm">View Full Plan</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={mealPlans[0]?.day.toLowerCase()}>
          <TabsList className="mb-4">
            {mealPlans.map((day) => (
              <TabsTrigger key={day.day} value={day.day.toLowerCase()}>
                {day.day}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {mealPlans.map((day) => (
            <TabsContent key={day.day} value={day.day.toLowerCase()}>
              <div className="space-y-4">
                {day.meals.map((meal) => (
                  <div key={meal.id} className="p-4 border rounded-md hover:bg-accent hover:border-accent transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        {meal.meal === "Breakfast" && <Coffee className="h-5 w-5 text-primary" />}
                        {meal.meal === "Lunch" && <UtensilsCrossed className="h-5 w-5 text-primary" />}
                        {meal.meal === "Dinner" && <Apple className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-md">{meal.meal} <span className="text-sm font-normal text-muted-foreground">({meal.time})</span></h4>
                            <p className="text-sm text-muted-foreground mt-1">{meal.description}</p>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">{meal.calories} cal</div>
                            <div className="text-muted-foreground">P: {meal.proteins}g | C: {meal.carbs}g</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}