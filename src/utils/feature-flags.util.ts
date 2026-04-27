import * as fs from 'fs';
import * as path from 'path';

const FLAGS_FILE = path.join(process.cwd(), 'feature-flags.json');

const DEFAULT_FLAGS = {
  require_workload_ticket: true,
  enable_daily_reminder: true,
  daily_reminder_time: '08:00',
  show_workload_menu: true,
  show_kpi_dashboard: true,
};

export function readFeatureFlags(): Record<string, any> {
  try {
    if (fs.existsSync(FLAGS_FILE)) {
      const raw = fs.readFileSync(FLAGS_FILE, 'utf-8');
      return { ...DEFAULT_FLAGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('[FeatureFlags] Failed to read feature flags:', e.message);
  }
  return { ...DEFAULT_FLAGS };
}

export function writeFeatureFlags(flags: Record<string, any>): void {
  const current = readFeatureFlags();
  const updated = { ...current, ...flags };
  fs.writeFileSync(FLAGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
}

export function getFlag(key: string, defaultValue?: any): any {
  const flags = readFeatureFlags();
  return flags[key] ?? defaultValue ?? true;
}
