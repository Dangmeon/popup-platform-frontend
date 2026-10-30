import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HeroCoverflow.css';

export default function HeroCoverflow({ slides = [], interval = 4000 }) {
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

  // 현재 슬라이드 기준 위치: 0=가운데, ±1, ±2=양옆, 그 외=숨김
  const getOffset = (i) => {
    let d = (i - index + n) % n;
    if (d > n / 2) d -= n;
    return d;
  };

  return (
    <section
      className="hcf"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button className="hcf-arrow hcf-arrow-prev" onClick={prev} aria-label="이전">‹</button>

      <div className="hcf-stage">
        {slides.map((s, i) => {
          const d = getOffset(i);
          const abs = Math.abs(d);
          const visible = abs <= 2;

          const body = (
            <>
              <img src={s.image} alt={s.title} />
              <div className="hcf-info">
                {s.tag && <em className="hcf-tag">{s.tag}</em>}
                <strong className="hcf-title">{s.title}</strong>
                {s.sub && <p className="hcf-sub">{s.sub}</p>}
                <span className="hcf-more">자세히 보기</span>
              </div>
            </>
          );

          const style = {
            '--d': d,
            '--abs': abs,
            zIndex: 10 - abs,
            opacity: visible ? 1 : 0,
            pointerEvents: visible ? 'auto' : 'none',
          };

          return d === 0 && s.to ? (
            <Link key={s.id ?? i} to={s.to} className="hcf-card hcf-center" style={style}>
              {body}
            </Link>
          ) : (
            <div
              key={s.id ?? i}
              className="hcf-card"
              style={style}
              onClick={() => (d < 0 ? prev() : d > 0 ? next() : null)}
            >
              {body}
            </div>
          );
        })}
      </div>

      <button className="hcf-arrow hcf-arrow-next" onClick={next} aria-label="다음">›</button>
    </section>
  );
}
