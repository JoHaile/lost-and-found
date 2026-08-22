"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ClockIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatetimePickerProps {
  name: string;
  id?: string;
  placeholder?: string;
  "aria-invalid"?: boolean;
}

function combine(date: Date, hours: number, minutes: number): Date {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function DatetimePicker({
  name,
  id,
  placeholder = "Pick a date & time",
  ...props
}: DatetimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<Date | undefined>(undefined);

  const handleSelectDay = (day: Date | undefined) => {
    if (!day) return;
    const now = new Date();
    setValue(
      combine(
        day,
        value ? value.getHours() : now.getHours(),
        value ? value.getMinutes() : now.getMinutes(),
      ),
    );
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = event.target.value.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return;
    setValue(combine(value ?? new Date(), hours, minutes));
  };

  return (
    <>
      <input
        type="hidden"
        name={name}
        value={value ? format(value, "yyyy-MM-dd'T'HH:mm") : ""}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              id={id}
              variant="outline"
              className={cn(
                "w-full justify-start px-3 font-normal",
                !value && "text-muted-foreground",
              )}
              {...props}
            >
              <CalendarIcon className="size-4 opacity-60" />
              {value
                ? `${format(value, "EEE, MMM d, yyyy")} · ${format(value, "h:mm a")}`
                : placeholder}
            </Button>
          }
        />
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelectDay}
            disabled={{ after: new Date() }}
          />
          <div className="flex items-center gap-2 border-t px-3 py-2.5">
            <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
            <Input
              type="time"
              value={value ? format(value, "HH:mm") : ""}
              onChange={handleTimeChange}
              aria-label="Time"
              className="flex-1 bg-transparent"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={!value}
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
