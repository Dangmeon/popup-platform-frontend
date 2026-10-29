import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HeroCarousel.css';

export default function HeroCarousel({ slides = [], interval = 4000 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  const next = () => setIndex((i) => (i + 1) % n);
  const prev = () => setIndex((i) => (i - 1 + n) % n);

  useEffect(() => {
    if (paused || n < 2) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [paused, n, interval]);

  if (n === 0) return null;

  // 현재 슬라이드 기준 위치: 0=가운데, -1=왼쪽, 1=오른쪽, 그 외=숨김
  const getOffset = (i) => {
    let d = (i - index + n) % n;
    if (d > n / 2) d -= n;
    return d;
  };

  return (
    <section
      className="hc"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hc-stage">
        {slides.map((s, i) => {
          const d = getOffset(i);
          const pos = d === 0 ? 'center' : d === -1 ? 'prev' : d === 1 ? 'next' : 'hidden';
          const body = (
            <>
              <img src={s.image} alt={s.title} />
              <div className="hc-caption">
                <strong>{s.title}</strong>
                {s.sub && <span>{s.sub}</span>}
              </div>
            </>
          );
          return pos === 'center' && s.to ? (
            <Link key={s.id ?? i} to={s.to} className={`hc-slide hc-${pos}`}>
              {body}
            </Link>
          ) : (
            <div
              key={s.id ?? i}
              className={`hc-slide hc-${pos}`}
              onClick={() => pos === 'prev' ? prev() : pos === 'next' ? next() : null}
            >
              {body}
            </div>
          );
        })}
      </div>

      <div className="hc-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={i === index ? 'active' : ''}
            onClick={() => setIndex(i)}
            aria-label={`${i + 1}번 슬라이드`}
          />
        ))}
      </div>
    </section>
  );
}
