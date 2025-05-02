import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  changeText?: string;
  changeValue?: number;
  changeColor?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  changeText,
  changeValue,
  changeColor,
}: StatsCardProps) {
  return (
    <Card className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
          {changeText && (
            <p className={`text-xs ${changeColor} mt-1 flex items-center`}>
              {changeValue && changeValue > 0 ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : changeValue && changeValue < 0 ? (
                <ArrowDown className="h-3 w-3 mr-1" />
              ) : null}
              <span>{changeText}</span>
            </p>
          )}
        </div>
        <div className={`h-12 w-12 ${iconBgColor} rounded-full flex items-center justify-center`}>
          <div className={`text-2xl ${iconColor}`}>{icon}</div>
        </div>
      </div>
    </Card>
  );
}
