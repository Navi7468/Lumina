import { useState, useCallback } from 'react';
import { save as dialogSave, open as dialogOpen } from '@tauri-apps/api/dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/api/fs';
import { useProjectStore } from '@/store/projectStore';
import { usePlaybackStore } from '@/store/playbackStore';
import { serializeProject, deserializeProject } from '@/lib/projectSerializer';

/**
 * Provides save / open file actions backed by native Tauri dialogs.
 * Tracks the currently open file so "Save" skips the dialog on re-save.
 */
export function useProjectFile() {
  const { project, loadProject } = useProjectStore();
  const { stop } = usePlaybackStore();
  const [currentPath, setCurrentPath] = useState<string | null>(null);

  const save = useCallback(
    async (forceSaveAs = false) => {
      try {
        let path = forceSaveAs ? null : currentPath;

        if (!path) {
          const chosen = await dialogSave({
            filters: [{ name: 'Lumina Project', extensions: ['lumina'] }],
            defaultPath: `${project.name}.lumina`,
          });
          if (!chosen) return; // user cancelled
          path = chosen.endsWith('.lumina') ? chosen : `${chosen}.lumina`;
          setCurrentPath(path);
        }

        const data = serializeProject(project);
        await writeTextFile(path, JSON.stringify(data, null, 2));
      } catch (err) {
        console.error('[useProjectFile] Failed to save project:', err);
      }
    },
    [project, currentPath],
  );

  const open = useCallback(async () => {
    try {
      const chosen = await dialogOpen({
        filters: [{ name: 'Lumina Project', extensions: ['lumina'] }],
        multiple: false,
      });

      if (!chosen || Array.isArray(chosen)) return; // user cancelled or bad value

      const content = await readTextFile(chosen);
      const proj = deserializeProject(JSON.parse(content));
      stop();
      loadProject(proj);
      setCurrentPath(chosen);
    } catch (err) {
      console.error('[useProjectFile] Failed to open project:', err);
    }
  }, [loadProject, stop]);

  return { save, open, currentPath };
}
