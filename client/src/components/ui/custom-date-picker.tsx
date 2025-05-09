import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormControl } from "@/components/ui/form";

interface CustomDatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
}

export function CustomDatePicker({
  value,
  onChange,
  disabled = false,
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | undefined>(value);
  
  // Update the temporary date when the value prop changes
  useEffect(() => {
    setTempSelectedDate(value);
  }, [value]);

  const handleCalendarSelect = (date: Date | undefined) => {
    // Instead of immediately triggering onChange, store the date temporarily
    console.log("Selected date:", date);
    setTempSelectedDate(date);
  };

  const handleConfirm = () => {
    // Only when the user confirms, pass the date to the actual onChange handler
    onChange(tempSelectedDate);
    setOpen(false);
  };

  const handleCancel = () => {
    // Reset temp selection to current value and close
    setTempSelectedDate(value);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            className={cn(
              "w-full pl-3 text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {value ? format(value, "PPP") : <span>Select a date</span>}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="space-y-2">
          <Calendar
            mode="single"
            selected={tempSelectedDate}
            onSelect={handleCalendarSelect}
            disabled={disabled}
            initialFocus
          />
          <div className="flex justify-end gap-2 p-3 pt-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleConfirm}
              className="bg-primary text-white hover:bg-primary/90"
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}