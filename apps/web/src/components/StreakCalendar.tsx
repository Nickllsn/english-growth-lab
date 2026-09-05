interface StreakCalendarProps {
  completedDates: Set<string>;
}

function recentDates(count: number): string[] {
  const dates: string[] = [];
  const current = new Date();
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(current);
    date.setDate(current.getDate() - offset);
    dates.push(date.toLocaleDateString("en-CA"));
  }
  return dates;
}

export function StreakCalendar({ completedDates }: StreakCalendarProps) {
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
        {recentDates(30).map((date) => {
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
