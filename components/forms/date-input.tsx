"use client";

import * as React from "react";
import { isValid, parse, format, getDaysInMonth, getYear } from "date-fns";
import { es } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DateInputProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function DateInput({ label, value, onChange, error }: DateInputProps) {
  // Inicializamos el estado solo una vez
  const initialParts = React.useMemo(() => (value ? value.split("-") : ["", "", ""]), []);

  const [day, setDay] = React.useState(initialParts[2] || "");
  const [month, setMonth] = React.useState(initialParts[1] || "");
  const [year, setYear] = React.useState(initialParts[0] || "");
  const [localError, setLocalError] = React.useState<string | null>(null);

  const lastValueRef = React.useRef(value);

  // OPTIMIZACIÓN 1: Memoizar los Items del Select de Años (El más pesado)
  const yearOptions = React.useMemo(() => {
    const currentYear = getYear(new Date());
    return Array.from({ length: 100 }, (_, i) => {
      const y = (currentYear - i).toString();
      return <SelectItem key={y} value={y}>{y}</SelectItem>;
    });
  }, []);

  // OPTIMIZACIÓN 2: Memoizar Items de Meses
  const monthOptions = React.useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const val = (i + 1).toString().padStart(2, "0");
      const label = format(new Date(2024, i, 1), "MMMM", { locale: es });
      return <SelectItem key={val} value={val} className="capitalize">{label}</SelectItem>;
    }), []);

  // OPTIMIZACIÓN 3: Días dinámicos memoizados
  const dayOptions = React.useMemo(() => {
    const totalDays = (month && year)
      ? getDaysInMonth(new Date(Number(year), Number(month) - 1))
      : 31;
    return Array.from({ length: totalDays }, (_, i) => {
      const val = (i + 1).toString().padStart(2, "0");
      return <SelectItem key={val} value={val}>{i + 1}</SelectItem>;
    });
  }, [month, year]);

  // OPTIMIZACIÓN 4: Validación limpia sin localError como dependencia
  React.useEffect(() => {
    if (day && month && year) {
      const dateString = `${day}/${month}/${year}`;
      const parsedDate = parse(dateString, "dd/MM/yyyy", new Date());

      if (isValid(parsedDate)) {
        const isoDate = format(parsedDate, "yyyy-MM-dd");
        if (isoDate !== lastValueRef.current) {
          lastValueRef.current = isoDate;
          setLocalError(null);
          onChange(isoDate);
        }
      } else {
        // Solo actualizamos si el error es diferente para evitar renders
        setLocalError((prev) => prev !== "Fecha inválida" ? "Fecha inválida" : prev);
      }
    }
  }, [day, month, year, onChange]);

  return (
    <div className="space-y-2 w-full">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <div className="flex gap-2 mt-1">

        <Select value={day} onValueChange={setDay}>
          <SelectTrigger className={cn("flex-1 h-12 shadow-sm", (error || localError) && "border-destructive")}>
            <SelectValue placeholder="Día" />
          </SelectTrigger>
          <SelectContent className="max-h-[250px]">{dayOptions}</SelectContent>
        </Select>

        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className={cn("flex-[2] h-12 shadow-sm capitalize", (error || localError) && "border-destructive")}>
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent className="max-h-[250px]">{monthOptions}</SelectContent>
        </Select>

        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className={cn("flex-[1.2] h-12 shadow-sm", (error || localError) && "border-destructive")}>
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent className="max-h-[250px]">{yearOptions}</SelectContent>
        </Select>

      </div>

      {(error || localError) && (
        <p className="text-xs text-destructive font-medium animate-in fade-in slide-in-from-top-1">
          {error || localError}
        </p>
      )}
    </div>
  );
}
