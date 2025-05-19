import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, Coffee, UtensilsCrossed, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { mealPlanData } from "@/data";

// Types for meal plan data
interface MealPlanItem {
  id: string;
  meal: string;
  description: string;
  time: string;
  calories: number;
  proteins: number;
  carbs: number;
  consumed?: boolean;
}

interface DailyMealPlan {
  day: string;
  date: string;
  meals: MealPlanItem[];
}

export function MealPlan() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mealPlans, setMealPlans] = useState<DailyMealPlan[]>(mealPlanData);
  
  // Function to handle meal consumed toggle
  const handleMealConsumed = (dayIndex: number, mealId: string) => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const updatedMealPlans = [...mealPlans];
      const dayMeals = updatedMealPlans[dayIndex].meals;
      
      const mealIndex = dayMeals.findIndex(meal => meal.id === mealId);
      if (mealIndex !== -1) {
        dayMeals[mealIndex].consumed = !dayMeals[mealIndex].consumed;
      }
      
      setMealPlans(updatedMealPlans);
      setLoading(false);
    }, 300);
  };

  if (loading && mealPlans.length === 0) {
    return (
      <Card className="bg-white shadow-md rounded-lg">
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

  return (
    <Card className="bg-white shadow-md rounded-lg">
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
          
          {mealPlans.map((day, dayIndex) => (
            <TabsContent key={day.day} value={day.day.toLowerCase()}>
              <div className="space-y-4">
                {day.meals.map((meal) => (
                  <div 
                    key={meal.id} 
                    className={`p-4 border rounded-md hover:bg-accent hover:border-accent transition-colors ${
                      meal.consumed ? 'bg-secondary/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        {meal.meal === "Breakfast" && <Coffee className="h-5 w-5 text-primary" />}
                        {meal.meal === "Lunch" && <UtensilsCrossed className="h-5 w-5 text-primary" />}
                        {meal.meal === "Dinner" && <Apple className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-md">{meal.meal}</h4>
                              <span className="text-sm font-normal text-muted-foreground">({meal.time})</span>
                              {meal.consumed && <Check className="h-4 w-4 text-green-500" />}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{meal.description}</p>
                            
                            <div className="flex items-center gap-2 mt-3">
                              <Checkbox 
                                id={`meal-${meal.id}`} 
                                checked={meal.consumed}
                                onCheckedChange={() => handleMealConsumed(dayIndex, meal.id)}
                                disabled={loading}
                              />
                              <label 
                                htmlFor={`meal-${meal.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Mark as consumed
                              </label>
                            </div>
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