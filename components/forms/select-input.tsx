
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils"; // O tu helper de clases

interface Option {
  key: string;
  value: string;
}

interface FormSelectProps {
  label: string;
  value?: string;
  placeholder?: string;
  options: Option[];
  error?: string;
  onChange: (value: string) => void;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export function FormSelect({
                             label,
                             value,
                             placeholder,
                             options,
                             error,
                             onChange,
                             description,
                             className,
                             disabled
                           }: FormSelectProps) {
  return (
    <div className={cn("space-y-2 animate-in fade-in slide-in-from-top-2", className)}>
      <Label className={error ? "text-destructive" : ""}>{label}</Label>

      <Select
        onValueChange={onChange}
        value={value}
        disabled={disabled}
      >
        <SelectTrigger className={error ? "border-destructive" : ""}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.key} value={opt.key}>
              {opt.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {error && (
        <p className="text-xs font-semibold text-destructive animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
