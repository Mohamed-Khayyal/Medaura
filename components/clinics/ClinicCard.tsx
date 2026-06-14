"use client";
import { MapPin, Phone, Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClinicCardData {
  clinic_id: string | number;
  name: string;
  location: string;
  phone: string;
  photo: string;
  doctors_count: number;
  total_ratings: number;
  average_rating: number;
}

export default function ClinicCard({ clinic }: { clinic: ClinicCardData }) {
  const router = useRouter();
  const safeRating = Number.isFinite(clinic.average_rating)
    ? clinic.average_rating
    : 0;
  const filledStars = Math.round(safeRating);

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition duration-300 overflow-hidden flex flex-col border border-gray-100">
      <div className="relative p-4">
        <div className="relative rounded-2xl overflow-hidden">
          <img
            src={clinic.photo}
            alt={clinic.name}
            className="w-full h-48 object-cover"
          />
        </div>
      </div>

      <div className="px-6 pb-6 flex flex-col grow text-right" dir="rtl">
        <h3 className="text-lg font-bold mb-4 text-gray-800">{clinic.name}</h3>

        <div className="space-y-2 mb-6">
          <div className="flex items-center text-gray-400 text-xs justify-start">
            <MapPin className="w-3.5 h-3.5 ml-2" />
            <span>{clinic.location}</span>
          </div>

          <div className="flex items-center text-gray-400 text-xs justify-start">
            <Phone className="w-3.5 h-3.5 ml-2" />
            <span dir="ltr">{clinic.phone}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < filledStars
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-200"
                }`}
              />
            ))}
            <span className="font-semibold text-gray-700">
              {safeRating.toFixed(1)}
            </span>
            <span className="text-gray-400">({clinic.total_ratings})</span>
          </div>
          <span className="text-gray-400">Doctors: {clinic.doctors_count}</span>
        </div>

        <button
          onClick={() => router.push(`/clinics/${clinic.clinic_id}`)}
          className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-[#001A6E] hover:text-white hover:border-[#001A6E] transition-all duration-300"
        >
          عرض التفاصيل
        </button>
      </div>
    </div>
  );
}
