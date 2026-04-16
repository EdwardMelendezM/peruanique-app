"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Item {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  items: Item[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onSelect: (value: string | null) => void;
  selectedValue?: string | null;
}

export function SearchableSelect({
                                   items,
                                   placeholder = "Seleccionar opción...",
                                   searchPlaceholder = "Buscar...",
                                   emptyMessage = "No se encontraron resultados.",
                                   onSelect,
                                   selectedValue,
                                 }: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full md:w-[300px] justify-between rounded-2xl border-border/50 hover:bg-secondary/10 transition-all font-medium"
          >
            <span className="truncate">
              {selectedValue
                ? items.find((item) => item.value === selectedValue)?.label
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 rounded-2xl border-border/60 shadow-2xl" align="start">
          <Command className="bg-card">
            <div className="flex items-center border-b border-border/50 px-3">
              {/*<Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />*/}
              <CommandInput
                placeholder={searchPlaceholder}
                className="h-11 bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
            <CommandList className="custom-scrollbar">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={`${item.label} ${item.value}`}
                    onSelect={() => {
                      onSelect(item.value === selectedValue ? null : item.value);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between py-3 px-4 cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary rounded-xl m-1"
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                    <Check
                      className={cn(
                        "h-4 w-4 text-primary",
                        selectedValue === item.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedValue && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSelect(null)}
          className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
