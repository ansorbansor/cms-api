import * as fs from 'fs';
import * as path from 'path';

const FLAGS_FILE = path.join(process.cwd(), 'feature-flags.json');

const DEFAULT_FLAGS = {
  require_workload_ticket: true,
  enable_daily_reminder: true,
  daily_reminder_time: '08:00',
  show_workload_menu: true,
  show_kpi_dashboard: true,
  litellm_url: 'http://109.123.237.113:4000/v1/chat/completions',
  litellm_model: 'vertex_ai/gemini-3.5-flash',
  litellm_api_key: 'sk-aJfYrGgKsgjq0OTPtstj5w',
  ai_system_message: 'You are a strict, objective Quality Assurance (QA) visual inspector. Your sole job is to evaluate whether the provided image(s) perfectly match the user\'s criteria. You must always reply in strict JSON format without any markdown wrappers.',
  fuel_efficiency_kml: 12,
  min_app_version: 14,
  office_locations: 'Biosron EJBN Office|-7.362382|112.711600\nBiosron Medan Office|3.5344794|98.6168001\nBiosron Palembang Office|-2.9391259|104.7977115\nBiosron West Java Office|-6.9005171|107.5835439\nXLSmart Jakarta|-6.1852275|106.8212323',
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
