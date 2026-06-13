"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { useState, useMemo } from 'react';
interface Props  {
  data :any[]
};
const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload: { name, value } } = props;
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const expandedOuter = outerRadius + 10;


  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={expandedOuter}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke='var(--text-primary)'
        strokeWidth={5}
        cornerRadius={5}
      />
    </g>
  );
};

export default function MedicalChart({data}:Props) {
  const total = data.reduce((acc, item) => acc + item.value, 0);
     const [activeIndex, setActiveIndex] = useState<number>(-1);
     const [tooltipActive, setTooltipActive] = useState<boolean>(false);
     const totalAppointments = useMemo(() => data.reduce((sum, dep) => sum + dep.value, 0), [data]);
     const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload || !payload.length) return null;
        const { name, value, color } = payload[0].payload;
        const percentage = ((value / totalAppointments) * 100).toFixed(1);

        return (
            <div className='min-w-52 p-4 rounded-2xl bg-(--card-bg) backdrop-blur-md shadow-2xl border border-(--card-border)'>
            <div className='flex items-center justify-between gap-3 mb-3 pb-2 border-b border-(--card-border)'>
                <div className='flex items-center gap-3'>
                <div className='w-4 h-4 rounded-full shadow-md ring-2 ring-white/50' style={{ backgroundColor: color }} />
                <span className='font-bold text-lg text-(--text-primary)'>{name}</span>
                </div>
                <span className='px-3 py-1 text-white text-xs font-semibold rounded-full shadow-md'style={{backgroundColor:color}} >
                {percentage}%
                </span>
            </div>

            <div className='flex items-center justify-between'>
                <span className='text-(--text-secondary) font-medium'> عدد المرضى</span>
                <span className='text-2xl font-black text-(--text-primary)'>
                {value.toLocaleString()}
                </span>
            </div>
            </div>
        );
};
      const pieProps: any = {
        data,
        dataKey: 'value',
        cx: '50%',
        cy: '50%',
        innerRadius: 55,
        outerRadius: 80,
        cornerRadius: 4,
        paddingAngle:8,
        activeIndex,
        activeShape: renderActiveShape,
        isAnimationActive: true,
        onMouseEnter: (_: any, index: number) => { setActiveIndex(index); setTooltipActive(true); },
        onMouseLeave: () => { setActiveIndex(-1); setTooltipActive(false); },
      };
  return (
    <div className="min-w-0 rounded-2xl border border-(--card-border) bg-(--card-bg) p-4 text-center sm:p-6">

      {/* Title */}
      <h2 className="mb-4 text-start text-lg font-bold text-(--text-primary) sm:text-xl">
        توزيع الحالات الطبية
      </h2>

      {/* Chart */}
      <div className="relative flex justify-center overflow-hidden">

        <PieChart width={220} height={220}>
          <Pie {...pieProps}>
            {data.map((entry, index) => (
              <Cell key={index} stroke='var(--text-primary' strokeWidth={4} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>

        {/* Center Text */}
        <div className={`absolute  flex items-center justify-center w-full h-full  pointer-events-none ${tooltipActive ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
          <span className="text-2xl font-bold text-(--text-primary)">
            {total<1000?total :`k ${total/1000}` } 
          </span>
        </div>

      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs sm:gap-6 sm:text-sm">

        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">

            <span
              className="w-2 h-2 rounded-full"
              style={{ background: item.color }}
            ></span>

            <span className="text-(--text-secondary) font-medium">
              {item.name}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
}
