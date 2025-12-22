import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

type GenerateSubtasksInput = {
  run_id: string;
  issue: {
    name: string;
    summary?: string | null;
    description?: string | null;
  };
  max_subtasks?: number;
  language?: 'vi' | 'en';
};

@Injectable()
export class OpenAiSubtasksService {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY in environment variables');
    this.client = new OpenAI({ apiKey });
  }

  async generate(input: GenerateSubtasksInput) {
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    const language = input.language ?? 'vi';
    const maxSubtasks = clamp(input.max_subtasks ?? 5, 1, 12);

    const system = [
      `Bạn là trợ lý giúp chia nhỏ issue thành subtasks.`,
      `Trả về đúng định dạng: mỗi dòng là một subtask, bắt đầu bằng "- ".`,
      `Tối đa ${maxSubtasks} dòng.`,
      `Ngôn ngữ: ${language}.`,
      `Subtask phải cụ thể, có thể làm ngay (actionable).`,
      `Không thêm giải thích ngoài danh sách.`,
    ].join('\n');

    const user = [
      `Issue: ${input.issue.name}`,
      input.issue.summary ? `Summary: ${input.issue.summary}` : '',
      input.issue.description ? `Description: ${input.issue.description}` : '',
    ].filter(Boolean).join('\n');

    try {
      const resp = await this.client.responses.create({
        model,
        input: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
      });

      const text = (resp.output_text ?? '').trim();

      // Parse lines "- ..."
      const subtasks = text
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('- '))
        .map(l => l.replace(/^- /, '').trim())
        .slice(0, maxSubtasks);

      return {
        run_id: input.run_id,
        subtasks,
        raw: text, // để debug
      };
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode;
      if (status === 429) {
        return {
          run_id: input.run_id,
          subtasks: [],
          raw: '',
          error: 'OpenAI 429: quota/billing không đủ hoặc project bị giới hạn. Kiểm tra Billing/Credits.',
        };
      }
      return {
        run_id: input.run_id,
        subtasks: [],
        raw: '',
        error: err?.message ?? 'unknown_error',
      };
    }
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
