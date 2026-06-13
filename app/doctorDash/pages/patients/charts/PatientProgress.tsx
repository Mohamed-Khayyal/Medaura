"use client";
import { useMemo } from "react";
import { BarChart , Bar , XAxis , YAxis , Tooltip , ResponsiveContainer  , CartesianGrid} from "recharts";
interface props{
    data :{
      month: number | string;
      exciting: number;
    }[];
}

export default function PatientProgress({data}:props) {
const monthsRange = useMemo(() => {
  const now = new Date();

  return Array.from({ length: 12 }).map((_, i) => {
    const offset = i - 11;

    const d = new Date(
      now.getFullYear(),
      now.getMonth() + offset,
      1
    );

    return {
      label: d.toLocaleDateString("ar-EG", { month: "long" }), 
      date: d.toISOString().split("T")[0],
      month: d.getMonth() + 1,
      isCurrent: offset === 0,
    };
  });
}, []);
const dataMap = useMemo(() => {
  const map = new Map();
  data?.forEach((item) => {
    map.set(Number(item.month), item.exciting);
  });
  return map;
}, [data]);

const chartData = useMemo(() => {
  return monthsRange.map((month) => ({
    ...month,
    exciting: dataMap.get(month.month) || 0,
  }));
}, [monthsRange, dataMap]);
  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-(--card-bg) shadow-sm">
      
      <div className="flex flex-col gap-4 border-b-2 border-(--card-border) p-6 sm:flex-row sm:items-center sm:justify-between">
        <button 
          className="w-full sm:w-auto border-2 border-(--card-border) px-3 py-2 rounded-[5px] text-sm text-(--text-primary) font-normal cursor-pointer hover:text-white hover:bg-[#1F2B6C] transition-colors duration-500"
        >
          عرض الكل
        </button>

        <h1 className="text-2xl font-bold text-(--text-primary)">
          إحصائيات المرضى
        </h1>
      </div>

      {/* title */}
      <div className="flex flex-col gap-4 mb-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        
        <div className=" flex items-center gap-3 ">
          
          <div  className=" flex items-center gap-1  cursor-pointer " >
            <span className={` rounded-full bg-[#1F2B6C]  `} ></span>
            <p className="text-(--text-primary)]">المرضى الجدد</p> 
          </div>

          <div className=" flex items-center gap-1 cursor-pointer">
            <span className={` rounded-full bg-[#D7DCF4] } `}></span>
            <p className="text-(--text-primary)">المرضى القدامى</p> 
          </div>

        </div>
      </div>

      {/* Chart */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="h-72 min-h-72 min-w-[680px] sm:min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap={30} barGap={-28}>
                <CartesianGrid strokeDasharray="0 0" vertical={false} stroke="var(--card-border)" />

                <XAxis  
                  dataKey="label" 
                  tickMargin={5} 
                  tick={{fontSize:12 ,fill: "var(--text-primary)"  }} 
                  axisLine={false} 
                  tickLine={false} 
                />

                <YAxis  
                  orientation="right" 
                  tick={{fontSize:12 ,fill: "var(--text-primary)"}} 
                  axisLine={false} 
                  tickLine={false} 
                />

                <Tooltip 
                  cursor={{fill :"rgba(0,0,0,0.02)"}} 
                  contentStyle={{
                    borderRadius:"12px",
                    border:"none",
                    background:"var(--card-bg)",
                    color:"var(--text-primary)"
                  }} 
                />
                <Bar 
                  dataKey="exciting" 
                  fill="#1F2B6C" 
                  barSize={28} 
                  radius={[6,6,6,6]} 
                />

            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
