"use client";

import { TrendingUp, TrendingDown, ArrowUpRight, AlertCircle, Sparkles, UserRound, Hourglass, Check } from "lucide-react";
import CountUp from "react-countup";
import Amount from "@/app/clinicDash/financial/components/Amount";
import type { FinancialSummary } from "@/app/clinicDash/financial/lib/types";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";


interface Props {
  summary: FinancialSummary | null;
  loading: boolean;
  completedAppointmentsCount: number;
  doctorPercentage: number;
}

function BentoSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-[5fr_4fr_3fr]">
        <div className="rounded-3xl bg-(--semi-card-bg) animate-pulse" style={{ minHeight: 240 }} />
        <div className="rounded-3xl bg-(--semi-card-bg) animate-pulse" style={{ minHeight: 240 }} />
        <div className="rounded-3xl bg-(--semi-card-bg) animate-pulse" style={{ minHeight: 240 }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-3xl bg-(--semi-card-bg) animate-pulse" style={{ minHeight: 140 }} />
        ))}
      </div>
    </div>
  );
}

function SparkBars({ color, values }: { color: string; values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <svg width={values.length * 10} height="28" viewBox={`0 0 ${values.length * 10} 28`} aria-hidden="true">
      {values.map((v, i) => {
        const h = Math.max(3, (v / max) * 26);
        return (
          <rect
            key={i}
            x={i * 10}
            y={28 - h}
            width={7}
            height={h}
            rx={3}
            fill={color}
            opacity={i === values.length - 1 ? 1 : 0.35}
          />
        );
      })}
    </svg>
  );
}

function DonutRing({ pct, color, size = 68, stroke = 6 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
  );
}

function GlowOrb({ color, bottom = -40, left = -30 }: { color: string; bottom?: number; left?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute rounded-full"
      style={{ width: 160, height: 160, background: color, opacity: 0.14, filter: "blur(52px)", bottom, left }}
    />
  );
}

