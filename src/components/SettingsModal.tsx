import { useMemo, useState } from 'react';
import type { ThemeAccent } from '../types';
import { getInspectionLimits } from '../lib/inspection';
import { resetEverything } from '../lib/resetApp';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

export function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const settings = useAppStore((s) => s.settings);
  const multiSolve = useAppStore((s) => s.multiSolve);
  const setSettings = useAppStore((s) => s.setSettings);
  const [confirmReset, setConfirmReset] = useState(false);

  const previewLimit = useMemo(() => {
    const limits = getInspectionLimits(settings, multiSolve.events.length);
    return limits.limitMs / 1000;
  }, [multiSolve.events.length, settings]);

  const accentOptions = useMemo(
    () =>
      [
        ['blue', 'Blue'],
        ['violet', 'Violet'],
        ['cyan', 'Cyan'],
        ['green', 'Green'],
        ['pink', 'Pink'],
      ] as const,
    [],
  );

  return (
    <Modal open={open} title="Settings" onClose={onClose}>
      <div className="space-y-5">
        <ToggleRow
          label="Inspection"
          checked={settings.inspectionEnabled}
          onChange={(v) => setSettings({ inspectionEnabled: v })}
        />

        {settings.inspectionEnabled && (
          <>
            <NumberRow
              label="Inspection time (seconds)"
              hint="Time before +2 penalty"
              value={settings.inspectionSeconds}
              min={0}
              max={300}
              step={1}
              onChange={(v) => setSettings({ inspectionSeconds: v })}
            />
            <NumberRow
              label="Extra seconds per cube (multi)"
              hint={`With ${multiSolve.events.length} cubes selected: ${previewLimit}s total inspection`}
              value={settings.inspectionBonusPerCubeSeconds}
              min={0}
              max={60}
              step={1}
              onChange={(v) =>
                setSettings({ inspectionBonusPerCubeSeconds: v })
              }
            />
          </>
        )}

        <ToggleRow
          label="Sound"
          checked={settings.soundEnabled}
          onChange={(v) => setSettings({ soundEnabled: v })}
        />

        <div>
          <div className="text-sm font-medium text-fg">Timer font size</div>
          <div className="mt-2 flex items-center gap-3">
            <input
              className="w-full"
              type="range"
              min={0.8}
              max={1.4}
              step={0.05}
              value={settings.timerFontScale}
              onChange={(e) =>
                setSettings({ timerFontScale: Number(e.target.value) })
              }
            />
            <div className="w-14 text-right text-sm text-fg-muted">
              {settings.timerFontScale.toFixed(2)}×
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-fg">Accent color</div>
          <select
            className="mt-2 w-full rounded-lg border border-stroke bg-bg-panel2 px-3 py-2 text-sm text-fg outline-none focus:border-accent/60"
            value={settings.accent}
            onChange={(e) =>
              setSettings({ accent: e.target.value as ThemeAccent })
            }
          >
            {accentOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <NumberRow
          label="Other discipline XP multiplier"
          hint="Used when discipline is set to “Other”"
          value={settings.otherDisciplineMultiplier}
          min={0.1}
          max={10}
          step={0.1}
          onChange={(v) => setSettings({ otherDisciplineMultiplier: v })}
        />

        <ToggleRow
          label="Customize starts open"
          checked={settings.uiAdvancedOpen}
          onChange={(v) => setSettings({ uiAdvancedOpen: v })}
        />

        <div className="border-t border-stroke/80 pt-5">
          <div className="text-sm font-medium text-fg">Reset everything</div>
          <p className="mt-1 text-xs text-fg-subtle">
            Deletes all sessions, solve times, settings, and accounts on this
            device. You will need to sign up or sign in again.
          </p>
          {!confirmReset ? (
            <Button
              type="button"
              variant="danger"
              className="mt-3"
              onClick={() => setConfirmReset(true)}
            >
              Reset everything
            </Button>
          ) : (
            <div className="mt-3 rounded-lg border border-bad/40 bg-bad/10 p-3">
              <p className="text-sm text-fg">
                This cannot be undone. All your data on this browser will be
                erased.
              </p>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => resetEverything()}
                >
                  Yes, reset everything
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => {
              setConfirmReset(false);
              onClose();
            }}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm font-medium text-fg">{label}</div>
      <button
        className={
          'h-7 w-12 rounded-full border transition ' +
          (checked
            ? 'border-accent/70 bg-accent/40'
            : 'border-stroke bg-white/5')
        }
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <div
          className={
            'h-5 w-5 translate-y-[-1px] rounded-full bg-white/90 shadow transition ' +
            (checked ? 'translate-x-6' : 'translate-x-1')
          }
        />
      </button>
    </div>
  );
}

function NumberRow({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-fg">{label}</div>
      {hint && <div className="mt-1 text-xs text-fg-subtle">{hint}</div>}
      <input
        className="mt-2 w-full rounded-lg border border-stroke bg-bg-panel2 px-3 py-2 text-sm text-fg outline-none focus:border-accent/60"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
