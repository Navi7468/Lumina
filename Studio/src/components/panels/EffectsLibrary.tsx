import React from 'react';
import { Plus, Layers } from 'lucide-react';
import { Button } from '../ui/button';
import { useProjectStore } from '@/store/projectStore';
import { EffectRegistry } from '@/engine/EffectRegistry';

export function EffectsLibrary() {
  const addLayer = useProjectStore(state => state.addLayer);
  const addAdjustmentLayer = useProjectStore(state => state.addAdjustmentLayer);
  const categories = EffectRegistry.getCategories();
  
  return (
    <div className="space-y-4">
        {/* Adjustment Layer Button */}
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
            Utility
          </h4>
          <button
            className="w-full flex items-center justify-between p-2 rounded-md bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-colors text-left group"
            onClick={() => addAdjustmentLayer()}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Layers className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Adjustment Layer</div>
                <div className="text-xs text-muted-foreground truncate">
                  Apply modifiers to all layers below
                </div>
              </div>
            </div>
            <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
          </button>
        </div>
        
        {/* Regular Effects */}
        {categories.map(category => {
          const effects = EffectRegistry.getByCategory(category);
          
          return (
            <div key={category}>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                {category}
              </h4>
              <div className="space-y-1">
                {effects.map(effect => (
                  <button
                    key={effect.metadata.id}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors text-left group"
                    onClick={() => addLayer(effect.metadata.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{effect.metadata.name}</div>
                      {effect.metadata.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {effect.metadata.description}
                        </div>
                      )}
                    </div>
                    <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
