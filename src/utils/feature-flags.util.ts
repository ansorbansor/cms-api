import * as fs from 'fs';
import * as path from 'path';

const FLAGS_FILE = path.join(process.cwd(), 'feature-flags.json');

const DEFAULT_FLAGS = {
  require_workload_ticket: true,
  enable_daily_reminder: true,
  daily_reminder_time: '08:00',
  show_workload_menu: true,
  show_kpi_dashboard: true,
  openai_base_url: 'https://api.openai.com/v1/chat/completions',
  openai_model: 'gpt-4o',
  openai_api_key: '',
  ai_system_message: 'You are a strict, objective Quality Assurance (QA) visual inspector. Your sole job is to evaluate whether the provided image(s) perfectly match the user\'s criteria. You must always reply in strict JSON format without any markdown wrappers.',
  ai_summarization_prompt: 'Anda adalah seorang Business Analyst ahli di bidang infrastruktur proyek telekomunikasi. Tugas Anda adalah menganalisis data JSON tren penyelesaian tugas dan nilai persentase Purchase Order (PO) yang diberikan oleh pengguna. Anda HARUS memberikan jawaban dalam Bahasa Indonesia. Pahami kosakata industri berikut: ATP (Acceptance Test Procedure) dan RFS (Ready for Service). Berikan ringkasan profesional yang menyoroti pencapaian tertinggi, wawasan operasional, dan potensi pendapatan (revenue) berdasarkan persentase PO. SANGAT PENTING: Anda HANYA boleh menggunakan angka, nama tugas, dan persentase PO yang secara eksplisit terdapat di dalam data JSON yang diberikan. DILARANG KERAS mengarang, menebak, atau menyebutkan data yang tidak ada di dalam JSON.',
  fuel_efficiency_kml: 12,
  min_app_version: 14,
  office_locations: 'Biosron EJBN Office|-7.362382|112.711600\nBiosron Medan Office|3.5344794|98.6168001\nBiosron Palembang Office|-2.9391259|104.7977115\nBiosron West Java Office|-6.9005171|107.5835439\nXLSmart Jakarta|-6.1852275|106.8212323',
  workload_job_categories: 'Microwave New Link, Microwave Dismantle, Microwave Swap, Microwave Swap Reroute',
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
