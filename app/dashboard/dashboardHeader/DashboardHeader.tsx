"use client"
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css"
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

export default function DashboardHeader({range , setRange}:any) {
  const locale = useLocale();
  const isRtl = locale === "ar";
    
    const [open, setOpen] = useState(false);
    const CalendarRef = useRef< HTMLDivElement >(null)
    useEffect(()=>{
      function handleClickOuside(event : MouseEvent){
        if (CalendarRef.current && !CalendarRef.current.contains(event.target as Node)){
          setOpen(false)
        }
      }
      document.addEventListener("mousedown" , handleClickOuside)
      return ()=>{
        document.removeEventListener("mousedown" , handleClickOuside)
      }
    },[])

 return(
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      {/* Date section */}
      <div className="relative w-full sm:w-auto">
        <button onClick={()=>setOpen(!open)} className="flex w-full items-center justify-between gap-2 bg-(--card-bg)  px-4 py-2 rounded-lg shadow-sm cursor-pointer">
           <span>{range?.from && range?.to ? `${format(range.from , "dd MMM yyyy")} - ${format(range.to , "dd MMM yyyy")}`: (locale === "ar" ? "إختر التاريخ" : "Choose date")}</span>
           <Calendar size={16} />
        </button>
        {
          open && (
            <div ref={CalendarRef} className={`absolute ${isRtl ? "left-0" : "right-0"} mt-2  max-w-sm bg-(--card-bg) backdrop-blur-md shadow-2xl rounded-xl p-4 z-50 transition-all duration-300 ease-out transform origin-top-right ${open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 pointer-events-none translate-y-2"}`}>
              <DayPicker  mode="range"  selected={range} onSelect={setRange}  />
            </div>
          )
        }
      </div>
    </div>
 )
}