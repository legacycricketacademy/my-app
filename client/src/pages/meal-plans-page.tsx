import { useState } from "react";
import { MainLayout } from "@/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Utensils, Calendar, Plus, Download, Send, Info, Sun, Coffee, Apple, UtensilsCrossed } from "lucide-react";
import { format } from "date-fns";

export default function MealPlansPage() {
  const [ageGroup, setAgeGroup] = useState<string>("Under 12s");
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday
  
  const { data: mealPlans, isLoading } = useQuery<any[]>({
    queryKey: ["/api/meal-plans/age-group", ageGroup],
    queryFn: () => fetch(`/api/meal-plans/age-group/${ageGroup}`).then(res => res.json())
  });
  
  const currentMealPlan = mealPlans?.[0]; // Most recent meal plan
  
  const { data: mealItems, isLoading: isLoadingItems } = useQuery<any>({
    queryKey: ["/api/meal-plans", currentMealPlan?.id],
    queryFn: () => currentMealPlan ? fetch(`/api/meal-plans/${currentMealPlan.id}`).then(res => res.json()) : null,
    enabled: !!currentMealPlan
  });
  
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const getMealsByDay = (day: number) => {
    if (!mealItems?.items || !Array.isArray(mealItems.items)) return [];
    return mealItems.items.filter(item => item.dayOfWeek === day);
  };
  
  const selectedDayMeals = getMealsByDay(selectedDay);
  
  const getMealIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return <Sun className="h-5 w-5 text-secondary" />;
      case 'lunch':
        return <Coffee className="h-5 w-5 text-primary" />;
      case 'snack':
      case 'pre-training snack':
        return <Apple className="h-5 w-5 text-info" />;
      case 'dinner':
        return <UtensilsCrossed className="h-5 w-5 text-accent" />;
      default:
        return <Utensils className="h-5 w-5 text-primary" />;
    }
  };
  
  const getMealIconBg = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return 'bg-secondary/10';
      case 'lunch':
        return 'bg-primary/10';
      case 'snack':
      case 'pre-training snack':
        return 'bg-info/10';
      case 'dinner':
        return 'bg-accent/10';
      default:
        return 'bg-primary/10';
    }
  };

  return (
    <MainLayout title="Meal Plans">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 heading">Meal Plans</h1>
            <p className="text-gray-600">Nutrition plans and meal schedules</p>
          </div>
          
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Create New Plan</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg heading">Age Groups</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Button 
                    variant={ageGroup === "Under 12s" ? "default" : "outline"} 
                    className="w-full justify-start"
                    onClick={() => setAgeGroup("Under 12s")}
                  >
                    Under 12s
                  </Button>
                  <Button 
                    variant={ageGroup === "Under 14s" ? "default" : "outline"} 
                    className="w-full justify-start"
                    onClick={() => setAgeGroup("Under 14s")}
                  >
                    Under 14s
                  </Button>
                  <Button 
                    variant={ageGroup === "Under 16s" ? "default" : "outline"} 
                    className="w-full justify-start"
                    onClick={() => setAgeGroup("Under 16s")}
                  >
                    Under 16s
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg heading flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Available Plans
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {Array(3).fill(0).map((_, index) => (
                      <div key={index} className="h-10 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                ) : mealPlans && mealPlans.length > 0 ? (
                  <div className="space-y-2">
                    {mealPlans.map((plan) => (
                      <div key={plan.id} className="border rounded p-2 text-sm">
                        <div className="font-medium">{plan.title}</div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(plan.weekStartDate), "MMM d")} - {format(new Date(plan.weekEndDate), "MMM d, yyyy")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    <p>No meal plans for this age group</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Plus className="h-4 w-4 mr-1" />
                      Create Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg heading flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Nutrition Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 text-sm">
                  <div className="bg-secondary/5 p-3 rounded border-l-2 border-secondary">
                    <h4 className="font-medium">Hydration is Key</h4>
                    <p className="text-gray-600">Players should drink water before, during, and after training.</p>
                  </div>
                  <div className="bg-primary/5 p-3 rounded border-l-2 border-primary">
                    <h4 className="font-medium">Pre-Game Nutrition</h4>
                    <p className="text-gray-600">Eat 2-3 hours before matches. Focus on complex carbs.</p>
                  </div>
                  <div className="bg-accent/5 p-3 rounded border-l-2 border-accent">
                    <h4 className="font-medium">Recovery Foods</h4>
                    <p className="text-gray-600">Consume protein within 30 minutes after intense activity.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-lg heading flex items-center">
                    <Utensils className="h-5 w-5 mr-2" />
                    {currentMealPlan?.title || "Weekly Meal Plan"}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-primary border-primary">
                      <Download className="h-4 w-4 mr-1" />
                      Download Plan
                    </Button>
                    <Button size="sm">
                      <Send className="h-4 w-4 mr-1" />
                      Share with Parents
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <div className="border-b border-gray-200">
                <Tabs defaultValue={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
                  <TabsList className="w-full justify-start p-0 bg-transparent border-0 h-auto overflow-x-auto flex">
                    {dayNames.map((day, index) => (
                      <TabsTrigger 
                        key={index}
                        value={index.toString()}
                        className="py-3 px-5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none data-[state=active]:shadow-none"
                      >
                        {day}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              
              <CardContent className="p-6">
                {isLoading || isLoadingItems ? (
                  <div className="space-y-6 animate-pulse">
                    {Array(4).fill(0).map((_, index) => (
                      <div key={index}>
                        <div className="flex items-center mb-2">
                          <div className="h-10 w-10 bg-gray-200 rounded-full mr-2"></div>
                          <div className="h-5 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="pl-12 space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                          <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedDayMeals && selectedDayMeals.length > 0 ? (
                  <div className="space-y-8">
                    {selectedDayMeals.map((meal) => (
                      <div key={meal.id}>
                        <div className="flex items-center mb-3">
                          <div className={`h-12 w-12 ${getMealIconBg(meal.mealType)} rounded-full flex items-center justify-center mr-3`}>
                            {getMealIcon(meal.mealType)}
                          </div>
                          <h3 className="font-medium text-lg heading">{meal.mealType}</h3>
                        </div>
                        <div className="ml-15 pl-15">
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 ml-16">
                            <ul className="space-y-2">
                              {meal.items?.map((item: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-primary mr-2">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                            
                            {meal.notes && (
                              <div className="mt-4 bg-secondary/5 p-3 rounded-md text-sm flex items-start">
                                <Info className="h-4 w-4 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                                <p className="text-gray-700">{meal.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Utensils className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Meals Planned</h3>
                    <p className="text-gray-500 mb-4">There are no meals planned for {dayNames[selectedDay]}</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Meal for {dayNames[selectedDay]}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
