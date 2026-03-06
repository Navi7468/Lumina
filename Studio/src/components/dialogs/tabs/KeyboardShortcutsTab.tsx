import { useState } from 'react';
import { usePreferencesStore, type KeyBinding } from '@/store/preferencesStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';

export function KeyboardShortcutsTab() {
  const { keyBindings, updateKeyBinding, resetKeyBindings } = usePreferencesStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingKeys, setEditingKeys] = useState<string>('');
  const [recordingFor, setRecordingFor] = useState<string | null>(null);
  
  // Group key bindings by category
  const categories = {
    selection: keyBindings.filter(kb => kb.category === 'selection'),
    edit: keyBindings.filter(kb => kb.category === 'edit'),
    view: keyBindings.filter(kb => kb.category === 'view'),
    file: keyBindings.filter(kb => kb.category === 'file'),
    general: keyBindings.filter(kb => kb.category === 'general'),
  };
  
  const handleStartEditing = (kb: KeyBinding) => {
    setEditingId(kb.id);
    setEditingKeys(kb.keys);
  };
  
  const handleSaveEdit = () => {
    if (editingId && editingKeys.trim()) {
      updateKeyBinding(editingId, editingKeys);
    }
    setEditingId(null);
    setEditingKeys('');
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingKeys('');
    setRecordingFor(null);
  };
  
  const handleStartRecording = (id: string) => {
    setRecordingFor(id);
    setEditingKeys('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recordingFor) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const parts: string[] = [];
    
    // Add modifiers in consistent order
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    
    // Add the main key
    let key = e.key;
    
    // Normalize special keys
    if (key === ' ') key = 'Space';
    if (key === '=' || key === '+') key = '=';
    if (key === '-' || key === '_') key = '-';
    
    // Convert to uppercase for consistency (except special keys)
    if (key.length === 1) {
      key = key.toUpperCase();
    }
    
    // Ignore just modifier keys
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      return;
    }
    
    parts.push(key);
    
    const keyString = parts.join('+');
    setEditingKeys(keyString);
  };
  
  const handleResetAll = () => {
    if (confirm('Reset all keyboard shortcuts to defaults?')) {
      resetKeyBindings();
    }
  };
  
  const renderKeyBindingRow = (kb: KeyBinding) => {
    const isEditing = editingId === kb.id;
    const isRecording = recordingFor === kb.id;
    
    return (
      <div
        key={kb.id}
        className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded border-b last:border-b-0"
      >
        <div className="flex-1">
          <div className="text-sm font-medium">{kb.description}</div>
          <div className="text-xs text-muted-foreground">{kb.command}</div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Input
                value={editingKeys}
                onChange={(e) => setEditingKeys(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? 'Press keys...' : 'Type or record'}
                className="w-40 h-8 text-xs font-mono"
                autoFocus
              />
              <Button
                onClick={() => handleStartRecording(kb.id)}
                variant={isRecording ? 'default' : 'secondary'}
                className="h-8 text-xs"
              >
                {isRecording ? 'Recording...' : 'Record'}
              </Button>
              <Button onClick={handleSaveEdit} variant="default" className="h-8 text-xs">
                Save
              </Button>
              <Button onClick={handleCancelEdit} variant="secondary" className="h-8 text-xs">
                Cancel
              </Button>
            </>
          ) : (
            <>
              <kbd className="px-2 py-1 text-xs font-mono bg-muted border rounded min-w-[80px] text-center">
                {kb.keys}
              </kbd>
              <Button
                onClick={() => handleStartEditing(kb)}
                variant="secondary"
                className="h-8 text-xs"
              >
                Edit
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Click Edit to change a shortcut, or click Record to capture key presses
        </p>
        <Button
          onClick={handleResetAll}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset All
        </Button>
      </div>
      
      {/* Selection Commands */}
      {categories.selection.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Selection</h3>
          <div className="border rounded-lg overflow-hidden">
            {categories.selection.map(renderKeyBindingRow)}
          </div>
        </div>
      )}
      
      {/* Edit Commands */}
      {categories.edit.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Edit</h3>
          <div className="border rounded-lg overflow-hidden">
            {categories.edit.map(renderKeyBindingRow)}
          </div>
        </div>
      )}
      
      {/* View Commands */}
      {categories.view.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">View</h3>
          <div className="border rounded-lg overflow-hidden">
            {categories.view.map(renderKeyBindingRow)}
          </div>
        </div>
      )}
      
      {/* File Commands */}
      {categories.file.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">File</h3>
          <div className="border rounded-lg overflow-hidden">
            {categories.file.map(renderKeyBindingRow)}
          </div>
        </div>
      )}
      
      {/* General Commands */}
      {categories.general.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">General</h3>
          <div className="border rounded-lg overflow-hidden">
            {categories.general.map(renderKeyBindingRow)}
          </div>
        </div>
      )}
    </div>
  );
}
