import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export enum TagEnum {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DATABASE = 'database',
  UI_UX = 'ui_ux',
  DEVOPS = 'devops',
  DOCUMENT = 'document',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
}

export enum IssuePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IssueType {
  BUG = 'bug',
  TASK = 'task',
  STORY = 'story',
  FEATURE = 'feature',
  IMPROVEMENT = 'improvement',
  SUBTASK = 'subtask',
}

type SubtaskOutput = {
  name: string;
  type: IssueType;
  tags: TagEnum[];
  status: string;
  priority: IssuePriority;
  description: string;
};

type GenerateSubtasksInput = {
  run_id: string;
  issue: {
    name: string;
    summary?: string | null;
    description?: string | null;

    // issue cha (optional)
    type?: IssueType | null;
    tags?: TagEnum[] | null;
    status?: string | null;
    priority?: IssuePriority | null;
  };
  max_subtasks?: number;
  language?: 'vi' | 'en';
};

type GenerateSubtasksResult = {
  run_id: string;
  subtasks: SubtaskOutput[];
  raw: string;
  error?: string;
};

const ALLOWED_TAGS = new Set(Object.values(TagEnum));
const ALLOWED_TYPES = new Set(Object.values(IssueType));
const ALLOWED_PRIORITIES = new Set(Object.values(IssuePriority));

@Injectable()
export class GeminiSubtasksService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({});
  }

  async generate(
    input: GenerateSubtasksInput,
  ): Promise<GenerateSubtasksResult> {
    const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
    const language = input.language ?? 'vi';
    const max = clamp(input.max_subtasks ?? 6, 1, 12);

    // fallback defaults nếu model trả sai/thiếu
    const fallbackType: IssueType = input.issue.type ?? IssueType.SUBTASK;
    const fallbackPriority: IssuePriority =
      input.issue.priority ?? IssuePriority.MEDIUM;
    const fallbackTags: TagEnum[] = Array.isArray(input.issue.tags)
      ? input.issue.tags
      : [];

    const prompt = [
      `Bạn là trợ lý chia nhỏ issue thành subtasks.`,
      `Hãy trả về CHỈ JSON hợp lệ, không markdown, không code fence.`,
      `Format JSON bắt buộc:`,
      `{"run_id":"...","subtasks":[{"name":"...","type":"...","tags":["..."],"status":"...","priority":"...","description":"..."}]}`,
      ``,
      `RÀNG BUỘC ENUM (BẮT BUỘC TUÂN THỦ):`,
      `- type chỉ được là một trong: ${Object.values(IssueType).join(', ')}`,
      `- priority chỉ được là một trong: ${Object.values(IssuePriority).join(', ')}`,
      `- tags chỉ được lấy từ: ${Object.values(TagEnum).join(', ')}`,
      `- tags là mảng, có thể rỗng; KHÔNG được tạo tag khác ngoài danh sách trên.`,
      ``,
      `Yêu cầu:`,
      `- Tối đa ${max} subtasks.`,
      `- Subtask phải actionable, không trùng lặp.`,
      `- Mọi subtask PHẢI có đủ key: name,type,tags,status,priority,description.`,
      `- Ngôn ngữ: ${language}.`,
      ``,
      `Issue name: ${input.issue.name}`,
      input.issue.summary ? `Summary: ${input.issue.summary}` : '',
      input.issue.description ? `Description: ${input.issue.description}` : '',
      `Parent type (gợi ý): ${input.issue.type ?? ''}`,
      `Parent priority (gợi ý): ${input.issue.priority ?? ''}`,
      `Parent tags (gợi ý): ${(input.issue.tags ?? []).join(', ')}`,
      `Parent status (gợi ý): ${input.issue.status ?? ''}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const resp = await this.ai.models.generateContent({
        model,
        contents: prompt,
      });

      const raw = (resp.text ?? '').trim();
      const jsonText = extractJsonObject(raw);
      const parsed = JSON.parse(jsonText);

      const subtasksRaw = Array.isArray(parsed?.subtasks)
        ? parsed.subtasks
        : [];
      const subtasks: SubtaskOutput[] = subtasksRaw
        .slice(0, max)
        .map((s: any) => {
          const name = String(s?.name ?? '').trim();
          const description = String(s?.description ?? '').trim();
          const status = String(
            s?.status ?? input.issue.status ?? 'Todo',
          ).trim();

          // validate enums
          const type = normalizeType(s?.type, fallbackType);
          const priority = normalizePriority(s?.priority, fallbackPriority);
          const tags = normalizeTags(s?.tags, fallbackTags);

          return { name, type, tags, status, priority, description };
        })
        .filter((s) => s.name.length > 0);

      return { run_id: input.run_id, subtasks, raw };
    } catch (err: any) {
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

function extractJsonObject(text: string): string {
  const cleaned = text
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .trim();

  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    throw new Error('Model did not return a JSON object');
  }
  return cleaned.slice(first, last + 1);
}

function normalizeType(value: any, fallback: IssueType): IssueType {
  const v = String(value ?? '')
    .toLowerCase()
    .trim();
  return ALLOWED_TYPES.has(v as IssueType) ? (v as IssueType) : fallback;
}

function normalizePriority(value: any, fallback: IssuePriority): IssuePriority {
  const v = String(value ?? '')
    .toLowerCase()
    .trim();
  return ALLOWED_PRIORITIES.has(v as IssuePriority)
    ? (v as IssuePriority)
    : fallback;
}

function normalizeTags(value: any, fallback: TagEnum[]): TagEnum[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((t) =>
      String(t ?? '')
        .toLowerCase()
        .trim(),
    )
    .filter((t) => ALLOWED_TAGS.has(t as TagEnum)) as TagEnum[];

  // dedupe
  return Array.from(new Set(cleaned));
}
