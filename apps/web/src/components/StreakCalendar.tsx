interface StreakCalendarProps {
  completedDates: Set<string>;
  today: string;
}

function recentDates(today: string, count: number): string[] {
  const [year, month, day] = today.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  const dates: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() - offset);
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

export function StreakCalendar({ completedDates, today }: StreakCalendarProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">LAST 30 DAYS</p>
          <h2>学习足迹</h2>
        </div>
        <span>{completedDates.size} 天已完成</span>
      </div>
      <div className="streak-calendar">
        {recentDates(today, 30).map((date) => {
          const completed = completedDates.has(date);
          return (
            <span
              aria-label={`${date}：${completed ? "已完成" : "未完成"}`}
              className={completed ? "calendar-day completed" : "calendar-day"}
              key={date}
              title={date}
            >
              {Number(date.slice(-2))}
            </span>
          );
        })}
      </div>
    </section>
  );
}
