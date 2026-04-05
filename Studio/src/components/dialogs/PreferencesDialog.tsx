import { useState, useEffect } from 'react';
import type { Theme } from '@/store/preferencesStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Settings, Keyboard, SlidersHorizontal } from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import { GeneralTab } from './tabs/GeneralTab';
import { EditorTab } from './tabs/EditorTab';
import { KeyboardShortcutsTab } from './tabs/KeyboardShortcutsTab';

export function PreferencesDialog() {
  const [open, setOpen] = useState(false);
  
  // Listen for preferences menu event
  useEffect(() => {
    const unlisten = listen('open-preferences', () => {
      setOpen(true);
    });
    
    return () => {
      unlisten.then(fn => fn());
    };
  }, []);
  
  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Preferences
          </DialogTitle>
          <DialogDescription>
            Customize keyboard shortcuts and application settings
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
          {/* Tabs */}
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="keyboard" className="flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              Keyboard Shortcuts
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="flex-1 overflow-y-auto mt-4">
            <GeneralTab onApplyTheme={applyTheme} />
          </TabsContent>

          {/* Editor Settings */}
          <TabsContent value="editor" className="flex-1 overflow-y-auto mt-4">
            <EditorTab />
          </TabsContent>
          
          {/* Keyboard Shortcuts */}
          <TabsContent value="keyboard" className="flex-1 overflow-y-auto mt-4">
            <KeyboardShortcutsTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
