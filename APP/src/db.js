const Database = require("better-sqlite3");
const path = require("path");

// Убедись, что bread.db лежит в той же папке, что и этот db.js
const DB_PATH = path.join(__dirname, "bread.db");

function getDB() {
  return new Database(DB_PATH);
}

// Все дни конкретного месяца
function getMonthDays(year, month) {
  const db = getDB();
  // Используем названия колонок с БОЛЬШОЙ буквы, как на скриншоте
  const rows = db
    .prepare(
      `
    SELECT Day, Amount FROM bread_sales 
    WHERE Year = ? AND Month = ?
    ORDER BY Day ASC
  `,
    )
    .all(year, month + 1);

  db.close();

  // Превращаем результат в формат, который ждет фронтенд (маленькие буквы)
  return rows.map((r) => ({
    day: r.Day,
    count: r.Amount,
  }));
}

// Вспомогательная функция для расчета тренда
function calcTrend(curr, prev) {
  if (!prev || prev === 0) {
    return {
      trend: curr > 0 ? "New" : "Stable",
      trendUp: curr > 0 ? true : undefined,
    };
  }
  const diff = ((curr - prev) / prev) * 100;
  if (Math.abs(diff) < 0.1) {
    return { trend: "Stable", trendUp: undefined };
  }
  const trend = (diff > 0 ? "+" : "") + diff.toFixed(0) + "%";
  return { trend, trendUp: diff > 0 };
}

// Статистика для карточек
function getSummaryStats(referenceTime = Date.now()) {
  const db = getDB();
  const referenceDate = new Date(referenceTime);

  const getDateInt = (date) => {
    return (
      date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
    );
  };

  const getSum = (startOffset, endOffset) => {
    const start = new Date(referenceDate);
    start.setDate(start.getDate() - startOffset);
    const end = new Date(referenceDate);
    end.setDate(end.getDate() - endOffset);

    // ВАЖНО: Больший офсет означает более раннюю дату.
    // Для BETWEEN нужно (меньшая_дата) AND (большая_дата).
    const sInt = getDateInt(startOffset > endOffset ? start : end);
    const eInt = getDateInt(startOffset > endOffset ? end : start);

    const row = db
      .prepare(
        `
      SELECT SUM(Amount) as total FROM bread_sales
      WHERE (Year * 10000 + Month * 100 + Day) BETWEEN ? AND ?
    `,
      )
      .get(sInt, eInt);
    return row?.total ?? 0;
  };

  // 1. Сегодня vs Вчера
  const todayVal = getSum(0, 0);
  const yesterdayVal = getSum(1, 1);
  const todayTrend = calcTrend(todayVal, yesterdayVal);

  // 2. Вчера vs Позавчера
  const dayBeforeYesterdayVal = getSum(2, 2);
  const yesterdayTrend = calcTrend(yesterdayVal, dayBeforeYesterdayVal);

  // 3. Эта неделя (последние 7 дней) vs Прошлая неделя (7-14 дней назад)
  const thisWeekVal = getSum(0, 6);
  const lastWeekVal = getSum(7, 13);
  const weeklyTrend = calcTrend(thisWeekVal, lastWeekVal);

  // 4. Этот месяц (последние 30 дней) vs Прошлый месяц (30-60 дней назад)
  const thisMonthVal = getSum(0, 29);
  const lastMonthVal = getSum(30, 59);
  const monthlyTrend = calcTrend(thisMonthVal, lastMonthVal);

  db.close();

  return {
    today: { value: todayVal, ...todayTrend },
    yesterday: { value: yesterdayVal, ...yesterdayTrend },
    thisWeek: { value: thisWeekVal, ...weeklyTrend },
    thisMonth: { value: thisMonthVal, ...monthlyTrend },
  };
}

module.exports = { getMonthDays, getSummaryStats };
