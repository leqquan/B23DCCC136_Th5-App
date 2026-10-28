const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const DAY = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** 14:05 */
export function formatTime(ts?: number): string {
  if (!ts) {
    return '';
  }
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Thời gian ở danh sách cuộc trò chuyện: 14:05 / Hôm qua / T3 / 12/10 */
export function formatChatListTime(ts?: number): string {
  if (!ts) {
    return '';
  }
  const now = new Date();
  const d = new Date(ts);
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / DAY);
  if (diffDays <= 0) {
    return formatTime(ts);
  }
  if (diffDays === 1) {
    return 'Hôm qua';
  }
  if (diffDays < 7) {
    return WEEKDAYS[d.getDay()];
  }
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** Nhãn phân cách ngày trong màn hình chat */
export function formatDayLabel(ts: number): string {
  const now = new Date();
  const d = new Date(ts);
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / DAY);
  if (diffDays <= 0) {
    return 'Hôm nay';
  }
  if (diffDays === 1) {
    return 'Hôm qua';
  }
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(new Date(a)) === startOfDay(new Date(b));
}

/** "Đang hoạt động" / "Hoạt động 5 phút trước" ... */
export function formatPresence(
  state?: 'online' | 'offline',
  lastChanged?: number,
): string {
  if (state === 'online') {
    return 'Đang hoạt động';
  }
  if (!lastChanged) {
    return 'Ngoại tuyến';
  }
  const mins = Math.floor((Date.now() - lastChanged) / 60000);
  if (mins < 1) {
    return 'Vừa mới truy cập';
  }
  if (mins < 60) {
    return `Hoạt động ${mins} phút trước`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `Hoạt động ${hours} giờ trước`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `Hoạt động ${days} ngày trước`;
  }
  return 'Ngoại tuyến';
}

/** Lê Anh Quân -> LQ */
export function getInitials(name?: string): string {
  if (!name) {
    return '?';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

/** Bỏ dấu tiếng Việt để tìm kiếm thân thiện hơn */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

