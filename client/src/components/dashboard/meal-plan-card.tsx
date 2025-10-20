import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sun, CupSoda, UtensilsCrossed, Download, Send } from "lucide-react";
import { Link } from "react-router-dom";

export function MealPlanCard() {
  const [ageGroup, setAgeGroup] = useState<string>("Under 12s");
  const [selectedDay, setSelectedDay] = useState<number>(1); // 1 = Monday

  const { data: mealPlansData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/meal-plans/age-group", ageGroup],
    queryFn: () => fetch(`/api/meal-plans/age-group/${ageGroup}`).then(res => res.json())
  });

  // Safe array handling with logging for debugging
  const mealPlans = Array.isArray(mealPlansData) ? mealPlansData : [];
  if (!Array.isArray(mealPlansData)) {
    console.log('DEBUG: mealPlans data is not an array:', typeof mealPlansData, mealPlansData);
  }

  const currentMealPlan = mealPlans?.[0]; // Most recent meal plan

  const { data: mealItemsData, isLoading: isLoadingItems } = useQuery<any[]>({
    queryKey: ["/api/meal-plans", currentMealPlan?.id],
    queryFn: () => currentMealPlan ? fetch(`/api/meal-plans/${currentMealPlan.id}`).then(res => res.json()) : null,
    enabled: !!currentMealPlan
  });

  // Safe array handling for meal items
  const mealItems = Array.isArray(mealItemsData) ? mealItemsData : [];
  if (!Array.isArray(mealItemsData)) {
    console.log('DEBUG: mealItems data is not an array:', typeof mealItemsData, mealItemsData);
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getMealsByDay = (day: number) => {
    if (!mealItems?.items) return [];
    const items = Array.isArray(mealItems.items) ? mealItems.items : [];
    return items.filter(item => item.dayOfWeek === day);
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
    <Card className="bg-white rounded-lg shadow-sm border border-gray-100 w-full max-w-full overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 p-4">
        <CardTitle className="font-semibold text-lg heading">Weekly Meal Plan</CardTitle>
        <Select value={ageGroup} onValueChange={setAgeGroup}>
          <SelectTrigger className="text-sm bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary h-8 w-32">
            <SelectValue placeholder="Select age group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Under 12s">Under 12s</SelectItem>
            <SelectItem value="Under 14s">Under 14s</SelectItem>
            <SelectItem value="Under 16s">Under 16s</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent className="p-4 overflow-hidden">
        {/* Day selector tabs */}
        <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-100 pb-3 mb-4">
          {dayNames.map((day, index) => (
            <button
              key={index}
              className={`min-w-[60px] text-center py-2 px-2 text-sm font-medium transition-colors rounded-t-md ${
                selectedDay === index 
                  ? "text-primary border-b-2 border-primary bg-primary/5" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
              <div key={meal.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                <div className="flex items-center mb-3">
                  <div className={`h-8 w-8 ${getMealIconBg(meal.mealType)} rounded-full flex items-center justify-center mr-3`}>
                    {getMealIcon(meal.mealType)}
                  </div>
                  <h4 className="font-medium text-gray-800">{meal.mealType}</h4>
                </div>
                <div className="pl-11">
                  {meal.items?.map((item: string, index: number) => (
                    <p key={index} className="text-sm text-gray-600 mb-1">• {item}</p>
                  ))}
                  {meal.notes && (
                    <div className="mt-2 text-xs text-blue-600 flex items-center bg-blue-50 p-2 rounded">
                      <span className="mr-1">ℹ️</span>
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
        
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="border-primary text-primary flex-1 min-w-0">
            <Download className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate text-xs">Download</span>
          </Button>
          <Button size="sm" className="bg-primary text-white flex-1 min-w-0">
            <Send className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate text-xs">Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
