"use client";

import { CheckCircle, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

type Status = "تمت الموافقة" | "مرفوض" | "قيد الانتظار";

type Doctor = {
  id: number;
  name: string;
  specialty: string;
  experience: number;
  date: string;
  status: Status;
};

const initialData: Doctor[] = [
  {
    id: 1,
    name: "د. أحمد السيد",
    specialty: "قلب",
    experience: 12,
    date: "13/10/2025",
    status: "قيد الانتظار",
  },
  {
    id: 2,
    name: "د. محمد حسن",
    specialty: "أعصاب",
    experience: 7,
    date: "14/10/2025",
    status: "تمت الموافقة",
  },
  {
    id: 3,
    name: "د. خالد أحمد",
    specialty: "جلدية",
    experience: 5,
    date: "13/10/2025",
    status: "مرفوض",
  },
  {
    id: 4,
    name: "د. خالد أحمد",
    specialty: "جلدية",
    experience: 5,
    date: "13/10/2025",
    status: "مرفوض",
  },
  {
    id: 5,
    name: "د. خالد أحمد",
    specialty: "جلدية",
    experience: 5,
    date: "13/10/2025",
    status: "مرفوض",
  },
  {
    id: 6,
    name: "د. خالد أحمد",
    specialty: "جلدية",
    experience: 5,
    date: "13/10/2025",
    status: "مرفوض",
  },
  {
    id: 7,
    name: "د. خالد أحمد",
    specialty: "جلدية",
    experience: 5,
    date: "13/10/2025",
    status: "مرفوض",
  },
  {
    id: 8,
    name: "د. خالد أحمد",
    specialty: "جلدية",
    experience: 5,
    date: "13/10/2025",
    status: "مرفوض",
  },
  {
    id: 9,
    name: "د. خالد أحمد",
    specialty: "جلدية",
    experience: 5,
    date: "13/10/2025",
    status: "مرفوض",
  },
  {
    id: 10,
    name: "د. خالد أحمد",
    specialty: "جلدية",
    experience: 5,
    date: "13/10/2025",
    status: "مرفوض",
  },
  {
    id: 11,
    name: "د. خالد أحمد",
    specialty: "جلدية",
    experience: 5,
    date: "13/10/2025",
    status: "مرفوض",
  },
];

export default function RequestsPage() {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"الكل" | Status>("الكل");
  const [page, setPage] = useState(1);

   const pageSize = 7;
    const getPages = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (page <= 2) {
      return [1, 2, 3, ...(totalPages > 3 ? ["..."] : [])];
    }

    if (page >= totalPages - 1) {
      return [
        ...(totalPages > 3 ? ["..."] : []),
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return ["...", page - 1, page, page + 1, "..."];
  };
  //  search + filter
  const filtered = useMemo(() => {
    return data.filter((d) => {
      const matchSearch = d.name.includes(search);
      const matchFilter = filter === "الكل" ? true : d.status === filter;

      return matchSearch && matchFilter;
    });
  }, [data, search, filter]);

  //  pagination
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  //  approve
  const approve = (id: number) => {
    setData((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "تمت الموافقة" } : d)),
    );
  };

  //  reject
  const reject = (id: number) => {
    setData((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "مرفوض" } : d)),
    );
  };
  const totals = useMemo(() => {
    const rejLength = data.filter((d) => d.status === "مرفوض").length;
    const appLength = data.filter((d) => d.status === "تمت الموافقة").length;
    const pennLength = data.filter((d) => d.status === "قيد الانتظار").length;
    return {
      "مرفوض": rejLength,
     " تمت الموافقة": appLength,
      "قيد الانتظار": pennLength,
      "الكل": data.length,
    };
  }, [data]);
  const statusColor = {
   "تمت الموافقة": "bg-[#DCFCE7] text-[#008236]  border border-[#B9F8CF] ",
    "مرفوض": "bg-[#FFE2E2] text-[#C10007] border border-#FFC9C9 ",
    "قيد الانتظار": "bg-[#FEF9C2] text-[#A65F00] border border-[#FFF085] ",
  };

  return (
    <div className="p-6  min-h-screen space-y-6">
      {/*  Header */}
      <div className="text-right">
        <h2 className="text-3xl font-bold text-(--text-primary) ">
          طلبات الموافقة على الأطباء
        </h2>
        <span className=" text-(--text-secondary)">
          مراجعة وإدارة طلبات الأطباء
        </span>
      </div>

      {/* Search + Filters */}
      <div className="flex justify-between items-center bg-(--card-bg) border border-(--card-border) p-8 rounded-xl">
        <input
          placeholder="ابحث باسم الطبيب..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="bg-(--input2-bg) rounded-lg px-3 py-2 text-sm w-90 "
        />

        <div className="flex gap-2">
          {["قيد الانتظار", "تمت الموافقة", "مرفوض", "الكل"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 rounded-lg text-md cursor-pointer  ${
                filter === f ? "text-(--primary) font-bold" : "text-(--text-secondary)"
              }`}
            >
              ({totals[f as keyof typeof totals]}) {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-(--card-border) w-full">
        <table className="w-full min-w-max text-sm text-center">
          <thead className="bg-(--hover-bg) text-center text-(--text-secondary)">
            <tr>
              <th>الإجراءات</th>
              <th>الحالة</th>
              <th>تاريخ التقديم</th>
              <th>سنوات الخبرة</th>
              <th>التخصص</th>
              <th className="py-3">اسم الطبيب</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((d) => (
              <tr key={d.id} className="border-t border-(--card-border) hover:bg-(--hover-bg) transition">
                <td className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => reject(d.id)}
                      className="bg-transparent border border-[#FFC9C9]  hover:bg-[#B71C1C] hover:text-white text-[#B71C1C] px-3 py-1 rounded text-xs flex items-center gap-1 cursor-pointer transition-all duration-300"
                    >
                      رفض
                      <XCircle size={14} />
                    </button>

                    <button
                      onClick={() => approve(d.id)}
                      className="bg-[#00A63E] border hover:border hover:border-[#00A63E] hover:bg-transparent hover:text-[#00A63E] text-white px-3 py-1 rounded text-xs flex items-center gap-1 cursor-pointer transition-all duration-300"
                    >
                      موافقة
                      <CheckCircle size={14} />
                    </button>
                  </div>
                </td>
                <td>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${statusColor[d.status]}`}
                  >
                    {d.status}
                  </span>
                </td>
                <td>{d.date}</td>
                <td>{d.experience} سنة</td>
                <td>{d.specialty}</td>
                <td className="py-3">{d.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/*  Pagination */}
       <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
            <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className=" cursor-pointer text-2xl flex items-center justify-center border border-(--input-border) rounded-md p-1 hover:bg-(--semi-card-bg) transition"
          >
            <ChevronLeft size={19} />
          </button>

          {getPages().map((p, i) => (
            <button
              key={i}
              onClick={() => typeof p === "number" && setPage(p)}
              disabled={p === "..."}
              className={`px-2 py-1 rounded cursor-pointer ${
                p === page
                  ? "bg-[#1F2B6C] text-white"
                  : p === "..."
                    ? "cursor-default text-gray-400"
                    : "border border-(--input-border) hover:bg-(--semi-card-bg)"
              }`}
            >
              {p}
            </button>
          ))}

         <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className=" cursor-pointer text-2xl flex items-center justify-center border border-(--input-border) rounded-md p-1 hover:bg-(--semi-card-bg) transition"
          >
            <ChevronRight size={19} />
          </button>
        </div>

        <p className="text-sm text-(--text-secondary)">
          عرض {page} -{" "} {totalPages} من أصل {data.length} مريض
        </p>
      </div>
    </div>
  );
}
