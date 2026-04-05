import { type ReactNode } from 'react';
import { LayoutGrid } from 'lucide-react';
import { usePreferencesStore, type LayoutMode } from '@/store/preferencesStore';
import { AppHeader } from '@/components/common/AppHeader';

const LAYOUT_LABELS: Record<LayoutMode, string> = {
  daw: 'DAW',
  studio: 'Studio',
  node: 'Node',
};

function ComingSoonLayout({ mode }: { mode: LayoutMode }) {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <AppHeader />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <LayoutGrid className="h-12 w-12 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">{LAYOUT_LABELS[mode]} Layout</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Coming in a future release. Switch back to DAW mode in Preferences → General.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LayoutProviderProps {
  children: ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const layoutMode = usePreferencesStore((s) => s.layoutMode);

  if (layoutMode === 'studio' || layoutMode === 'node') {
    return <ComingSoonLayout mode={layoutMode} />;
  }

  // 'daw' - render the standard layout
  return <>{children}</>;
}
