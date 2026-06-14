"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDashboardPathByUserType } from "@/lib/utils/redirect";
import {
  getApiErrorMessage,
  getDuplicateEmailValidationMessage,
  isDuplicateEmailError,
} from "@/lib/utils/api-errors";
import type { ClinicProfile, StaffSignupProfile } from "@/lib/types/api";
import { EyeIcon } from "../utils";

const SPECIALTIES = [
  "مخ واعصاب",
  "عظام",
  "الأورام",
  "طب الأذن والأنف والحنجرة",
  "طب العيون",
  "قلب و اوعية دموية",
  "صدر و جهاز تنفسي",
  "كلى",
  "اسنان",
  "اطفال و حديثي الولادة",
  "جلدية",
  "نسا و توليد",
];

const WORK_DAYS = [
  { id: "sat", label: "السبت" },
  { id: "sun", label: "الأحد" },
  { id: "mon", label: "الإثنين" },
  { id: "tue", label: "الثلاثاء" },
  { id: "wed", label: "الأربعاء" },
  { id: "thu", label: "الخميس" },
  { id: "fri", label: "الجمعة" },
];

export default function StaffRegisterPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [selectedClinic, setSelectedClinic] = useState("");
  const [clinics, setClinics] = useState<ClinicProfile[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [specialist, setSpecialist] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadClinics() {
      setLoadingClinics(true);
      try {
        const response = await fetch("/api/clinic", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Failed to fetch clinics");
        const clinicList = Array.isArray(data)
          ? data
          : (data.data ?? data.clinics ?? data.data?.clinics ?? []);
        setClinics(clinicList);
      } catch (error) {
        console.error("Failed to load clinics", error);
      } finally {
        setLoadingClinics(false);
      }
    }
    loadClinics();
  }, []);

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!fullName.trim()) nextErrors.full_name = "الاسم الكامل مطلوب";
    if (!selectedClinic.trim()) nextErrors.name = "اختر العيادة";
    if (!specialist) nextErrors.specialist = "التخصص مطلوب";
    if (!email.trim()) nextErrors.email = "البريد الإلكتروني مطلوب";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextErrors.email = "صيغة البريد غير صحيحة";
    if (!password) nextErrors.password = "كلمة المرور مطلوبة";
    else if (password.length < 6)
      nextErrors.password = "يجب أن تكون كلمة المرور 6 أحرف على الأقل";
    if (password !== confirm) nextErrors.confirm = "كلمات المرور غير متطابقة";
    if (!terms) nextErrors.terms = "يجب الموافقة على الشروط";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const profile: StaffSignupProfile = {
        full_name: fullName.trim(),
        name: selectedClinic,
        role_title: "doctor",
        specialist,
      };

      const response = await signup({
        email: email.trim(),
        password,
        user_type: "staff",
        profile,
      });

      const redirectPath = getDashboardPathByUserType(response.user_type);
      router.push(redirectPath);
    } catch (error) {
      const message =
        getApiErrorMessage(error) ||
        (error instanceof Error ? error.message : "تعذر إنشاء الحساب، حاول مرة أخرى");

      if (isDuplicateEmailError(error, message)) {
        setErrors({ email: getDuplicateEmailValidationMessage() });
      } else {
        setErrors({ form: message });
      }
    } finally {
      setLoading(false);
    }
  }



  const inputCls = (key: string) =>
    `w-full text-sm sm:text-base border rounded-md px-3 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:scale-[1.01] ${
      errors[key] ? "border-red-300" : "border-zinc-200"
    }`;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {Object.keys(errors).length > 0 && (
        <div
          className="bg-red-50 border border-red-200 text-red-800 p-3 rounded animate-[shake_0.3s_ease-in-out]"
          role="alert"
          aria-live="assertive"
        >
          <p className="font-medium">يرجى تصحيح الأخطاء التالية:</p>
          <ul className="mt-2 list-disc list-inside">
            {Object.values(errors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* الاسم الكامل */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-zinc-700 mb-1">
          الاسم الكامل
        </label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="name"
          placeholder="الاسم الكامل"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          aria-invalid={!!errors.full_name}
          className={inputCls("full_name")}
        />
        {errors.full_name && <p className="text-sm text-red-700 mt-1">{errors.full_name}</p>}
      </div>

      {/* العيادة */}
      <div>
        <label htmlFor="clinic" className="block text-sm font-medium text-zinc-700 mb-1">
          العيادة
        </label>
        <select
          id="clinic"
          name="clinic"
          value={selectedClinic}
          onChange={(e) => setSelectedClinic(e.target.value)}
          aria-invalid={!!errors.name}
          className={inputCls("name")}
          disabled={loadingClinics}
        >
          <option value="">اختر العيادة</option>
          {clinics.map((clinic, index) => (
            <option key={clinic.id ?? clinic.name ?? index} value={clinic.name}>
              {clinic.name}
            </option>
          ))}
        </select>
        {errors.name && <p className="text-sm text-red-700 mt-1">{errors.name}</p>}
      </div>

      {/* التخصص */}
      <div>
        <label htmlFor="specialist" className="block text-sm font-medium text-zinc-700 mb-1">
          التخصص
        </label>
        <select
          id="specialist"
          name="specialist"
          value={specialist}
          onChange={(e) => setSpecialist(e.target.value)}
          aria-invalid={!!errors.specialist}
          className={inputCls("specialist")}
        >
          <option value="">اختر التخصص...</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {errors.specialist && <p className="text-sm text-red-700 mt-1">{errors.specialist}</p>}
      </div>



      {/* البريد الإلكتروني */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          className={inputCls("email")}
        />
        {errors.email && <p className="text-sm text-red-700 mt-1">{errors.email}</p>}
      </div>

      {/* كلمة المرور */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">كلمة المرور</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            className={`w-full border rounded-md px-3 py-2 pr-12 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:scale-[1.01] ${
              errors.password ? "border-red-300" : "border-zinc-200"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-indigo-700"
          >
            <EyeIcon off={showPassword} />
          </button>
        </div>
        {errors.password && <p className="text-sm text-red-700 mt-1">{errors.password}</p>}
      </div>

      {/* تأكيد كلمة المرور */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">تأكيد كلمة المرور</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="تأكيد كلمة المرور"
            className={`w-full border rounded-md px-3 py-2 pr-12 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:scale-[1.01] ${
              errors.confirm ? "border-red-300" : "border-zinc-200"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-indigo-700"
          >
            <EyeIcon off={showConfirm} />
          </button>
        </div>
        {errors.confirm && <p className="text-sm text-red-700 mt-1">{errors.confirm}</p>}
      </div>

      {/* الشروط */}
      <label htmlFor="terms" className="flex items-center gap-2 text-sm text-zinc-600">
        <input
          id="terms"
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          className="accent-indigo-700"
        />
        أوافق على الشروط
      </label>
      {errors.terms && <p className="text-sm text-red-700 mt-1">{errors.terms}</p>}

      <button
        type="submit"
        className="w-full bg-indigo-900 text-white py-2 sm:py-2.5 rounded-md text-sm sm:text-base transition-all duration-300 hover:bg-indigo-800 hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "جاري التسجيل..." : "التسجيل"}
      </button>
    </form>
  );
}
