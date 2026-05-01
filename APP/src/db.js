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
  const rows = db.prepare(`
    SELECT Day, Amount FROM bread_sales 
    WHERE Year = ? AND Month = ?
    ORDER BY Day ASC
  `).all(year, month + 1);
  
  db.close();

  // Превращаем результат в формат, который ждет фронтенд (маленькие буквы)
  return rows.map(r => ({ 
    day: r.Day, 
    count: r.Amount 
  }));
}

// Статистика для карточек
function getSummaryStats() {
  const db = getDB();
  const today = new Date();
  const d = today.getDate();
  const m = today.getMonth() + 1;
  const y = today.getFullYear();

  // Сегодня
  const todayRow = db.prepare(
    `SELECT Amount FROM bread_sales WHERE Day=? AND Month=? AND Year=?`
  ).get(d, m, y);

  // Вчера
  const yesterdayDate = new Date();
  yesterdayDate.setDate(today.getDate() - 1);
  const ydRow = db.prepare(
    `SELECT Amount FROM bread_sales WHERE Day=? AND Month=? AND Year=?`
  ).get(yesterdayDate.getDate(), yesterdayDate.getMonth() + 1, yesterdayDate.getFullYear());

  // Неделя
    const weekStart = new Date();
    weekStart.setDate(today.getDate() - 7);

    const weekRow = db.prepare(`
    SELECT SUM(Amount) as total FROM bread_sales
    WHERE (Year = ? AND Month = ? AND Day <= ?)
        OR (Year = ? AND Month = ? AND Day > ?)
    `).get(y, m, d, weekStart.getFullYear(), weekStart.getMonth() + 1, weekStart.getDate());
  // Месяц
  const monthRow = db.prepare(`
    SELECT SUM(Amount) as total FROM bread_sales
    WHERE Year=? AND Month=?
  `).get(y, m);

  db.close();

  return {
    today:     todayRow?.Amount    ?? 0,
    yesterday: ydRow?.Amount       ?? 0,
    thisWeek:  weekRow?.total      ?? 0,
    thisMonth: monthRow?.total     ?? 0,
  };
}

module.exports = { getMonthDays, getSummaryStats };