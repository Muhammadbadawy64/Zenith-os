"use client";

import { motion } from "framer-motion";

const STATIC_PARTICLES = [
  { id: 0, size: 4, x: 10, y: 20, duration: 20, delay: 0, opacity: 0.15 },
  { id: 1, size: 3, x: 25, y: 15, duration: 18, delay: 1, opacity: 0.12 },
  { id: 2, size: 5, x: 40, y: 30, duration: 22, delay: 2, opacity: 0.18 },
  { id: 3, size: 3.5, x: 55, y: 10, duration: 19, delay: 0.5, opacity: 0.1 },
  { id: 4, size: 4.5, x: 70, y: 25, duration: 21, delay: 1.5, opacity: 0.14 },
  { id: 5, size: 3, x: 85, y: 35, duration: 17, delay: 2.5, opacity: 0.16 },
  { id: 6, size: 4, x: 15, y: 50, duration: 23, delay: 0.8, opacity: 0.11 },
  { id: 7, size: 3.5, x: 30, y: 45, duration: 20, delay: 1.8, opacity: 0.17 },
  { id: 8, size: 5, x: 45, y: 55, duration: 18, delay: 0.3, opacity: 0.13 },
  { id: 9, size: 4, x: 60, y: 40, duration: 22, delay: 1.3, opacity: 0.15 },
  { id: 10, size: 3, x: 75, y: 60, duration: 19, delay: 2.3, opacity: 0.12 },
  { id: 11, size: 4.5, x: 5, y: 65, duration: 21, delay: 0.6, opacity: 0.18 },
  { id: 12, size: 3.5, x: 20, y: 75, duration: 17, delay: 1.6, opacity: 0.1 },
  { id: 13, size: 5, x: 35, y: 70, duration: 20, delay: 2.6, opacity: 0.14 },
  { id: 14, size: 4, x: 50, y: 80, duration: 23, delay: 0.9, opacity: 0.16 },
  { id: 15, size: 3, x: 65, y: 75, duration: 18, delay: 1.9, opacity: 0.11 },
  { id: 16, size: 4.5, x: 80, y: 85, duration: 22, delay: 0.4, opacity: 0.17 },
  { id: 17, size: 3.5, x: 90, y: 5, duration: 19, delay: 1.4, opacity: 0.13 },
  { id: 18, size: 4, x: 35, y: 85, duration: 21, delay: 2.4, opacity: 0.15 },
  { id: 19, size: 5, x: 65, y: 5, duration: 17, delay: 0.7, opacity: 0.12 },
];

// Animated floating particles for background ambiance
export function FloatingParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {STATIC_PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: `radial-gradient(circle, rgba(139, 92, 246, ${p.opacity}), transparent)`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Large gradient orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.08), transparent 70%)",
          top: "10%",
          right: "-10%",
        }}
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.06), transparent 70%)",
          bottom: "10%",
          left: "-5%",
        }}
        animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// Submarine loading animation
export function SubmarineLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        className="relative"
        animate={{
          y: [0, -15, 5, -10, 0],
          rotate: [0, -5, 3, -3, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          width="80"
          height="40"
          viewBox="0 0 80 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Submarine body */}
          <ellipse cx="40" cy="22" rx="30" ry="14" fill="url(#sub-gradient)" />
          {/* Periscope */}
          <rect x="45" y="4" width="3" height="12" rx="1.5" fill="#A855F7" />
          <rect x="43" y="2" width="7" height="4" rx="2" fill="#8B5CF6" />
          {/* Window */}
          <circle cx="32" cy="22" r="5" fill="#0F0A1A" stroke="#C084FC" strokeWidth="1.5" />
          <circle cx="32" cy="22" r="3" fill="rgba(139, 92, 246, 0.3)" />
          {/* Propeller */}
          <motion.g
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "12px 22px" }}
          >
            <ellipse cx="12" cy="18" rx="2" ry="5" fill="#A855F7" opacity="0.7" />
            <ellipse cx="12" cy="26" rx="2" ry="5" fill="#A855F7" opacity="0.7" />
          </motion.g>
          {/* Bubbles */}
          <motion.circle
            cx="65"
            cy="15"
            r="2"
            fill="rgba(192, 132, 252, 0.4)"
            animate={{ y: [-5, -20], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle
            cx="60"
            cy="18"
            r="1.5"
            fill="rgba(192, 132, 252, 0.3)"
            animate={{ y: [-3, -15], opacity: [0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
          <defs>
            <linearGradient id="sub-gradient" x1="10" y1="22" x2="70" y2="22">
              <stop offset="0%" stopColor="#6D28D9" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      {/* Water waves */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-brainhance-purple"
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Page transition wrapper
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Animated counter
export function AnimatedCounter({
  value,
  suffix = "",
  className = "",
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {value}
      {suffix}
    </motion.span>
  );
}

// Glowing card wrapper
export function GlowCard({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      onClick={onClick}
      className={`relative rounded-2xl ${onClick ? "cursor-pointer" : ""} ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brainhance-purple/20 via-transparent to-brainhance-violet/20 rounded-2xl pointer-events-none" />
      <div className="relative glass rounded-2xl p-6 h-full">{children}</div>
    </motion.div>
  );
}
