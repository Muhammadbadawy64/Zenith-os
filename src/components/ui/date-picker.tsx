"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_AR = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  placeholder?: string;
  locale: string;
  className?: string;
  direction?: "up" | "down";
}

export function CustomDatePicker({ value, onChange, placeholder = "Select Date", locale, className = "", direction = "down" }: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const initialDate = value ? new Date(value) : new Date();
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
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

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDay = new Date(viewYear, viewMonth, 1).getDay();

  const handleDayClick = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const displayDate = value ? new Date(value).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : placeholder;
  const isRTL = locale === "ar";
  
  const popupClasses = `absolute z-[120] p-3 w-64 glass-strong rounded-xl border border-white/10 shadow-2xl ${isRTL ? "right-0" : "left-0"}`;

  return (
    <div className={`relative ${className}`} ref={containerRef} dir={isRTL ? "rtl" : "ltr"}>
      <div 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-10 w-full bg-background/50 border border-input hover:border-brainhance-purple/30 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors overflow-hidden"
      >
        <CalendarDays className="w-4 h-4 shrink-0 text-brainhance-purple" />
        <span className={value ? "text-foreground" : "text-muted-foreground truncate"}>{displayDate}</span>
      </div>
      
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: direction === "up" ? 5 : -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === "up" ? 5 : -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={popupClasses}
            style={direction === "up" ? { bottom: "100%", marginBottom: "0.25rem" } : { top: "100%", marginTop: "0.25rem" }}
          >
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-foreground">
                {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <div className="text-sm font-bold">
                {isRTL ? MONTHS_AR[viewMonth] : MONTHS_EN[viewMonth]} {viewYear}
              </div>
              <button type="button" onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-foreground">
                {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {(isRTL ? DAYS_AR : DAYS_EN).map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
              ))}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const isSelected = value && new Date(value).getDate() === day && new Date(value).getMonth() === viewMonth && new Date(value).getFullYear() === viewYear;
                const isToday = new Date().getDate() === day && new Date().getMonth() === viewMonth && new Date().getFullYear() === viewYear;
                
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDayClick(day); }}
                    className={`aspect-square rounded-md text-xs flex items-center justify-center transition-all hover:scale-110 
                      ${isSelected ? "bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white font-bold shadow-md shadow-brainhance-purple/20" 
                      : isToday ? "border border-brainhance-purple/40 text-brainhance-glow bg-brainhance-purple/10" 
                      : "hover:bg-white/5"}
                    `}
                  >
                    {day}
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
