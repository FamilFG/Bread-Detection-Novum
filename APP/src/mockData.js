export const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// Данные теперь только из БД
export async function getMonthDays(year, month) {
  const today = new Date();
  const rows = await window.electron.getMonthDays(year, month);

  // Строим полный массив дней месяца
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  const countMap = {};
  for (const row of rows) {
    countMap[row.day] = row.count;
  }

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    const isFuture =
      year > today.getFullYear() ||
      (year === today.getFullYear() && month > today.getMonth()) ||
      (year === today.getFullYear() && month === today.getMonth() && d > today.getDate());

    days.push({
      day: d,
      count: countMap[d] ?? null,
      isToday,
      isFuture,
    });
  }

  return { days, firstDow };
}

export async function getSummaryStats() {
  return await window.electron.getSummaryStats();
}

export const captureLog = [];