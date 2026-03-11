import { useEffect, useRef } from 'react';

export default function Orb({ 
  backgroundColor = '#000000',
  rotateOnHover = true,
  hoverIntensity = 0.5,
  hue = 0.5
}: {
  backgroundColor?: string;
  rotateOnHover?: boolean;
  hoverIntensity?: number;
  hue?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    let time = 0;
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(canvas.width, canvas.height) * 0.3;
      
      // Draw multiple animated orbs
      for (let i = 0; i < 3; i++) {
        const offsetX = Math.sin(time * 0.001 + i * 2) * 50;
        const offsetY = Math.cos(time * 0.001 + i * 2) * 50;
        const currentX = centerX + offsetX;
        const currentY = centerY + offsetY;
        
        // Create gradient for each orb
        const gradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, maxRadius);
        
        const hueValue = (hue + i * 0.1 + time * 0.0001) % 1;
        const rgb = hslToRgb(hueValue, 0.7, 0.5);
        
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
        gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(currentX, currentY, maxRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 30;
        ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
        ctx.beginPath();
        ctx.arc(currentX, currentY, maxRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      // Mouse interaction effect
      if (rotateOnHover) {
        const mouseRadius = 80 * hoverIntensity;
        const mouseGradient = ctx.createRadialGradient(
          centerX + mouseRef.current.x * 100,
          centerY + mouseRef.current.y * 100,
          0,
          centerX + mouseRef.current.x * 100,
          centerY + mouseRef.current.y * 100,
          mouseRadius
        );
        
        const mouseHue = (hue + 0.5) % 1;
        const mouseRgb = hslToRgb(mouseHue, 0.8, 0.6);
        
        mouseGradient.addColorStop(0, `rgba(${mouseRgb.r}, ${mouseRgb.g}, ${mouseRgb.b}, 0.6)`);
        mouseGradient.addColorStop(1, `rgba(${mouseRgb.r}, ${mouseRgb.g}, ${mouseRgb.b}, 0)`);
        
        ctx.fillStyle = mouseGradient;
        ctx.beginPath();
        ctx.arc(
          centerX + mouseRef.current.x * 100,
          centerY + mouseRef.current.y * 100,
          mouseRadius,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      
      time += 16;
    };

    animate();

    // Handle resize
    const handleResize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [backgroundColor, hue, hoverIntensity, rotateOnHover]);

  useEffect(() => {
    if (!rotateOnHover) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = 0;
      mouseRef.current.y = 0;
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [rotateOnHover]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ background: backgroundColor }}
    />
  );
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (p < 0) p += 1;
      if (p > 1) p -= 1;
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (6 * p < 1) {
        r = t; g = q; b = p;
      } else if (2 * p < 1) {
        r = q; g = t; b = p;
      } else if (3 * p < 2) {
        r = p; g = t; b = q;
      } else if (3 * p < 2) {
        r = p; g = q; b = t;
      } else if (6 * p < 3) {
        r = t; g = p; b = q;
      } else if (p >= 1) {
        r = q; g = p; b = t;
      }
      return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = l < 0.5 ? l : l - s + l * s;
    r = hue2rgb(p, q, l).r / 255;
    g = hue2rgb(p, q, l).g / 255;
    b = hue2rgb(p, q, l).b / 255;
  }

  return { r, g, b };
}
