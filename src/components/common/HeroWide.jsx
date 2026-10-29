import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HeroWide.css';

export default function HeroWide({ slides = [], interval = 5000 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  const next = () => setIndex((i) => (i + 1) % n);
  const prev = () => setIndex((i) => (i - 1 + n) % n);

  useEffect(() => {
    if (paused || n < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % n), interval);
    return () => clearInterval(timer);
  }, [paused, n, interval]);

  if (n === 0) return null;

  // 현재 슬라이드 기준 위치: 0=가운데, ±1=양옆, ±2=화면 밖 대기
  const getOffset = (i) => {
    let d = (i - index + n) % n;
    if (d > n / 2) d -= n;
    return d;
  };

  return (
    <section
      className="hw"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hw-stage">
        {slides.map((s, i) => {
          const d = getOffset(i);
          const abs = Math.abs(d);
          const style = {
            '--d': d,
            zIndex: 10 - abs,
            opacity: abs <= 1 ? 1 : 0,
            pointerEvents: abs <= 1 ? 'auto' : 'none',
          };

          const body = (
            <>
              <div className="hw-text">
                {s.tag && <span className="hw-tag">{s.tag}</span>}
                <h2 className="hw-title">{s.title}</h2>
                <ul className="hw-meta">
                  {s.place && <li>📍 {s.place}</li>}
                  {s.period && <li>📅 {s.period}</li>}
                </ul>
                <span className="hw-btn">자세히 보기 →</span>
              </div>
              <div
                className={'hw-img' + (s.poster ? ' hw-img-poster' : '')}
              style={s.poster ? { '--poster': `url(${s.image})` } : undefined}
>
                <img src={s.image} alt={s.title} />
                </div>

            </>
          );

          return d === 0 && s.to ? (
            <Link key={s.id ?? i} to={s.to} className="hw-card hw-center" style={style}>
              {body}
            </Link>
          ) : (
            <div
              key={s.id ?? i}
              className="hw-card hw-side"
              style={style}
              onClick={() => (d < 0 ? prev() : d > 0 ? next() : null)}
            >
              {body}
            </div>
          );
        })}
      </div>

      <div className="hw-controls">
        <button className="hw-arrow" onClick={prev} aria-label="이전">‹</button>
        <div className="hw-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={i === index ? 'active' : ''}
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}번 슬라이드`}
            />
          ))}
        </div>
        <button className="hw-arrow" onClick={next} aria-label="다음">›</button>
      </div>
    </section>
  );
}
