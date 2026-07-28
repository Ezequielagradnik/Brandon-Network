// Lógica compartida para la analítica del asistente (preguntas/respuestas).
// La usan el panel admin (carga inicial, todos los usuarios) y el endpoint
// /api/admin/assistant (recálculo filtrado por usuario).

export type QA = {
  id: string;
  user: string;
  question: string;
  answer: string | null;
  time: number;
};
export type TopQuestion = { text: string; count: number };
export type PerUserRow = {
  name: string;
  email: string;
  today: number;
  total: number;
  seconds: number;
  last: number | null;
};
export type Bucket = { dayStart: number; count: number };
export type AssistantData = {
  stats: { qToday: number; q30: number; usersToday: number; avgSeconds: number };
  top: TopQuestion[];
  perDay: Bucket[];
  today: QA[];
  perUser: PerUserRow[];
};

export type Msg = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
};

export const ASSISTANT_DAYS = 14;

const normQ = (s: string) =>
  s.toLowerCase().replace(/\s+/g, " ").replace(/[¿?¡!.,;:]+$/g, "").trim();

export function buildAssistantData(input: {
  conversations: { id: string; user_id: string }[];
  messages: Msg[];
  activity: { user_id: string; active_seconds: number }[];
  names: Map<string, { name: string; email: string }>;
  filterUserId?: string;
}): AssistantData {
  const { conversations, messages, activity, names, filterUserId } = input;

  const chatsSince = new Date();
  chatsSince.setHours(0, 0, 0, 0);
  chatsSince.setDate(chatsSince.getDate() - (ASSISTANT_DAYS - 1));
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  const convUser = new Map<string, string>();
  for (const c of conversations) convUser.set(c.id, c.user_id);

  const secondsByUser = new Map<string, number>();
  for (const a of activity) {
    if (filterUserId && a.user_id !== filterUserId) continue;
    secondsByUser.set(a.user_id, a.active_seconds ?? 0);
  }

  const perDay: Bucket[] = [];
  for (let i = 0; i < ASSISTANT_DAYS; i++)
    perDay.push({ dayStart: chatsSince.getTime() + i * 86400000, count: 0 });

  const topMap = new Map<string, { text: string; count: number }>();
  const perUserAgg = new Map<
    string,
    { today: number; total: number; last: number | null }
  >();
  const convMsgs = new Map<string, Msg[]>();
  let qToday = 0;
  let q30 = 0;
  const usersToday = new Set<string>();

  for (const m of messages) {
    const uid = convUser.get(m.conversation_id);
    if (!uid) continue;
    if (filterUserId && uid !== filterUserId) continue;

    if (!convMsgs.has(m.conversation_id)) convMsgs.set(m.conversation_id, []);
    convMsgs.get(m.conversation_id)!.push(m);

    if (m.role !== "user") continue;
    const ts = Date.parse(m.created_at);
    q30++;

    const idx = Math.floor((ts - chatsSince.getTime()) / 86400000);
    if (idx >= 0 && idx < ASSISTANT_DAYS) perDay[idx].count++;

    const text = (m.content || "").trim();
    const key = normQ(text);
    if (key.length >= 4) {
      const cur = topMap.get(key);
      if (cur) cur.count++;
      else topMap.set(key, { text: text.slice(0, 140), count: 1 });
    }

    const agg = perUserAgg.get(uid) ?? { today: 0, total: 0, last: null };
    agg.total++;
    if (ts >= todayStartMs) agg.today++;
    agg.last = Math.max(agg.last ?? 0, ts);
    perUserAgg.set(uid, agg);

    if (ts >= todayStartMs) {
      qToday++;
      usersToday.add(uid);
    }
  }

  const todayQA: QA[] = [];
  for (const [convId, list] of convMsgs) {
    const uid = convUser.get(convId);
    if (!uid) continue;
    const who = names.get(uid);
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      if (m.role !== "user") continue;
      const ts = Date.parse(m.created_at);
      if (ts < todayStartMs) continue;
      let answer: string | null = null;
      for (let j = i + 1; j < list.length; j++) {
        if (list[j].role === "assistant") {
          answer = (list[j].content || "").slice(0, 800);
          break;
        }
        if (list[j].role === "user") break;
      }
      todayQA.push({
        id: m.id,
        user: who?.name ?? "—",
        question: (m.content || "").slice(0, 300),
        answer,
        time: ts,
      });
    }
  }
  todayQA.sort((a, b) => b.time - a.time);

  const top = [...topMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .filter((q) => q.count > 0);

  const perUser: PerUserRow[] = [];
  const userIds = new Set<string>([...perUserAgg.keys(), ...secondsByUser.keys()]);
  for (const uid of userIds) {
    const who = names.get(uid);
    if (!who) continue;
    const agg = perUserAgg.get(uid);
    perUser.push({
      name: who.name,
      email: who.email,
      today: agg?.today ?? 0,
      total: agg?.total ?? 0,
      seconds: secondsByUser.get(uid) ?? 0,
      last: agg?.last ?? null,
    });
  }
  perUser.sort(
    (a, b) => b.today - a.today || b.total - a.total || b.seconds - a.seconds,
  );

  const activeSecondsList = [...secondsByUser.values()].filter((s) => s > 0);
  const avgSeconds = activeSecondsList.length
    ? Math.round(
        activeSecondsList.reduce((s, v) => s + v, 0) / activeSecondsList.length,
      )
    : 0;

  return {
    stats: { qToday, q30, usersToday: usersToday.size, avgSeconds },
    top,
    perDay,
    today: todayQA.slice(0, 60),
    perUser,
  };
}
