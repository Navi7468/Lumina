import { ModifierRegistry } from '@/engine/ModifierRegistry';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface ModifiersLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectModifier: (modifierId: string) => void;
}

export function ModifiersLibrary({ open, onOpenChange, onSelectModifier }: ModifiersLibraryProps) {
  const categories = ModifierRegistry.getCategories();
  
  const handleSelect = (modifierId: string) => {
    onSelectModifier(modifierId);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Modifier</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh] pr-4">
          <div className="space-y-6">
            {categories.map(category => {
              const modifiers = ModifierRegistry.getByCategory(category);
              
              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {modifiers.map(modifier => (
                      <button
                        key={modifier.metadata.id}
                        className="p-3 rounded-lg border hover:border-primary hover:bg-accent transition-colors text-left"
                        onClick={() => handleSelect(modifier.metadata.id)}
                      >
                        <div className="font-medium text-sm">{modifier.metadata.name}</div>
                        {modifier.metadata.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {modifier.metadata.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
