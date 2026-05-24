import { useEffect, useRef } from "react";

export function GameBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string }[] = [];

    const colors = ["rgba(139,92,246,", "rgba(109,40,217,", "rgba(167,139,250,", "rgba(245,158,11,"];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.6 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.fill();
      });

      animFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Deep base */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #0e0828 0%, #05050f 60%)" }}
      />

      {/* Ambient orb 1 - top left */}
      <div
        className="absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          top: "-180px",
          left: "-120px",
          background: "radial-gradient(circle, rgba(109,40,217,0.28) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "orb-drift-1 24s ease-in-out infinite",
        }}
      />

      {/* Ambient orb 2 - bottom right */}
      <div
        className="absolute rounded-full"
        style={{
          width: 700,
          height: 700,
          bottom: "-200px",
          right: "-150px",
          background: "radial-gradient(circle, rgba(76,29,149,0.22) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: "orb-drift-2 30s ease-in-out infinite",
        }}
      />

      {/* Ambient orb 3 - center */}
      <div
        className="absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          top: "30%",
          left: "40%",
          background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "orb-drift-3 20s ease-in-out infinite",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          animation: "grid-pulse 8s ease-in-out infinite",
        }}
      />

      {/* Top vignette */}
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: 200, background: "linear-gradient(to bottom, rgba(5,5,15,0.6) 0%, transparent 100%)" }}
      />

      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: 200, background: "linear-gradient(to top, rgba(5,5,15,0.8) 0%, transparent 100%)" }}
      />

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-60" />
    </div>
  );
}
