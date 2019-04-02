export interface DiagnoticItem {
  title: string;
  description: string;
  category?: string;
  line: number;
  rule: string;
}

export function run(configPath: string, content: string): DiagnoticItem[];
