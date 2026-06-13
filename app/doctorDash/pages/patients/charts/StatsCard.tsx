import {TrendingUp, TrendingDown} from "lucide-react";
type Props = {
  title: string;
  value: number;
  change: number;
};

export default function StatCard({ title, value, change }: Props) {
  const isPositive = change >= 0;

  return (
    <div className="flex w-full min-w-0 flex-col items-start gap-2 rounded-xl border border-(--card-border) bg-(--card-bg) px-4 py-3 text-start transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_2px_10px_var(--status-hover)] sm:items-end">

      {/* title */}
      <p className="text-sm text-(--text-secondary) sm:text-lg lg:text-xl">{title}</p>

        {/* number */}
        <h2 className="text-xl font-bold text-(--text-primary) sm:text-2xl">
          {value.toLocaleString()}
        </h2>

        {/* change */}
        <div
          className={`flex items-center gap-1 text-sm sm:text-lg ${
            isPositive ? "text-green-600" : "text-red-500"
          }`}
        >
          <span>{isPositive ? "+" : ""}{change}%</span>
          <span className="">
            {isPositive ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
          </span>
        </div>

      
    </div>
  );
}
