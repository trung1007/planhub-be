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
}

type SubtaskOutput = {
  name: string;
  type: IssueType;
  tags: TagEnum[];
  status: string; // ✅ must be in list_status
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

    // ✅ theo input mới của bạn
    list_status: string[] | null;
    project: string | null;
    sprint: string | null;
    release: string | null;
    sprint_id: number | null;
    parent_issue_id: number | null;
    assignee_id: number | null;
    reporter_id: number | null;
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

    // ✅ allowed statuses derived from list_status
    const { allowedList, allowedMap } = buildAllowedStatusMap(
      input.issue.list_status,
    );

    // fallback defaults nếu model trả sai/thiếu
    const fallbackType: IssueType = input.issue.type ?? IssueType.TASK;
    const fallbackPriority: IssuePriority =
      input.issue.priority ?? IssuePriority.MEDIUM;
    const fallbackTags: TagEnum[] = Array.isArray(input.issue.tags)
      ? input.issue.tags
      : [];

    // ✅ fallbackStatus phải thuộc list_status
    const fallbackStatus = pickFallbackStatus(
      input.issue.status,
      allowedMap,
      allowedList,
    );

    const prompt = [
      `Bạn là trợ lý chia nhỏ issue thành subtasks.`,
      `Hãy trả về CHỈ JSON hợp lệ, không markdown, không code fence.`,
      `Format JSON bắt buộc:`,
      `{"run_id":"...","subtasks":[{"name":"...","type":"...","tags":["..."],"status":"...","priority":"...","description":"...", "summary":"...",
            parent_issue_id:${input.issue.parent_issue_id},

      sprint_id:${input.issue.sprint_id},
      reporter_id:${input.issue.reporter_id},
      assignee_id:${input.issue.assignee_id}}]}`,
      ``,
      `RÀNG BUỘC ENUM (BẮT BUỘC TUÂN THỦ):`,
      `- type chỉ được là một trong: ${Object.values(IssueType).join(', ')}`,
      `- priority chỉ được là một trong: ${Object.values(IssuePriority).join(', ')}`,
      `- tags chỉ được lấy từ: ${Object.values(TagEnum).join(', ')}`,
      `- status chỉ được là một trong list_status: ${allowedList.join(', ')}`,
      `- tags là mảng, có thể rỗng; KHÔNG được tạo tag khác ngoài danh sách trên.`,
      ``,
      `Yêu cầu:`,
      `- Tối đa ${max} subtasks.`,
      `- Subtask phải actionable, không trùng lặp.`,
      `- Mọi subtask PHẢI có đủ key: name,type,tags,status,priority,description.`,
      `- Ngôn ngữ: ${language}.`,
      ``,
      `Context:`,
      `- Project: ${input.issue.project ?? ''}`,
      `- Sprint: ${input.issue.sprint ?? ''}`,
      `- Release: ${input.issue.release ?? ''}`,
      ``,
      `Issue name: ${input.issue.name}`,
      input.issue.summary ? `Summary: ${input.issue.summary}` : '',
      input.issue.description ? `Description: ${input.issue.description}` : '',
      `Parent type (gợi ý): ${input.issue.type ?? ''}`,
      `Parent priority (gợi ý): ${input.issue.priority ?? ''}`,
      `Parent tags (gợi ý): ${(input.issue.tags ?? []).join(', ')}`,
      `Parent status (gợi ý): ${input.issue.status ?? ''}`,
      `Allowed status list: ${allowedList.join(', ')}`,
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

          // validate enums
          const type = normalizeType(s?.type, fallbackType);
          const priority = normalizePriority(s?.priority, fallbackPriority);
          const tags = normalizeTags(s?.tags, fallbackTags);

          // ✅ status MUST be in list_status (allowedMap)
          const status = normalizeStatus(s?.status, fallbackStatus, allowedMap);

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

/* ---------------- helpers ---------------- */

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
  return Array.from(new Set(cleaned));
}

/**
 * Build a map: normalized_status -> original_status_from_list
 * So we can accept case-insensitive input, but return exactly the allowed value.
 */
function buildAllowedStatusMap(list: string[] | null | undefined): {
  allowedList: string[];
  allowedMap: Map<string, string>;
} {
  const allowedList =
    Array.isArray(list) &&
    list.map((s) => String(s ?? '').trim()).filter(Boolean).length
      ? Array.from(
          new Set(list.map((s) => String(s ?? '').trim()).filter(Boolean)),
        )
      : ['to_do', 'in_progress', 'done']; // fallback safe default

  const allowedMap = new Map<string, string>();
  for (const s of allowedList) {
    allowedMap.set(s.toLowerCase(), s);
  }
  return { allowedList, allowedMap };
}

function pickFallbackStatus(
  candidate: string | null | undefined,
  allowedMap: Map<string, string>,
  allowedList: string[],
): string {
  const c = String(candidate ?? '')
    .toLowerCase()
    .trim();
  if (c && allowedMap.has(c)) return allowedMap.get(c)!;
  return allowedList[0] ?? 'to_do';
}

function normalizeStatus(
  value: any,
  fallback: string,
  allowedMap: Map<string, string>,
): string {
  const v = String(value ?? '')
    .toLowerCase()
    .trim();
  if (v && allowedMap.has(v)) return allowedMap.get(v)!;

  const fb = String(fallback ?? '')
    .toLowerCase()
    .trim();
  if (fb && allowedMap.has(fb)) return allowedMap.get(fb)!;

  // should never happen, but keep safe:
  return (
    allowedMap.get('to_do') ?? Array.from(allowedMap.values())[0] ?? 'to_do'
  );
}
