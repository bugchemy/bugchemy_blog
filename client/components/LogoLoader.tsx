"use client";
import { motion } from "framer-motion";
import React, { useMemo } from "react";

interface LogoLoaderProps {
  size?: "sm" | "md" | "lg" | number; // allow numeric size
  text?: string;
  speed?: number;
  fullscreen?: boolean; // full-screen blur background
  bounce?: boolean; // toggle logo bounce
}

const sizeMap = {
  sm: 60,
  md: 100,
  lg: 120, // reduced default lg
};

export const LogoLoader: React.FC<LogoLoaderProps> = ({
  size = "md",
  text = "Loading...",
  speed = 1,
  fullscreen = false,
  bounce = true,
}) => {
  // Adaptive logo size
  const logoSize =
    typeof size === "number"
      ? size
      : fullscreen
      ? Math.min(window.innerWidth, window.innerHeight) * 0.15
      : sizeMap[size];

  // Randomized bubble data
  const bubbles = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        leftOffset: Math.random() * 20 - 10,
        delay: Math.random() * 1.5,
        scale: 0.6 + Math.random() * 0.8,
      })),
    []
  );

  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullscreen
          ? "fixed inset-0 z-50 bg-transparent backdrop-blur-sm"
          : "relative w-full h-full"
      } overflow-visible`}
    >
      {/* Glow behind logo */}
      <div
        className="absolute rounded-full blur-2xl opacity-40 transition-colors duration-500"
        style={{
          width: `${logoSize * 1.5}px`,
          height: `${logoSize * 1.5}px`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="w-full h-full rounded-full dark:bg-blue-300/20 bg-blue-500/20" />
      </div>

      {/* Logo (bouncing controlled by bounce prop) */}
      <motion.img
        src="/logo.png"
        alt="Logo"
        width={logoSize}
        height={logoSize}
        className="z-10 select-none pointer-events-none"
        animate={bounce ? { y: [0, -8, 0] } : { y: 0 }}
        transition={{
          duration: 1.6 / speed,
          repeat: bounce ? Infinity : 0,
          ease: "easeInOut",
        }}
      />

      {/* Bubbles */}
      <div
        className="absolute"
        style={{
          top: "calc(50% - 40px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: `${logoSize * 0.6}px`,
          height: `${logoSize * 0.6}px`,
          pointerEvents: "none",
        }}
      >
        {bubbles.map((b) => (
          <motion.div
            key={b.id}
            className="absolute rounded-full bg-blue-400/60 dark:bg-blue-200/50"
            style={{
              width: `${8 * b.scale}px`,
              height: `${8 * b.scale}px`,
              left: `calc(50% + ${b.leftOffset}px)`,
              bottom: 0,
            }}
            animate={{
              y: [-5, -80],
              opacity: [1, 0],
              x: [0, b.leftOffset * 2],
              scale: [b.scale, b.scale * 0.9],
            }}
            transition={{
              duration: 2.2 / speed,
              repeat: Infinity,
              delay: b.delay,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      {text && (
        <motion.p
          className="mt-4 text-gray-700 dark:text-gray-300 text-sm font-medium"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};
