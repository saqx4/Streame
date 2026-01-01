import { useEffect, useRef, useState } from 'react';
import './LazyRender.css';

interface LazyRenderProps {
  children: React.ReactNode;
  rootMargin?: string;
  minHeight?: number | string;
}

/**
 * Simple viewport-aware wrapper to defer rendering until the element is near view.
 * Reduces initial DOM work for long home/category pages.
 */
const LazyRender = ({ children, rootMargin = '200px', minHeight = 200 }: LazyRenderProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={containerRef} className="lazy-render" style={{ minHeight }}>
      {isVisible ? children : <div className="lazy-render-placeholder" />}
    </div>
  );
};

export default LazyRender;
