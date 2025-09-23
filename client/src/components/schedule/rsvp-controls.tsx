import React from 'react';
import { Button } from '@/components/ui/button';

interface RSVPControlsProps {
  currentStatus?: string;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
}

export function RSVPControls({ currentStatus, onStatusChange, disabled = false }: RSVPControlsProps) {
  const statuses = ['going', 'maybe', 'no'];

  return (
    <div className="flex space-x-2">
      {statuses.map((status) => (
        <Button
          key={status}
          variant={currentStatus === status ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange(status)}
          disabled={disabled}
        >
          {status === 'going' && 'Going'}
          {status === 'maybe' && 'Maybe'}
          {status === 'no' && 'No'}
        </Button>
      ))}
    </div>
  );
}