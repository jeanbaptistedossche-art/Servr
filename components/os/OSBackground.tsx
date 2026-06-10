"use client";
import { useEffect, useRef } from "react";

export default function OSBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let t = 0;

    const stars: { x: number; y: number; r: number; phase: number; speed: number }[] = [];
    const lines: { x: number; y: number; vx: number; vy: number; color: string; phase: number }[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function init() {
      if (!canvas) return;
      stars.length = 0;
      lines.length = 0;
      for (let i = 0; i < 200; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.2 + 0.2,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.8,
        });
      }
      const lineColors = [
        "rgba(72,128,255,",
        "rgba(0,220,255,",
        "rgba(144,96,255,",
      ];
      for (let i = 0; i < 18; i++) {
        lines.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.12,
          color: lineColors[i % 3],
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Base background
      ctx.fillStyle = "#000007";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Aurora gradients
      const aurora1 = ctx.createRadialGradient(
        canvas.width * 0.5, -80, 0, canvas.width * 0.5, -80, canvas.width * 0.7
      );
      aurora1.addColorStop(0, "rgba(72,128,255,.07)");
      aurora1.addColorStop(1, "transparent");
      ctx.fillStyle = aurora1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const aurora2 = ctx.createRadialGradient(
        canvas.width * 0.9, canvas.height * 0.2, 0, canvas.width * 0.9, canvas.height * 0.2, canvas.width * 0.5
      );
      aurora2.addColorStop(0, "rgba(144,96,255,.05)");
      aurora2.addColorStop(1, "transparent");
      ctx.fillStyle = aurora2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const aurora3 = ctx.createRadialGradient(
        0, canvas.height, 0, 0, canvas.height, canvas.width * 0.5
      );
      aurora3.addColorStop(0, "rgba(0,220,255,.04)");
      aurora3.addColorStop(1, "transparent");
      ctx.fillStyle = aurora3;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nebula blobs
      const blobs = [
        { x: canvas.width * 0.2 + Math.sin(t * 0.0003) * 30, y: canvas.height * 0.3 + Math.cos(t * 0.0002) * 20, r: 180, color: "rgba(72,128,255,.045)" },
        { x: canvas.width * 0.75 + Math.cos(t * 0.0004) * 25, y: canvas.height * 0.6 + Math.sin(t * 0.0003) * 30, r: 150, color: "rgba(144,96,255,.04)" },
        { x: canvas.width * 0.5 + Math.sin(t * 0.0005) * 20, y: canvas.height * 0.8 + Math.cos(t * 0.0004) * 15, r: 130, color: "rgba(0,220,255,.03)" },
      ];
      for (const blob of blobs) {
        const g = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        g.addColorStop(0, blob.color);
        g.addColorStop(1, "transparent");
        ctx.filter = "blur(40px)";
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.filter = "none";
      }

      // Grid overlay
      ctx.strokeStyle = "rgba(72,128,255,.022)";
      ctx.lineWidth = 1;
      const gs = 56;
      for (let x = 0; x < canvas.width; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Energy lines
      for (const line of lines) {
        line.x += line.vx;
        line.y += line.vy;
        if (line.x < -200) line.x = canvas.width + 200;
        if (line.x > canvas.width + 200) line.x = -200;
        if (line.y < -100) line.y = canvas.height + 100;
        if (line.y > canvas.height + 100) line.y = -100;

        const alpha = (Math.sin(t * 0.001 + line.phase) * 0.5 + 0.5) * 0.12 + 0.04;
        const len = 80 + Math.sin(t * 0.002 + line.phase) * 40;
        const grad = ctx.createLinearGradient(line.x, line.y, line.x + len, line.y + len * 0.3);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.5, `${line.color}${alpha.toFixed(2)})`);
        grad.addColorStop(1, "transparent");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x + len, line.y + len * 0.3);
        ctx.stroke();
      }

      // Stars
      for (const star of stars) {
        const a = Math.sin(t * star.speed * 0.001 + star.phase) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(238,240,255,${(a * 0.7 + 0.1).toFixed(2)})`;
        ctx.fill();
      }

      t++;
      raf = requestAnimationFrame(draw);
    }

    resize();
    init();
    draw();
    window.addEventListener("resize", () => { resize(); init(); });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", () => { resize(); init(); }); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
