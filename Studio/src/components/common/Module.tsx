import * as React from 'react';
import { cn } from "@/lib/utils";
import { MoreVertical, GripVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';

export interface ModuleMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean; // Add separator after this item
}

export interface ModuleProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: React.ReactNode;
  menu?: ModuleMenuItem[];
  actions?: React.ReactNode; // Additional header actions
  draggable?: boolean; // Enable drag handle for repositioning
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  headerClassName?: string;
  contentClassName?: string;
  noPadding?: boolean; // Remove default padding from content
}

export function Module({ 
  title, 
  icon,
  menu,
  actions,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  className,
  headerClassName,
  contentClassName,
  noPadding = false,
  children,
  ...props 
}: ModuleProps) {
  const headerRef = React.useRef<HTMLDivElement>(null);
  
  return (
    <div 
      className={cn(
        "flex flex-col w-full h-full border border-border rounded-md bg-card overflow-hidden",
        className
      )} 
      onDragOver={onDragOver}
      {...props}
    >
      {/* Header */}
      <header 
        className={cn(
          'flex items-center justify-between gap-2 px-3 py-1 border-b bg-muted/30 min-h-[20px]',
          draggable && 'cursor-grab active:cursor-grabbing',
          headerClassName
        )}
        ref={headerRef}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {draggable && (
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          {icon && (
            <div className="flex-shrink-0 text-muted-foreground">
              {icon}
            </div>
          )}
          <h3 className="text-xs font-semibold truncate">{title}</h3>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {actions}
          
          {menu && menu.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {menu.map((item, index) => (
                  <React.Fragment key={index}>
                    <DropdownMenuItem
                      onClick={item.onClick}
                      disabled={item.disabled}
                      className="cursor-pointer"
                    >
                      {item.icon && (
                        <span className="mr-2 flex items-center">
                          {item.icon}
                        </span>
                      )}
                      {item.label}
                    </DropdownMenuItem>
                    {item.separator && <DropdownMenuSeparator />}
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      
      {/* Content */}
      <div 
        className={cn(
          "flex-1 overflow-auto",
          !noPadding && "p-3",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}