export default function FinancialOverviewCards({
  summary,
  loading,
  completedAppointmentsCount,
  doctorPercentage,
}: Props) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  if (loading || !summary) return <BentoSkeleton />;

  const total = summary.yearlyRevenue; // Doctor's total yearly earnings
  const safe = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const monthlyPct = safe(summary.monthlyRevenue);
  const todayPct   = safe(summary.todayRevenue);
  const hasPending = summary.pendingPayments > 0;

  // Decorative spark data
  const sparkValues = [40, 55, 30, 70, 60, 85, 90, 75, 95, 100].map((v) =>
    Math.round((v / 100) * (total || 1))
  );

  return (
    <div className="flex flex-col gap-3" dir={isRtl ? "rtl" : "ltr"}>
      {/* ROW 1: Hero (5fr) | Month (4fr) | Today (3fr) */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-[5fr_4fr_3fr]">
        
        {/* HERO: Yearly Earnings */}
        <div
          className="relative rounded-3xl overflow-hidden group cursor-default"
          style={{
            background: "linear-gradient(135deg, #0f2e6e 0%, #1a4fa8 52%, #2563eb 100%)",
            boxShadow: "0 12px 48px rgba(31,111,235,0.38)",
            minHeight: 240,
            animation: "fadeUp 0.5s ease both",
          }}
        >
          <GlowOrb color="#60a5fa" bottom={-30} left={-20} />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              opacity: 0.05,
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 28px,#fff 28px,#fff 29px)," +
                "repeating-linear-gradient(90deg,transparent,transparent 28px,#fff 28px,#fff 29px)",
            }}
          />
          <div className="absolute top-4 right-4 z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/15 text-white/90 backdrop-blur-sm border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t("financialPage.yearlyEarnings", locale)}
            </span>
          </div>

          <div className="relative z-10 flex flex-col h-full p-6 gap-4 justify-between" style={{ minHeight: 240 }}>
            <div className="mt-6">
              <p className="text-white/55 text-[11px] font-semibold tracking-widest uppercase mb-2">
                {t("financialPage.totalEarnings", locale)}
              </p>
              <Amount 
                value={summary.yearlyRevenue} 
                compact 
                className="text-4xl lg:text-5xl font-black text-white" 
                currencyClassName="text-2xl opacity-70 ml-1" 
              />
              <Amount 
                value={summary.yearlyRevenue} 
                className="text-white/40 text-xs mt-1 block" 
                currencyClassName="text-[10px] ml-1" 
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-end gap-2">
                <SparkBars color="#93c5fd" values={sparkValues} />
                <span className="text-white/40 text-[10px] pb-0.5">{t("financialPage.earningsDevelopment", locale)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-2.5">
                  <p className="text-white/50 text-[10px] mb-0.5">{t("financialPage.monthlyEarnings", locale)}</p>
                  <Amount value={summary.monthlyRevenue} compact className="text-white font-bold text-sm" currencyClassName="text-[10px] ml-1 opacity-70" />
                </div>
                <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-2.5">
                  <p className="text-white/50 text-[10px] mb-0.5">{t("financialPage.todayEarnings", locale)}</p>
                  <Amount value={summary.todayRevenue} compact className="text-white font-bold text-sm" currencyClassName="text-[10px] ml-1 opacity-70" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Monthly Earnings */}
        <div
          className="relative rounded-3xl overflow-hidden group cursor-default"
          style={{
            background: "linear-gradient(135deg, #052e16 0%, #064e3b 55%, #065f46 100%)",
            boxShadow: "0 12px 40px rgba(16,185,129,0.28)",
            minHeight: 240,
            animation: "fadeUp 0.5s ease both",
            animationDelay: "80ms",
          }}
        >
          <GlowOrb color="#34d399" bottom={-20} left={-10} />
          <div className="relative z-10 flex flex-col justify-between h-full p-6" style={{ minHeight: 240 }}>
            <div>
              <p className="text-white/55 text-[11px] font-semibold tracking-widest uppercase mb-4">
                {t("financialPage.monthlyEarnings", locale)}
              </p>
              <Amount 
                value={summary.monthlyRevenue} 
                compact 
                className="text-3xl lg:text-4xl font-black text-white" 
                currencyClassName="text-xl opacity-70 ml-1" 
              />
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp size={12} className="text-emerald-300" />
                <span className="text-emerald-300 text-[11px] font-semibold">{monthlyPct}% {isRtl ? "من السنوي" : "of annual"}</span>
              </div>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-white/40 text-[10px] mb-1">{isRtl ? "نسبة الإنجاز السنوي" : "Annual achievement rate"}</p>
                <div className="h-1.5 w-28 rounded-full overflow-hidden bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-700"
                    style={{ width: `${monthlyPct}%` }}
                  />
                </div>
              </div>
              <div className="relative shrink-0">
                <DonutRing pct={monthlyPct} color="#34d399" size={70} stroke={6} />
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                  {monthlyPct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Today's Earnings */}
        <div
          className="relative rounded-3xl overflow-hidden group cursor-default"
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4338ca 100%)",
            boxShadow: "0 12px 40px rgba(99,102,241,0.3)",
            minHeight: 240,
            animation: "fadeUp 0.5s ease both",
            animationDelay: "140ms",
          }}
        >
          <GlowOrb color="#a5b4fc" bottom={-20} left={-10} />
          <div className="relative z-10 flex flex-col justify-between h-full p-5" style={{ minHeight: 240 }}>
            <div className="flex items-start justify-between">
              <p className="text-white/55 text-[11px] font-semibold tracking-widest uppercase">{t("financialPage.today", locale)}</p>
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                <ArrowUpRight size={15} className="text-white" />
              </div>
            </div>
            <div>
              <Amount 
                value={summary.todayRevenue} 
                compact 
                className="text-3xl font-black text-white" 
                currencyClassName="text-xl opacity-70 ml-1" 
              />
              <div className="flex items-center gap-1 mt-2">
                {todayPct >= 5
                  ? <TrendingUp size={11} className="text-violet-300" />
                  : <TrendingDown size={11} className="text-violet-400" />
                }
                <span className="text-violet-200/80 text-[10px]">{todayPct}% {isRtl ? "من السنوي" : "of annual"}</span>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <DonutRing pct={todayPct} color="#a5b4fc" size={60} stroke={5} />
                <span className="absolute inset-0 flex items-center justify-center text-white text-[11px] font-bold">
                  {todayPct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: Profit share % | Completed appts | Pending earnings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARD 4: Your Share Percentage */}
        <div className="relative bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 p-6 flex flex-col justify-between overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 min-h-[160px]">
          <div className="absolute top-4 bottom-4 right-0 w-1.5 bg-[#0bc4b3] rounded-l-full" />
          <div className="flex justify-between items-start">
            <p className="text-gray-500 font-semibold text-sm">{isRtl ? "نسبة أرباحك" : "Your profit share"}</p>
            <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Sparkles size={18} className="text-[#0bc4b3]" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <div className="text-3xl font-black text-[#0bc4b3] self-end flex items-baseline gap-1" dir="ltr">
              <span className="font-black tracking-tight leading-none">{doctorPercentage}</span>
              <span className="text-xl font-semibold">%</span>
            </div>
            <div className="flex items-center gap-3 w-full">
              <p className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{100 - doctorPercentage}% {isRtl ? "للعيادة" : "for clinic"}</p>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-[#0bc4b3] rounded-full transition-all duration-1000" style={{ width: `${doctorPercentage}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 5: Completed Appointments */}
        <div className="relative bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 p-6 flex flex-col justify-between overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 min-h-[160px]">
          <div className="absolute top-4 bottom-4 right-0 w-1.5 bg-[#f59e0b] rounded-l-full" />
          <div className="flex justify-between items-start">
            <p className="text-gray-500 font-semibold text-sm">{t("financialPage.completedAppointments", locale)}</p>
            <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
              <UserRound size={18} className="text-[#f59e0b]" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <div className="text-3xl font-black text-[#f59e0b] self-end flex items-baseline gap-1" dir="ltr">
              <span className="font-black tracking-tight leading-none">
                <CountUp end={completedAppointmentsCount} duration={1.5} />
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium text-left">{isRtl ? "مجموع المواعيد المدفوعة حالياً" : "Total paid appointments currently"}</p>
          </div>
        </div>

        {/* CARD 6: Pending Earnings */}
        <div className="relative bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 p-6 flex flex-col justify-between overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 min-h-[160px]">
          <div className="flex justify-between items-start">
            <p className="text-gray-500 font-semibold text-sm">{t("financialPage.pendingEarnings", locale)}</p>
            <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
              <Hourglass size={18} className="text-[#ef4444]" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <div className="text-3xl font-black text-[#ef4444] self-end flex items-baseline gap-1" dir="ltr">
              <CountUp end={summary.pendingPayments} duration={2} separator="," /> <span className="text-xl">EGP</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 w-full mt-1">
              {hasPending ? (
                <>
                  <p className="text-[11px] text-rose-500 font-medium">{t("financialPage.waitingAdmin", locale)}</p>
                  <AlertCircle size={12} className="text-rose-500" />
                </>
              ) : (
                <>
                  <p className="text-[11px] text-gray-400 font-medium font-semibold">{t("financialPage.noPendingEarnings", locale)}</p>
                  <Check size={12} className="text-gray-400" />
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
