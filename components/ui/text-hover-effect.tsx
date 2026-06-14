"use client";
import React, { useRef, useState, useEffect } from "react";
import { motion, useSpring, useMotionTemplate, useAnimationFrame, useMotionValue } from "framer-motion";

function KineticWord({
  text,
  globalMouseX,
  globalMouseY,
  svgRef,
}: {
  text: string;
  globalMouseX: any;
  globalMouseY: any;
  svgRef: React.RefObject<SVGSVGElement>;
}) {
  const letters = text.split("");
  const spansRef = useRef<(SVGTSpanElement | null)[]>([]);

  // Physics state for each letter
  const physicsRef = useRef(
    letters.map(() => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      targetX: 0,
      targetY: 0,
    }))
  );

  useAnimationFrame(() => {
    if (!svgRef.current) return;
    const mx = globalMouseX.get();
    const my = globalMouseY.get();

    // 1. Calculate target wobble for each letter based on mouse distance
    letters.forEach((_, i) => {
      const span = spansRef.current[i];
      const phys = physicsRef.current[i];
      if (!span) return;

      const rect = span.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dxMouse = mx - centerX;
      const dyMouse = my - centerY;
      const dist = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
      const maxDist = 120;

      if (dist < maxDist && mx > -500) {
        const force = (maxDist - dist) / maxDist;
        phys.targetX = -dxMouse * force * 0.25;
        phys.targetY = -dyMouse * force * 0.25;
      } else {
        phys.targetX = 0;
        phys.targetY = 0;
      }
    });

    // 2. Spring physics integration
    const stiffness = 0.15;
    const damping = 0.8;

    letters.forEach((_, i) => {
      const phys = physicsRef.current[i];
      const ax = (phys.targetX - phys.x) * stiffness;
      const ay = (phys.targetY - phys.y) * stiffness;
      phys.vx = (phys.vx + ax) * damping;
      phys.vy = (phys.vy + ay) * damping;
      phys.x += phys.vx;
      phys.y += phys.vy;
    });

    // 3. Apply differential dx/dy to prevent accumulation
    let prevX = 0;
    let prevY = 0;

    letters.forEach((_, i) => {
      const span = spansRef.current[i];
      const phys = physicsRef.current[i];
      if (!span) return;

      const dx = phys.x - prevX;
      const dy = phys.y - prevY;

      // If there is practically no offset, remove the attributes completely
      // to let the browser restore perfect native font kerning and spacing!
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
        span.removeAttribute("dx");
        span.removeAttribute("dy");
      } else {
        span.setAttribute("dx", dx.toFixed(2));
        span.setAttribute("dy", dy.toFixed(2));
      }

      prevX = phys.x;
      prevY = phys.y;
    });
  });

  return (
    <>
      {letters.map((letter, i) => (
        <tspan
          key={i}
          ref={(el) => {
            spansRef.current[i] = el;
          }}
        >
          {letter === " " ? "\u00A0" : letter}
        </tspan>
      ))}
    </>
  );
}

export const TextHoverEffect = ({
  text,
  duration,
}: {
  text: string;
  duration?: number;
  automatic?: boolean;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState(false);

  const globalMouseX = useMotionValue(-1000);
  const globalMouseY = useMotionValue(-1000);

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      globalMouseX.set(e.clientX);
      globalMouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleGlobalMove);
    return () => window.removeEventListener("mousemove", handleGlobalMove);
  }, [globalMouseX, globalMouseY]);

  const cx = useSpring(50, { stiffness: 200, damping: 20 });
  const cy = useSpring(50, { stiffness: 200, damping: 20 });
  const maskPositionX = useMotionTemplate`${cx}%`;
  const maskPositionY = useMotionTemplate`${cy}%`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((e.clientX - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((e.clientY - svgRect.top) / svgRect.height) * 100;
      cx.set(cxPercentage);
      cy.set(cyPercentage);
    }
  };

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      xmlSpace="preserve"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
      className="select-none"
    >
      <defs>
        <linearGradient id="textGradient" gradientUnits="userSpaceOnUse" cx="50%" cy="50%" r="25%">
          {hovered && (
            <>
              <stop offset="0%" stopColor={"var(--physics)"} />
              <stop offset="25%" stopColor={"var(--chemistry)"} />
              <stop offset="50%" stopColor={"var(--biology)"} />
              <stop offset="75%" stopColor={"var(--math)"} />
              <stop offset="100%" stopColor={"var(--physics)"} />
            </>
          )}
        </linearGradient>

        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="20%"
          cx={maskPositionX as any}
          cy={maskPositionY as any}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#revealMask)" />
        </mask>
      </defs>

      {/* Base stroke text (semi-transparent on hover) */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        className="font-[helvetica] text-7xl font-bold tracking-tighter fill-transparent stroke-neutral-200 [font-optical-sizing:auto] dark:stroke-neutral-800"
        style={{ opacity: hovered ? 0.7 : 0 }}
      >
        <KineticWord text={text} globalMouseX={globalMouseX} globalMouseY={globalMouseY} svgRef={svgRef} />
      </text>

      {/* Base stroke text (solid) */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        className="font-[helvetica] text-7xl font-bold tracking-tighter fill-transparent stroke-neutral-200 [font-optical-sizing:auto] dark:stroke-neutral-800"
      >
        <KineticWord text={text} globalMouseX={globalMouseX} globalMouseY={globalMouseY} svgRef={svgRef} />
      </text>

      {/* Colorful masked text */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="url(#textGradient)"
        strokeWidth="0.3"
        mask="url(#textMask)"
        className="font-[helvetica] text-7xl font-bold tracking-tighter fill-transparent [font-optical-sizing:auto]"
      >
        <KineticWord text={text} globalMouseX={globalMouseX} globalMouseY={globalMouseY} svgRef={svgRef} />
      </text>
    </svg>
  );
};
