// client/src/components/DateField.tsx
import React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateFieldProps {
  value?: Date | null;
  onChange: (d: Date | null) => void;
  placeholder?: string;
  id?: string;
  'aria-label'?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
}

export default function DateField({
  value,
  onChange,
  placeholder = 'Pick a date',
  id,
  'aria-label': ariaLabel,
  minDate,
  maxDate,
  disabled,
  className,
}: DateFieldProps) {
  return (
    <ReactDatePicker
      id={id}
      selected={value ?? null}
      onChange={(d) => onChange(d as Date | null)}
      placeholderText={placeholder}
      maxDate={maxDate}
      minDate={minDate}
      disabled={disabled}
      showPopperArrow={false}
      popperPlacement="bottom-start"
      shouldCloseOnScroll={false}
      portalId="app-date-portal"
      withPortal
      popperClassName="z-[9999]"
      calendarClassName="z-[9999]"
      wrapperClassName="w-full"
      className={`input input-md w-full rounded-md border border-gray-300 px-3 py-2 ${className ?? ''}`}
      dateFormat="PP"
      aria-label={ariaLabel}
    />
  );
}
