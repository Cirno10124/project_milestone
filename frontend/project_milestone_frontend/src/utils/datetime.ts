/**
 * 将输入时间格式化为北京时间（Asia/Shanghai）字符串。
 *
 * - 支持 ISO 字符串/时间戳/Date
 * - 输入无法解析时返回空字符串，避免页面直接报错
 */
export function formatBeijingDateTime(input: string | number | Date): string {
  if (input === null || input === undefined) return '';

  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';

  // 使用 Intl 做时区转换与格式化（不引入额外依赖）
  const fmt = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // zh-CN 在不同环境下分隔符可能略不同，这里统一输出成 YYYY-MM-DD HH:mm:ss
  const parts = fmt.formatToParts(d);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const yyyy = pick('year');
  const mm = pick('month');
  const dd = pick('day');
  const hh = pick('hour');
  const mi = pick('minute');
  const ss = pick('second');
  if (!yyyy || !mm || !dd) return fmt.format(d);
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

