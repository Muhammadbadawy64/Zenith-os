"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface MonthPickerProps {
  value: string; // YYYY-MM
  onChange: (val: string) => void;
  locale: string;
  className?: string;
  align?: "left" | "right" | "center";
}

export function MonthPicker({ value, onChange, locale, className = "", align = "center" }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const initialDate = value ? new Date(value + "-01") : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthClick = (monthIndex: number) => {
    const mm = String(monthIndex + 1).padStart(2, "0");
    onChange(`${viewYear}-${mm}`);
    setOpen(false);
  };

  const nextYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewYear(y => y + 1);
  };

  const prevYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewYear(y => y - 1);
  };

  const displayDate = value 
    ? `${locale === "ar" ? MONTHS_AR[parseInt(value.split("-")[1]) - 1] : MONTHS_EN[parseInt(value.split("-")[1]) - 1]} ${value.split("-")[0]}`
    : "";
    
  const isRTL = locale === "ar";
  
  const alignmentClass = align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <div className={`relative ${className}`} ref={containerRef} dir={isRTL ? "rtl" : "ltr"}>
      <div 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-brainhance-purple/50 rounded-xl px-4 py-2 text-sm text-white cursor-pointer transition-colors shadow-sm"
      >
        <Calendar className="w-4 h-4 shrink-0 text-brainhance-glow" />
        <span className="font-semibold">{displayDate}</span>
      </div>
      
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`absolute z-[120] p-4 w-64 glass-strong rounded-2xl border border-white/10 shadow-2xl top-full mt-2 ${alignmentClass}`}
          >
            <div className="flex items-center justify-between mb-4 bg-white/5 p-1 rounded-xl">
              <button type="button" onClick={prevYear} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <div className="text-base font-black text-brainhance-glow">
                {viewYear}
              </div>
              <button type="button" onClick={nextYear} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {(isRTL ? MONTHS_AR : MONTHS_EN).map((m, i) => {
                const isSelected = value && value === `${viewYear}-${String(i + 1).padStart(2, "0")}`;
                const isCurrentMonth = new Date().getFullYear() === viewYear && new Date().getMonth() === i;
                
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleMonthClick(i); }}
                    className={`py-3 rounded-xl text-xs font-bold transition-all
                      ${isSelected ? "bg-gradient-to-r from-brainhance-purple to-brainhance-glow text-white shadow-lg shadow-brainhance-purple/30 scale-105" 
                      : isCurrentMonth ? "border border-brainhance-purple/40 text-brainhance-glow bg-brainhance-purple/10 hover:bg-brainhance-purple/20" 
                      : "hover:bg-white/10 text-muted-foreground hover:text-foreground"}
                    `}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
