import * as React from "react"
import { useState } from "react"
import { format } from "date-fns"
import { DayPicker } from "react-day-picker"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  disabled?: boolean
  fromYear?: number
  toYear?: number
  disableFutureDates?: boolean
}

export function DatePicker({ 
  date, 
  setDate, 
  disabled = false,
  fromYear = 1990,
  toYear = new Date().getFullYear(),
  disableFutureDates = false
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | undefined>(date);
  
  // Function to handle date selection with validation
  const handleSelect = (selectedDate: Date | undefined) => {
    // If no date is selected, reset temp date
    if (!selectedDate) {
      setTempSelectedDate(undefined);
      return;
    }
    
    // Ensure we always have a valid Date object
    const validDate = new Date(selectedDate.toISOString().split('T')[0]);
    
    // Check if valid date before setting
    if (validDate instanceof Date && !isNaN(validDate.getTime())) {
      setTempSelectedDate(validDate);
      
      // Auto-confirm on mobile
      if (window.innerWidth < 640) {
        confirmDate(validDate);
      }
    }
  };
  
  const confirmDate = (selectedDate?: Date) => {
    const dateToConfirm = selectedDate || tempSelectedDate;
    if (dateToConfirm && dateToConfirm instanceof Date && !isNaN(dateToConfirm.getTime())) {
      setDate(dateToConfirm);
    } else if (dateToConfirm === undefined) {
      setDate(undefined);
    }
    setOpen(false);
  };
  
  const cancelSelection = () => {
    setTempSelectedDate(date);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[85vw] sm:w-auto p-0 relative z-50" align="center" side="bottom" sideOffset={5}>
        <div className="flex flex-col">
          <div className="sticky top-0 z-10 bg-background p-2 border-b flex items-center justify-between">
            <div className="text-sm font-medium">
              Select Date
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelSelection}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => confirmDate()}
              >
                OK
              </Button>
            </div>
          </div>
          <div className="overflow-auto p-1" style={{ maxHeight: '60vh' }}>
            <DayPicker
              mode="single"
              selected={tempSelectedDate}
              onSelect={handleSelect}
              captionLayout="dropdown"
              fromYear={fromYear}
              toYear={toYear}
              disabled={disableFutureDates ? (date) => date > new Date() : undefined}
              className="p-3"
              styles={{
                caption: { display: "flex", justifyContent: "center", alignItems: "center" },
                caption_dropdowns: { display: "flex", justifyContent: "center", gap: "1rem" }
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}