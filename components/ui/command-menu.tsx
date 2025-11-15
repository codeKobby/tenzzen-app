"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  group?: string;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  className?: string;
}

export function CommandMenu({
  open,
  onOpenChange,
  items,
  placeholder = "Type a command or search...",
  className
}: CommandMenuProps) {
  const [search, setSearch] = React.useState("");

  // Filter and group items based on search
  const filteredItems = React.useMemo(() => {
    const searchLower = search.toLowerCase();
    return items
      .filter(item => 
        item.label.toLowerCase().includes(searchLower) ||
        item.group?.toLowerCase().includes(searchLower)
      )
      .reduce((acc, item) => {
        const group = item.group || 'Other';
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(item);
        return acc;
      }, {} as Record<string, CommandItem[]>);
  }, [items, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("p-0", className)}>
        <div className="flex items-center border-b p-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none border-0 focus-visible:ring-0"
          />
        </div>
        <ScrollArea className="max-h-[300px] overflow-y-auto p-2">
          {Object.entries(filteredItems).map(([group, groupItems]) => (
            <div key={group} className="mb-4 last:mb-0">
              <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                {group}
              </div>
              <div className="space-y-1">
                {groupItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-between px-2 py-1.5 text-sm font-normal",
                      "hover:bg-muted"
                    )}
                    onClick={() => {
                      item.onSelect();
                      onOpenChange(false);
                    }}
                  >
                    {item.label}
                    {item.shortcut && (
                      <kbd className="ml-2 text-xs text-muted-foreground">
                        {item.shortcut}
                      </kbd>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(filteredItems).length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export type { CommandItem };