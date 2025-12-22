import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

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
export class GeminiSubtasksService {
  private ai: GoogleGenAI;

  constructor() {
    // SDK tự đọc env GEMINI_API_KEY (theo docs quickstart)
    // Bạn chỉ cần đảm bảo process.env.GEMINI_API_KEY có giá trị.
    this.ai = new GoogleGenAI({});
  }

  async generate(input: GenerateSubtasksInput) {
    const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
    const language = input.language ?? 'vi';
    const max = clamp(input.max_subtasks ?? 6, 1, 12);

    const prompt = [
      `Bạn là trợ lý chia nhỏ issue thành subtasks.`,
      `Trả về đúng định dạng: mỗi dòng bắt đầu bằng "- ".`,
      `Tối đa ${max} dòng.`,
      `Ngôn ngữ: ${language}.`,
      `Không thêm giải thích ngoài danh sách.`,
      ``,
      `Issue: ${input.issue.name}`,
      input.issue.summary ? `Summary: ${input.issue.summary}` : '',
      input.issue.description ? `Description: ${input.issue.description}` : '',
    ].filter(Boolean).join('\n');

    try {
      const resp = await this.ai.models.generateContent({
        model,
        contents: prompt,
      });

      const text = (resp.text ?? '').trim();
      const subtasks = text
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('- '))
        .map(l => l.slice(2).trim())
        .slice(0, max);

      return { run_id: input.run_id, subtasks, raw: text };
    } catch (err: any) {
      // Gemini cũng có rate limit theo tier free/paid, nên có thể gặp 429/403 tuỳ trường hợp
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
