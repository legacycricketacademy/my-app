import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sun, CupSoda, UtensilsCrossed, Download, Send } from "lucide-react";
import { Link } from "wouter";

export function MealPlanCard() {
  const [ageGroup, setAgeGroup] = useState<string>("Under 12s");
  const [selectedDay, setSelectedDay] = useState<number>(1); // 1 = Monday

  const { data: mealPlans, isLoading } = useQuery<any[]>({
    queryKey: ["/api/meal-plans/age-group", ageGroup],
    queryFn: () => fetch(`/api/meal-plans/age-group/${ageGroup}`).then(res => res.json())
  });

  const currentMealPlan = mealPlans?.[0]; // Most recent meal plan

  const { data: mealItems, isLoading: isLoadingItems } = useQuery<any[]>({
    queryKey: ["/api/meal-plans", currentMealPlan?.id],
    queryFn: () => currentMealPlan ? fetch(`/api/meal-plans/${currentMealPlan.id}`).then(res => res.json()) : null,
    enabled: !!currentMealPlan
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getMealsByDay = (day: number) => {
    if (!mealItems?.items) return [];
    return mealItems.items.filter(item => item.dayOfWeek === day);
  };

  const selectedDayMeals = getMealsByDay(selectedDay);

  const getMealIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return <Sun className="text-secondary" />;
      case 'pre-training snack':
        return <CupSoda className="text-primary" />;
      case 'dinner':
      default:
        return <UtensilsCrossed className="text-accent" />;
    }
  };

  const getMealIconBg = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return 'bg-secondary/10';
      case 'pre-training snack':
        return 'bg-primary/10';
      case 'dinner':
      default:
        return 'bg-accent/10';
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="flex items-center justify-between border-b border-gray-200 p-4">
        <CardTitle className="font-semibold text-lg heading">Weekly Meal Plan</CardTitle>
        <Select value={ageGroup} onValueChange={setAgeGroup}>
          <SelectTrigger className="text-sm bg-gray-100 border-0 focus:ring-1 focus:ring-primary h-8 w-32">
            <SelectValue placeholder="Select age group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Under 12s">Under 12s</SelectItem>
            <SelectItem value="Under 14s">Under 14s</SelectItem>
            <SelectItem value="Under 16s">Under 16s</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Day selector tabs */}
        <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 pb-2 mb-4">
          {dayNames.map((day, index) => (
            <button
              key={index}
              className={`min-w-[80px] text-center py-2 px-3 text-sm font-medium ${
                selectedDay === index 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setSelectedDay(index)}
            >
              {day}
            </button>
          ))}
        </div>
        
        {/* Meal plan for selected day */}
        <div className="space-y-4">
          {isLoading || isLoadingItems ? (
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 bg-gray-200 rounded-full mr-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="pl-10 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                </div>
              </div>
            ))
          ) : selectedDayMeals && selectedDayMeals.length > 0 ? (
            selectedDayMeals.map((meal) => (
              <div key={meal.id}>
                <div className="flex items-center mb-2">
                  <div className={`h-8 w-8 ${getMealIconBg(meal.mealType)} rounded-full flex items-center justify-center mr-2`}>
                    {getMealIcon(meal.mealType)}
                  </div>
                  <h4 className="font-medium text-gray-800">{meal.mealType}</h4>
                </div>
                <div className="pl-10">
                  {meal.items?.map((item: string, index: number) => (
                    <p key={index} className="text-sm text-gray-600">• {item}</p>
                  ))}
                  {meal.notes && (
                    <div className="mt-1 text-xs text-secondary flex items-center">
                      <span className="i-ri-information-line mr-1">ⓘ</span>
                      <span>{meal.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>No meal plan available for this day</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-between">
          <Button variant="outline" size="sm" className="border-primary text-primary">
            <Download className="h-4 w-4 mr-1" />
            <span>Download Plan</span>
          </Button>
          <Button size="sm" className="bg-primary text-white">
            <Send className="h-4 w-4 mr-1" />
            <span>Share with Parents</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
