import { Link } from "react-router-dom";
import { curriculum, weeks } from "../content/load";
import { resolveSession, shanghaiToday } from "../content/schedule";

export function RoadmapPage({ today = shanghaiToday() }: { today?: string }) {
  const session = resolveSession(today, weeks);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">找工作优先 · 不先刷雅思</p>
          <h1>十二个月路线</h1>
          <p>{curriculum.audience}</p>
        </div>
      </header>
      <section className="panel">
        <h2>每周怎么过</h2>
        <ul className="step-list">
          {curriculum.rhythm.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <div className="roadmap-grid">
        {curriculum.phases.map((phase) => (
          <article className="roadmap-card" key={phase.id}>
            <p className="eyebrow">{phase.when}</p>
            <h3>{phase.title}</h3>
            <p>{phase.goal}</p>
            <p>{phase.materials}</p>
          </article>
        ))}
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>已经排好的周</h2>
          <span>当前 {session.week.id}</span>
        </div>
        <ul className="day-index">
          {weeks.map((week) => (
            <li key={week.id}>
              <Link to={`/week?focus=${week.startsOn}`}>
                {week.id} {week.title}
              </Link>
              <span>
                {week.startsOn} 到 {week.endsOn}。{week.goal}
              </span>
            </li>
          ))}
        </ul>
        <p>
          下一周要在周五放进 content/weeks，周六才能预习。材料用免费链接，当天凑齐文本、音频和视频；跟读稿是原创短句，不复制演讲全文。
        </p>
      </section>
    </section>
  );
}
