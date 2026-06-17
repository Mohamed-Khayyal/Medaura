"use client";

import { useMemo, useState } from "react";
import { Plus, RotateCcw, Copy, Calendar } from "lucide-react";

const days = [
  "السبت",
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

type Slot = {
  start: string;
  end: string;
};

type Day = {
  name: string;
  enabled: boolean;
  slots: Slot[];
};

export default function EditSchedule() {
  const [schedule, setSchedule] = useState<Day[]>(
    days.map((d) => ({
      name: d,
      enabled: true,
      slots: [{ start: "08:00", end: "17:00" }],
    })),
  );
  const getEnabledDaysWithSlots = () => {
    return schedule
      .filter((day) => day.enabled)
      .map((day) => ({
        name: day.name,
        slots: day.slots,
      }));
  };
  const dataToSend = useMemo(() => {
    return getEnabledDaysWithSlots();
  }, [schedule]);
  console.log(dataToSend);

  const timeToMinutes = (time: string) => {
    const [t, modifier] = time.split(" ");
    let [hours, minutes] = t.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };
  const summary = useMemo(() => {
    let totalMinutes = 0;
    let enabledDays = 0;

    schedule.forEach((day) => {
      if (!day.enabled) return;

      enabledDays++;

      day.slots.forEach((slot) => {
        let start = timeToMinutes(slot.start);
        let end = timeToMinutes(slot.end);

        if (end === 0) end = 1440;

        if (end > start) {
          totalMinutes += end - start;
        }
      });
    });

    const totalHours = (totalMinutes / 60).toFixed(1);

    return {
      days: enabledDays,
      hours: `${totalHours} ساعة/أسبوع`,
      duration: "30 دقيقة", // ثابت حالياً
      status: enabledDays > 0 ? "غير مغلقة" : "مغلقة",
    };
  }, [schedule]);

  //  toggle day
  const toggleDay = (i: number) => {
    const copy = [...schedule];
    copy[i].enabled = !copy[i].enabled;
    setSchedule(copy);
  };
  //  change time
  const changeTime = (
    dayIndex: number,
    slotIndex: number,
    field: "start" | "end",
    value: string,
  ) => {
    const copy = [...schedule];
    const slots = copy[dayIndex].slots;

    const updatedSlot = { ...slots[slotIndex], [field]: value };

    let start = timeToMinutes(updatedSlot.start);
    let end = timeToMinutes(updatedSlot.end);

    if (end === 0) end = 1440;

    //  validation: start < end
    if (start >= end) {
      alert("البداية لازم تكون قبل النهاية");
      return;
    }

    // overlap
    for (let i = 0; i < slots.length; i++) {
      if (i === slotIndex) continue;

      let sStart = timeToMinutes(slots[i].start);
      let sEnd = timeToMinutes(slots[i].end);

      if (sEnd === 0) sEnd = 1440;

      if (start < sEnd && end > sStart) {
        alert("في تداخل بين الفترات");
        return;
      }
    }

    slots[slotIndex] = updatedSlot;

    //  sort
    slots.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

    setSchedule(copy);
  };

  //  add slot
  const addSlot = (i: number) => {
    const copy = [...schedule];
    const slots = copy[i].slots;

    const last = slots[slots.length - 1];
    console.log(last);
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const intialStart = "08:00";
    const intialEnd = "17:00";
    let lastEnd = last? toMinutes(last.end) : toMinutes(intialEnd);
    console.log(lastEnd);
    // if (lastEnd === 0) lastEnd = 1440;

    if (lastEnd >= 1439) {
      alert("اليوم خلص بالفعل، مينفعش تضيف فترة تانية");
      return;
    }

    if (lastEnd >= 1438) {
      alert("مفيش وقت كفاية لإضافة فترة جديدة");
      return;
    }

    const newStart = last? last.end : intialStart;

    const newEndMinutes = Math.min(lastEnd + 420, 1439)

    const format = (m: number) => {
      const h = Math.floor(m / 60)
        .toString()
        .padStart(2, "0");
      const min = (m % 60).toString().padStart(2, "0");
      return `${h}:${min}`;
    };

    slots.push({
      start: newStart,
      end: last? format(newEndMinutes) : intialEnd,
    });

    setSchedule(copy);
  };
  const copyDay = (fromIndex: number) => {
    const copy = [...schedule];
    const sourceSlots = copy[fromIndex].slots;

    const newSchedule = copy.map((day, i) => {
      if (i === fromIndex) return day;

      return {
        ...day,
        slots: sourceSlots.map((s) => ({ ...s })),
      };
    });

    setSchedule(newSchedule);
  };
  const resetSchedule = () => {
    setSchedule(
      days.map((d) => ({
        name: d,
        enabled: true,
        slots: [{ start: "08:00", end: "17:00" }],
      })),
    );
  };
  const deleteSlot = (dayIndex: number, slotIndex: number) => {
    const copy = [...schedule];
    copy[dayIndex].slots.splice(slotIndex, 1);
    console.log(copy[dayIndex].slots);
    if (copy[dayIndex].slots.length === 0) {
      copy[dayIndex].enabled = false;
    }
    setSchedule(copy);
  };
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={resetSchedule}
          className="border cursor-pointer hover:bg-(--hover-bg) px-3 py-1 rounded-lg text-sm flex gap-2 items-center "
        >
          إعادة التعيين
          <RotateCcw size={16} />
        </button>

        <div className="text-right flex flex-col gap-3">
          <h2 className="font-bold text-(--text-primary) text-3xl ">
            تعديل جدول عمل الطبيب
          </h2>
          <p className="text-sm text-gray-400">
            إدارة أيام وساعات العمل الأسبوعية
          </p>
        </div>
      </div>

      {/* Doctor Info */}
      <div className="bg-(--card-bg) border border-(--card-border) rounded-xl p-4 flex justify-between items-center mb-6">
        <span className="bg-green-100 text-green-600 px-3 py-1 text-xs rounded-full">
          نشط
        </span>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-medium">د. سارة أحمد</p>
            <p className="text-sm text-gray-400">أخصائية</p>
          </div>
          <img
            src="https://i.pravatar.cc/100"
            className="w-17 h-17 rounded-full"
          />
        </div>
      </div>

      {/* Days */}
      <div className="space-y-4">
        {schedule.map((day, i) => (
          <div
            key={i}
            className="bg-(--card-bg) border border-(--card-border) rounded-xl p-4 space-y-4"
          >
            {/* Day Header */}
            <div className=" flex justify-between">
              <button
                onClick={() => copyDay(i)}
                className={`text-md border px-2 py-1 rounded-lg flex gap-2 items-center cursor-pointer hover:bg-(--hover-bg) ${!day.enabled ? "hidden" : ""} `}
              >
                نسخ اليوم
                <Copy size={16} />
              </button>
              <div className="flex justify-end items-center ml-auto">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm px-3 py-1 rounded-xl ${day.enabled ? "bg-[#DBEAFE]" : "bg-red-800"} ${day.enabled ? "text-[#001A6E]" : "text-white"}`}
                  >
                    {day.enabled ? "متاح" : "مغلق"}
                  </span>
                  <span
                    className={`font-medium ${!day.enabled ? "text-(--text-secondary)" : "text-(--text-primary)"}`}
                  >
                    {day.name}
                  </span>
                  <button
                    onClick={() => toggleDay(i)}
                    className={`w-10 h-5 rounded-full transition cursor-pointer ${
                      day.enabled ? "bg-[#001A6E]" : "bg-[#CBCED4] "
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition ${
                        day.enabled ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Slots */}
            {day.enabled && (
              <div className="space-y-3 p-3 border border-(--card-border) rounded-lg">
                {day.slots.map((slot, s) => (
                  <div key={s} className={` px-3 py-7 space-y-2  ${s !== day.slots.length - 1 ? "border-b border-(--card-border)" : ""}`}>
                    <button
                      onClick={() => deleteSlot(i, s)}
                      className="text-red-500 text-sm bg-red-100 px-2 py-1 rounded-lg cursor-pointer hover:text-red-400 transition-colors"
                    >
                      حذف
                    </button>
                    {/* Row */}
                    <div className="flex justify-between items-center">
                      <span className="text-md font-bold text-(--text-primary)  text-right w-full">
                        إلى
                      </span>
                      <span className="text-md font-bold text-(--text-primary ) text-right w-full">
                        من
                      </span>
                    </div>

                    {/* Time */}
                    <div className="flex justify-between items-center">
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) =>
                          changeTime(i, s, "end", e.target.value)
                        }
                        className="text-md flex items-center outline-none w-full text-left font-bold  cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter-(--invert)"
                      />

                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) =>
                          changeTime(i, s, "start", e.target.value)
                        }
                        className="text-md flex  items-center outline-none w-full text-left font-bold  cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter-(--invert)"
                      />
                    </div>
                    {errors[`${i}-${s}`] && (
                      <p className="text-red-500 text-sm text-right">
                        {errors[`${i}-${s}`]}
                      </p>
                    )}
                  </div>
                ))}
                {/* Add Slot */}
                <button
                  onClick={() => addSlot(i)}
                  className="text-blue-600 w-full border border-[#8EC5FF] border-dashed  rounded-md p-2 text-md flex items-center justify-center gap-1 cursor-pointer hover:bg-[#8EC5FF] hover:text-white transition-colors duration-500"
                >
                  <Plus size={14} />
                  إضافة فترة أخرى
                </button>
              </div>
            )}
            {!day.enabled && (
              <div>
                <span className=" text-(--text-secondary)">
                  اليوم غير مفعّل - قم بتفعيله لإضافة مواعيد
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className=" mt-5 p-6 bg-(--card-bg) border border-(--card-border) rounded-xl ">
        <div className=" flex items-center gap-2 justify-end ">
          <h2 className=" text-2xl font-bold text-(--text-primary)">
            {" "}
            معاينة الجدول الأسبوعي{" "}
          </h2>
          <Calendar size={22} />
        </div>
        <div className="bg-(--donut-bg) rounded-xl p-4 flex flex-col mt-5  h-auto ">
          <div className="text-right w-full">
            <h3 className="font-bold text-(--text-primary)">ملخص الجدول</h3>
          </div>
          <div className="flex flex-wrap gap-6 sm:gap-16 justify-end text-right">
            <div className=" text-left">
              <p className="text-sm text-(--text-secondary)">الاستراحة</p>
              <p className="font-bold text-(--text-primary)">{summary.status}</p>
            </div>
            <div className=" text-left">
              <p className="text-sm text-(--text-secondary)">مجموع الساعات</p>
              <p className="font-bold text-(--text-primary)">{summary.hours}</p>
            </div>
            <div className=" text-left">
              <p className="text-sm text-(--text-secondary)">مدة الموعد</p>
              <p className="font-bold text-(--text-primary)">{summary.duration}</p>
            </div>
            <div className="text-left">
              <p className="text-sm text-(--text-secondary)">أيام العمل</p>
              <p className="font-bold text-(--text-primary)">{summary.days} أيام</p>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <div className="mt-6 flex justify-between items-center">
        <button className="bg-[#1F2B6C] text-white px-4 py-2 rounded-lg">
          حفظ التعديلات
        </button>

        <button className="border px-4 py-2 rounded-lg">إلغاء</button>
      </div>
    </div>
  );
}
