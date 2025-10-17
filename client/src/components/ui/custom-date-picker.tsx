import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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
  includeTime?: boolean;
  displayFormat?: string;
}

export function CustomDatePicker({
  value,
  onChange,
  disabled = false,
  includeTime = false,
  displayFormat = "PPP",
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | undefined>(value);
  
  // Update the temporary date when the value prop changes
  useEffect(() => {
    setTempSelectedDate(value);
  }, [value]);

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      // Preserve the time if a date was already selected
      const newDate = new Date(date);
      if (tempSelectedDate) {
        newDate.setHours(tempSelectedDate.getHours());
        newDate.setMinutes(tempSelectedDate.getMinutes());
      }
      setTempSelectedDate(newDate);
    } else {
      setTempSelectedDate(undefined);
    }
  };

  const handleTimeChange = (timeString: string) => {
    if (timeString && tempSelectedDate) {
      const [hours, minutes] = timeString.split(':').map(Number);
      const newDate = new Date(tempSelectedDate);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setTempSelectedDate(newDate);
    }
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
            {value ? format(value, includeTime ? "PPP HH:mm" : displayFormat) : 
              <span>Select a date{includeTime ? " & time" : ""}</span>}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[85vw] sm:w-auto p-0 z-[60]" align="center" side="bottom" sideOffset={5}>
        <div className="flex flex-col">
          <div className="sticky top-0 z-10 bg-background p-2 border-b flex items-center justify-between">
            {includeTime && tempSelectedDate ? (
              <Input
                type="time"
                size={10}
                className="w-24"
                value={tempSelectedDate ? format(tempSelectedDate, "HH:mm") : ""}
                onChange={(e) => handleTimeChange(e.target.value)}
                disabled={disabled}
              />
            ) : (
              <div className="text-sm font-medium">
                Select {includeTime ? "Date & Time" : "Date"}
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
              >
                OK
              </Button>
            </div>
          </div>
          <div className="overflow-auto p-1" style={{ maxHeight: '60vh' }}>
            <Calendar
              mode="single"
              selected={tempSelectedDate}
              onSelect={(date) => {
                handleCalendarSelect(date);
                // Only auto-close on mobile after selection if time is not required
                if (window.innerWidth < 640 && !includeTime) {
                  handleConfirm();
                }
              }}
              disabled={disabled}
              initialFocus
              className="rounded-md border"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}