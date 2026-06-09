"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  email: string;
  age: number | string;
  status: string;
  lastVisit: string;
  img: string;
}

const statusColors: any = {
  نشط: "bg-green-100 text-green-600",
  "تحت العلاج": "bg-purple-100 text-purple-600",
  متعافي: "bg-blue-100 text-blue-600",
};

export default function PatientsTable() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("الكل");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const pageSize = 3;

  useEffect(() => {
    async function loadPatients() {
      try {
        setLoading(true);
        const response = await fetch("/api/bookings/my-bookings", {
          credentials: "include",
        });
        const result = await response.json();
        if (response.ok && result.success && Array.isArray(result.data)) {
          const uniquePatientsMap = new Map<string, any>();
          
          result.data.forEach((b: any) => {
            const key = b.patient_phone || b.patient_name || String(b.booking_id);
            if (!key) return;

            const existing = uniquePatientsMap.get(key);
            if (
              !existing ||
              new Date(b.booking_date) > new Date(existing.booking_date)
            ) {
              uniquePatientsMap.set(key, b);
            }
          });

          const mappedPatients = Array.from(uniquePatientsMap.values()).map((b: any, index: number) => {
            const dateStr = b.booking_date ? new Date(b.booking_date).toISOString().slice(0, 10) : "—";
            return {
              id: String(b.booking_id),
              name: b.patient_name || "Unknown",
              email: b.patient_phone || "لا يوجد هاتف",
              age: "--",
              status: b.status === "confirmed" ? "نشط" : b.status === "completed" ? "متعافي" : "تحت العلاج",
              lastVisit: dateStr,
              img: `https://i.pravatar.cc/40?u=${b.patient_phone || index}`,
            };
          });

          setData(mappedPatients);
        }
      } catch (error) {
        console.error("Failed to load patients", error);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.email.toLowerCase().includes(search.toLowerCase());

      const matchFilter = filter === "الكل" || item.status === filter;

      return matchSearch && matchFilter;
    });
  }, [data, search, filter]);
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
  //  pagination
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const router = useRouter();
  return (
    <div className="bg-(--card-bg) rounded-2xl flex flex-col gap-6 border border-(--card-border) p-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between mb-4">
        {/* Filters */}
        <div className="flex gap-2">
          {["متعافي", "تحت العلاج", "نشط", "الكل"].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`px-4 py-1.5 text-sm rounded-md transition-all duration-300
        ${
          filter === f
            ? "bg-[#001A6E] text-white"
            : " bg-(--btn-bg) border border-(--input-border) text-(primary) hover:bg-(--semi-card-bg)"
        }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-100">
          <input
            type="text"
            placeholder="...بحث عن مريض بالاسم أو رقم الملف"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-4 pr-10 py-4 rounded-full bg-(--input2-bg) border border-(--input-border) text-sm outline-none w-100 placeholder:text-(--text-secondary) placeholder:text-right focus:ring-2 focus:ring-(--primary) transition"
          />
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-primary)"
          />
        </div>
      </div>

      {/*  Table */}
      <table className="w-full ">
        <thead className="text-(--text-primary) text-xl  ">
          <tr className="text-center ">
            <th>آخر زيارة</th>
            <th>الحالة</th>
            <th>العمر</th>
            <th>رقم المريض</th>
            <th className="pb-3 text-right">المريض</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="text-center py-6 text-(--text-secondary)">
                جاري تحميل المرضى...
              </td>
            </tr>
          ) : paginated.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-6 text-(--text-secondary)">
                لا يوجد مرضى
              </td>
            </tr>
          ) : (
            paginated.map((p, i) => (
              <tr
                key={i}
                className="  text-(--text-primary) hover:bg-(--semi-card-bg)  transition text-center cursor-pointer"
                onClick={() => router.push(`/doctorDash/pages/patients/${p.id}`)}
                onKeyDown={(e) =>
                  e.key === "Enter" && router.push(`/doctorDash/pages/patients/${p.id}`)
                }
              >
                <td className="">{p.lastVisit}</td>
                {/* Status */}
                <td>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      statusColors[p.status]
                    }`}
                  >
                    {p.status}
                  </span>
                </td>

                <td className="">{p.age}</td>
                <td className="">{p.id}</td>

                {/* Patient */}
                <td className="py-4">
                  <div className="flex items-center gap-3 justify-end">
                    <div className="text-right">
                      <p className="font-medium ">{p.name}</p>
                      <p className="text-xs text-(--text-secondary)">{p.email}</p>
                    </div>

                    <img
                      src={p.img}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/*  Pagination */}

      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="flex gap-2 items-center">
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
        <p className="text-(--text-secondary)">
          عرض {page} - {totalPages} من أصل {filtered.length} مريض
        </p>
      </div>
    </div>
  );
}
