import * as React from "react"
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
}

export function DatePicker({ date, setDate }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <DayPicker
          mode="single"
          selected={date}
          onSelect={setDate}
          captionLayout="dropdown"
          fromYear={1990}
          toYear={new Date().getFullYear()}
          disabled={(date) => date > new Date()}
          className="p-3"
          styles={{
            caption: { display: "flex", justifyContent: "center", alignItems: "center" },
            caption_dropdowns: { display: "flex", justifyContent: "center", gap: "1rem" }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}