import { useEffect, useRef } from 'react';

type AntigravityDot = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  ripplePulse: number;
  color: string;
  driftSpeed: number;
  orbitAngle: number;
  orbitRadius: number;
  mass: number;
  layer: number;
};

type Ripple = {
  x: number;
  y: number;
  createdAt: number;
  maxRadius: number;
};

function getDotCount(width: number): number {
  if (width < 768) return 80;
  if (width < 1024) return 140;
  return 260;
}

export function HeroDotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.parentElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !hero || !context) return;

    const activeCanvas = canvas;
    const activeHero = hero;
    const ctx = context;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = 0;
    let isVisible = true;
    let dots: AntigravityDot[] = [];
    let ripples: Ripple[] = [];

    let pointer = {
      x: -2000,
      y: -2000,
      active: false,
      down: false,
      prevX: -2000,
      prevY: -2000,
      speed: 0,
    };

    const getBlockedRects = () => {
      const heroRect = activeHero.getBoundingClientRect();
      const elements = Array.from(
        activeHero.querySelectorAll<HTMLElement>('.hero-copy, .status-card')
      );
      return elements.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          left: r.left - heroRect.left - 8,
          right: r.right - heroRect.left + 8,
          top: r.top - heroRect.top - 8,
          bottom: r.bottom - heroRect.top + 8,
        };
      });
    };

    function isInsideBlocked(x: number, y: number, exclusions: ReturnType<typeof getBlockedRects>): boolean {
      return exclusions.some(
        (b) => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom
      );
    }

    function initDots() {
      const count = getDotCount(window.innerWidth);
      dots = [];

      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const layer = Math.random(); // 0 = far, 1 = near

        let radius = 1.5;
        let baseAlpha = 0.40;
        let mass = 1;

        if (layer > 0.8) {
          // Foreground particles
          radius = 2 + Math.random() * 0.5;
          baseAlpha = 0.45;
          mass = 1.6;
        } else if (layer > 0.45) {
          // Midground particles
          radius = 1.75 + Math.random() * 0.5;
          baseAlpha = 0.42 + Math.random() * 0.01;
          mass = 1.2;
        } else {
          // Background micro-particles
          radius = 1.5 + Math.random() * 0.5;
          baseAlpha = 0.40;
          mass = 0.8;
        }

        const color = Math.random() < 0.68 ? '8, 42, 107' : '0, 170, 255';

        dots.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius,
          baseAlpha,
          alpha: baseAlpha,
          ripplePulse: 0,
          color,
          driftSpeed: 0.18 + Math.random() * 0.25,
          orbitAngle: Math.random() * Math.PI * 2,
          orbitRadius: 3 + Math.random() * 8,
          mass,
          layer,
        });
      }
    }

    function resize() {
      const rect = activeHero.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      activeCanvas.width = Math.round(width * dpr);
      activeCanvas.height = Math.round(height * dpr);
      activeCanvas.style.width = `${width}px`;
      activeCanvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      initDots();
      ripples = [];
      draw(performance.now(), true);
    }

    function draw(now: number, staticOnly = false, delta = 1) {
      ctx.clearRect(0, 0, width, height);
      if (!dots.length) return;

      const exclusions = getBlockedRects();
      const seconds = now / 1000;

      // Filter expired ripples
      ripples = ripples.filter((r) => now - r.createdAt < 900);

      dots.forEach((dot) => {
        if (!staticOnly && !reducedMotion.matches) {
          // 1. Antigravity Ambient Orbital Drift (Fluid floating flow)
          dot.orbitAngle += dot.driftSpeed * 0.02 * delta;
          const targetX = dot.baseX + Math.cos(dot.orbitAngle) * dot.orbitRadius + Math.sin(seconds * 0.3 + dot.baseY * 0.01) * 4;
          const targetY = dot.baseY + Math.sin(dot.orbitAngle * 0.8) * dot.orbitRadius - Math.cos(seconds * 0.25 + dot.baseX * 0.01) * 3;

          // Gentle spring restoring force toward fluid anchor
          const springK = 0.007 / dot.mass;
          dot.vx += (targetX - dot.x) * springK * delta;
          dot.vy += (targetY - dot.y) * springK * delta;

          // Gentle continuous upward antigravity lift
          dot.vy -= 0.004 * delta;

          // 2. Cursor Antigravity Repulsion
          if (pointer.active) {
            const dx = dot.x - pointer.x;
            const dy = dot.y - pointer.y;
            const dist = Math.hypot(dx, dy);
            const repelRadius = 170;

            if (dist < repelRadius && dist > 0.001) {
              const normalX = dx / dist;
              const normalY = dy / dist;
              const power = (1 - dist / repelRadius) ** 2;

              // Antigravity push
              const repelForce = power * (3.8 / dot.mass);
              dot.vx += normalX * repelForce * delta;
              dot.vy += normalY * repelForce * delta;

              // Tangential swirl (vortex deflection like Google Antigravity)
              const swirlPower = power * 1.4;
              dot.vx += -normalY * swirlPower * delta;
              dot.vy += normalX * swirlPower * delta;
            }
          }

          // 3. Shockwave ripple impulse on click
          ripples.forEach((r) => {
            const age = (now - r.createdAt) / 900;
            const currentRadius = age * r.maxRadius;
            const dx = dot.x - r.x;
            const dy = dot.y - r.y;
            const dist = Math.hypot(dx, dy);
            const distDiff = Math.abs(dist - currentRadius);

            if (distDiff < 45 && dist > 0.01) {
              const rippleStrength = (1 - distDiff / 45) * (1 - age);
              dot.ripplePulse = Math.max(dot.ripplePulse, rippleStrength);
              const impulse = rippleStrength * 4.2;
              dot.vx += (dx / dist) * impulse * delta;
              dot.vy += (dy / dist) * impulse * delta;
            }
          });

          dot.ripplePulse *= Math.pow(0.94, delta);

          // 4. Fluid damping / friction
          const damping = Math.pow(0.94, delta);
          dot.vx *= damping;
          dot.vy *= damping;

          // Integrate position
          dot.x += dot.vx * delta;
          dot.y += dot.vy * delta;

          // Wrap edges with gentle reset
          if (dot.y < -20) {
            dot.y = height + 10;
            dot.baseY = height + 10;
          } else if (dot.y > height + 20) {
            dot.y = -10;
            dot.baseY = -10;
          }
          if (dot.x < -20) {
            dot.x = width + 10;
            dot.baseX = width + 10;
          } else if (dot.x > width + 20) {
            dot.x = -10;
            dot.baseX = -10;
          }
        }

        // Draw dot
        const isBlocked = isInsideBlocked(dot.x, dot.y, exclusions);
        const restingAlpha = isBlocked ? Math.min(dot.baseAlpha, 0.15) : dot.baseAlpha;

        // Proximity highlight near cursor
        const distToCursor = pointer.active ? Math.hypot(dot.x - pointer.x, dot.y - pointer.y) : 9999;
        const proximity = distToCursor < 160 && !staticOnly ? 1 - distToCursor / 160 : 0;
        const currentRadius = dot.radius * (1 + proximity);
        const interactionBoost = Math.max(proximity * 0.24, staticOnly ? 0 : dot.ripplePulse * 0.32);
        const renderAlpha = Math.min(restingAlpha + (isBlocked ? 0 : interactionBoost), isBlocked ? 0.15 : 0.45);

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dot.color}, ${renderAlpha})`;
        ctx.fill();
      });
    }

    function animate(now: number) {
      if (!isVisible || document.hidden || reducedMotion.matches) return;
      frame = window.requestAnimationFrame(animate);

      if (now - lastTime < 1000 / 60) return;
      const delta = lastTime ? Math.min((now - lastTime) / (1000 / 60), 2) : 1;
      lastTime = now;
      draw(now, false, delta);
    }

    function getPoint(e: PointerEvent) {
      const rect = activeHero.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onPointerMove(e: PointerEvent) {
      if (reducedMotion.matches) return;
      const p = getPoint(e);
      const dist = Math.hypot(p.x - pointer.prevX, p.y - pointer.prevY);
      pointer.speed = dist;
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = true;
    }

    function onPointerDown(e: PointerEvent) {
      if (reducedMotion.matches || e.button > 0) return;
      const p = getPoint(e);
      pointer.down = true;
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = true;

      // Add antigravity click pulse
      ripples.push({
        x: p.x,
        y: p.y,
        createdAt: performance.now(),
        maxRadius: Math.min(width, height) * 0.45,
      });
      if (ripples.length > 4) ripples.shift();
    }

    function onPointerUp() {
      pointer.down = false;
    }

    function onPointerLeave() {
      pointer.active = false;
      pointer.x = -2000;
      pointer.y = -2000;
    }

    function onVisibility() {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
      } else if (isVisible && !reducedMotion.matches) {
        lastTime = 0;
        frame = window.requestAnimationFrame(animate);
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? false;
        if (!isVisible) {
          window.cancelAnimationFrame(frame);
        } else if (!document.hidden && !reducedMotion.matches) {
          lastTime = 0;
          frame = window.requestAnimationFrame(animate);
        }
      },
      { threshold: 0 }
    );

    const resizeObserver = new ResizeObserver(resize);

    observer.observe(activeHero);
    resizeObserver.observe(activeHero);
    resize();

    if (!reducedMotion.matches) {
      frame = window.requestAnimationFrame(animate);
    }

    activeHero.addEventListener('pointermove', onPointerMove, { passive: true });
    activeHero.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    activeHero.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frame);
      activeHero.removeEventListener('pointermove', onPointerMove);
      activeHero.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      activeHero.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}
