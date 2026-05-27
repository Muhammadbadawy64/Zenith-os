"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked || false);

    React.useEffect(() => {
      setIsChecked(checked || false);
    }, [checked]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      setIsChecked(newChecked);
      if (onCheckedChange) {
        onCheckedChange(newChecked);
      }
    };

    return (
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          className={cn(
            "peer h-5 w-5 shrink-0 appearance-none rounded-lg border-2 border-brainhance-purple/50 bg-white/5 transition-all cursor-pointer",
            "checked:bg-brainhance-purple checked:border-brainhance-purple",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brainhance-purple/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <Check 
          className={cn(
            "absolute w-3.5 h-3.5 text-white pointer-events-none transition-transform duration-200 scale-0 opacity-0",
            isChecked && "scale-100 opacity-100"
          )} 
        />
      </div>
    );
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
