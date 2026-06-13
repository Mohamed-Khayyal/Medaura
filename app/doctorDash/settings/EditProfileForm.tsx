"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Camera, FileText, Loader, MapPin, Save, X } from "lucide-react";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

type GeoLocation = {
  latitude: number | "";
  longitude: number | "";
};

export type DoctorEditableProfile = {
  photo: string | null;
  full_name: string;
  phone: string;
  gender: string;
  years_of_experience: number | "";
  bio: string;
  consultation_price: number | "";
  work_from: string;
  work_to: string;
  work_days: string;
  location: string;
  geo_location: GeoLocation;
  specialist: string;
};

type EditProfileFormProps = {
  onClose: () => void;
  initialData: DoctorEditableProfile;
  onSuccess?: (profile: Record<string, unknown>) => void;
};

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

const GeoLocationPicker = dynamic(() => import("./GeoLocationPicker"), {
  ssr: false,
  loading: () => {
    const locale =
      typeof window !== "undefined" &&
      window.localStorage.getItem("locale") === "ar"
        ? "ar"
        : "en";
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-(--card-border) bg-(--semi-card-bg) text-sm text-(--text-secondary) sm:min-h-80">
        {t("settingsPage.loadingMap", locale)}
      </div>
    );
  },
});

function getSpecialistLabel(specialist: string | null | undefined, locale: string) {
  if (!specialist) return "—";
  const arSpecialties: Record<string, string> = {
    neurology: 'مخ واعصاب',
    orthopedics: 'عظام',
    oncology: 'الأورام',
    ent: 'طب الأذن والأنف والحنجرة',
    ophthalmology: 'طب العيون',
    cardiology: 'قلب و اوعية دموية',
    pulmonology: 'صدر و جهاز تنفسي',
    nephrology: 'كلى',
    dentistry: 'اسنان',
    pediatrics: 'اطفال و حديثي الولادة',
    dermatology: 'جلدية',
    gynecology: 'نسا و توليد'
  };

  const key = Object.keys(arSpecialties).find(k => arSpecialties[k] === specialist);
  if (key) {
    return t(`authPage.doctor.specialties.${key}`, locale) || specialist;
  }
  return specialist;
}

const WORK_DAYS = [
  { value: "sun", label: "Sunday" },
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
];

const DEFAULT_GEO_LOCATION = {
  latitude: 30.0444,
  longitude: 31.2357,
};

function toSelectedDays(days: string) {
  return days
    .split(",")
    .map((day) => day.trim())
    .filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getUpdatedProfile(result: unknown) {
  if (!isRecord(result)) return null;

  const data = result.data;
  if (isRecord(data) && isRecord(data.profile)) {
    return {
      ...data.profile,
      ...(typeof data.photo === "string" ? { photo: data.photo } : {}),
    };
  }
  if (isRecord(result.profile)) {
    return {
      ...result.profile,
      ...(typeof result.photo === "string" ? { photo: result.photo } : {}),
    };
  }
  if (isRecord(data)) return data;

  return null;
}

function toNullableString(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue === "" ? null : trimmedValue;
}

function buildRequestPayload(formData: DoctorEditableProfile) {
  return {
    full_name: formData.full_name.trim(),
    phone: toNullableString(formData.phone),
    gender: toNullableString(formData.gender),

    years_of_experience:
      formData.years_of_experience === ""
        ? ""
        : String(formData.years_of_experience),

    bio: toNullableString(formData.bio),

    consultation_price:
      formData.consultation_price === ""
        ? ""
        : String(formData.consultation_price),

    work_from: formData.work_from,
    work_to: formData.work_to,
    work_days: formData.work_days,
    location: toNullableString(formData.location),

    latitude: String(formData.geo_location.latitude),
    longitude: String(formData.geo_location.longitude),
  };
}

function appendPayloadToFormData(
  body: FormData,
  payload: ReturnType<typeof buildRequestPayload>,
) {
  Object.entries(payload).forEach(([key, value]) => {
    body.append(key, value === null ? "" : String(value));
  });
}
export default function EditProfileForm({
  onClose,
  initialData,
  onSuccess,
}: EditProfileFormProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(initialData.photo || "");
  const [licenceFile, setLicenceFile] = useState<File | null>(null);
  const [licenceFileName, setLicenceFileName] = useState<string>("");
  const [formData, setFormData] = useState<DoctorEditableProfile>({
    photo: initialData.photo,
    full_name: initialData.full_name,
    gender: initialData.gender,
    years_of_experience: initialData.years_of_experience,
    bio: initialData.bio,
    consultation_price: initialData.consultation_price,
    work_from: initialData.work_from,
    work_to: initialData.work_to,
    work_days: initialData.work_days,
    location: initialData.location,
    phone: initialData.phone,
    specialist: initialData.specialist || "",
    geo_location: {
      latitude:
        initialData.geo_location.latitude === ""
          ? DEFAULT_GEO_LOCATION.latitude
          : initialData.geo_location.latitude,
      longitude:
        initialData.geo_location.longitude === ""
          ? DEFAULT_GEO_LOCATION.longitude
          : initialData.geo_location.longitude,
    },
  });

  const selectedDays = toSelectedDays(formData.work_days);
  const mapLatitude =
    formData.geo_location.latitude === ""
      ? DEFAULT_GEO_LOCATION.latitude
      : formData.geo_location.latitude;
  const mapLongitude =
    formData.geo_location.longitude === ""
      ? DEFAULT_GEO_LOCATION.longitude
      : formData.geo_location.longitude;

  const handleWorkDayToggle = (day: string) => {
    const nextDays = selectedDays.includes(day)
      ? selectedDays.filter((selectedDay) => selectedDay !== day)
      : [...selectedDays, day];

    setFormData((prev) => ({
      ...prev,
      work_days: nextDays.join(","),
    }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleLicenceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLicenceFile(file);
    setLicenceFileName(file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = buildRequestPayload(formData);

      const multipartBody = new FormData();

      appendPayloadToFormData(multipartBody, payload);

      if (photoFile) {
        multipartBody.append("photo", photoFile);
      }

      if (licenceFile) {
        multipartBody.append("licence", licenceFile);
      }
      
      const response = await fetch("/api/user/me", {
        method: "PATCH",
        credentials: "include",
        body: multipartBody,
      });

      let result = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      console.log("PROFILE UPDATE RESPONSE:", result);

      // لو الـ API رجع 200 او 201 يبقي نجاح
      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            t("settingsPage.updateProfileError", locale),
        );
      }

      setSuccess(true);

      // تحديث البيانات فورًا
      const updatedProfile = getUpdatedProfile(result) || {
        ...formData,
        photo: photoPreview,
      };

      onSuccess?.(updatedProfile);

      // استني شوية للصورة
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : t("settingsPage.updateProfileError", locale),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 p-0 sm:p-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-h-[100dvh] w-full max-w-4xl overflow-y-auto border border-(--card-border) bg-(--card-bg) shadow-lg sm:max-h-[92vh] sm:rounded-2xl">
        <div className={`sticky top-0 z-10 flex items-center justify-between border-b border-(--card-border) bg-(--card-bg) p-4 sm:p-6 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 transition hover:text-gray-700 cursor-pointer"
            aria-label={t("settingsPage.close", locale)}
          >
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold text-(--text-primary) sm:text-2xl">
            {t("settingsPage.editProfile", locale)}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:space-y-6 sm:p-6">
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
              {t("settingsPage.profileUpdated", locale)}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-[180px_1fr]">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-(--card-border) bg-(--semi-card-bg) p-4">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-(--card-border) bg-(--card-bg)">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={
                      formData.full_name ||
                      t("settingsPage.doctorPhotoAlt", locale)
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera className="text-(--text-secondary)" size={32} />
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600">
                <Camera size={16} />
                {t("settingsPage.photo", locale)}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-start">
                <span className="mb-2 block text-sm font-semibold text-(--text-primary)">
                  {t("settingsPage.fullName", locale)}
                </span>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-(--card-border) bg-(--card-bg) px-4 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-blue-500 text-start"
                  required
                />
              </label>

              <label className="block text-start">
                <span className="mb-2 block text-sm font-semibold text-(--text-primary)">
                  {t("settingsPage.phone", locale)}
                </span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-(--card-border) bg-(--card-bg) px-4 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-blue-500 text-start"
                />
              </label>

              <label className="block text-start">
                <span className="mb-2 block text-sm font-semibold text-(--text-primary)">
                  {t("settingsPage.gender", locale)}
                </span>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, gender: e.target.value }))
                  }
                  className="w-full rounded-lg border border-(--card-border) bg-(--card-bg) px-4 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-blue-500 text-start"
                >
                  <option value="">{t("settingsPage.genderNotSpecified", locale)}</option>
                  <option value="male">{t("settingsPage.genderMale", locale)}</option>
                  <option value="female">{t("settingsPage.genderFemale", locale)}</option>
                </select>
              </label>

              <label className="block text-start">
                <span className="mb-2 block text-sm font-semibold text-(--text-primary)">
                  {t("settingsPage.yearsExperience", locale)}
                </span>
                <input
                  type="number"
                  value={formData.years_of_experience}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      years_of_experience:
                        e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-(--card-border) bg-(--card-bg) px-4 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-blue-500 text-start"
                  min="0"
                  step="1"
                />
              </label>

              <label className="block text-start">
                <span className="mb-2 block text-sm font-semibold text-(--text-primary)">
                  {t("settingsPage.consultationPriceField", locale)}
                </span>
                <input
                  type="number"
                  value={formData.consultation_price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      consultation_price:
                        e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-(--card-border) bg-(--card-bg) px-4 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-blue-500 text-start"
                  required
                  min="0"
                  step="1"
                />
              </label>

              <label className="block text-start">
                <span className="mb-2 block text-sm font-semibold text-(--text-primary)">
                  {t("settingsPage.specialty", locale)}
                </span>
                <select
                  value={formData.specialist}
                  disabled
                  className="w-full rounded-lg border border-(--card-border) bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 text-zinc-500 cursor-not-allowed focus:outline-none text-start"
                >
                  <option value="">{t("settingsPage.chooseSpecialty", locale)}</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>{getSpecialistLabel(s, locale)}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <label className="block text-start">
            <span className="mb-2 block text-sm font-semibold text-(--text-primary)">
              {t("settingsPage.bio", locale)}
            </span>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              className="min-h-28 w-full resize-y rounded-lg border border-(--card-border) bg-(--card-bg) px-4 py-3 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-blue-500 text-start"
            />
          </label>

          <div className="text-start">
            <label className="mb-3 block text-sm font-semibold text-(--text-primary)">
              {t("settingsPage.workDays", locale)}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {WORK_DAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleWorkDayToggle(day.value)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition cursor-pointer ${
                    selectedDays.includes(day.value)
                      ? "bg-blue-500 text-white"
                      : "bg-(--semi-card-bg) text-(--text-primary) hover:bg-gray-300"
                  }`}
                >
                  {t(`settingsPage.${day.value}`, locale)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-start">
              <span className="mb-2 block text-sm font-semibold text-(--text-primary)">
                {t("settingsPage.workFrom", locale)}
              </span>
              <input
                type="time"
                value={formData.work_from}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    work_from: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-(--card-border) bg-(--card-bg) px-4 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-blue-500 text-start"
                required
              />
            </label>

            <label className="block text-start">
              <span className="mb-2 block text-sm font-semibold text-(--text-primary)">
                {t("settingsPage.workTo", locale)}
              </span>
              <input
                type="time"
                value={formData.work_to}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    work_to: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-(--card-border) bg-(--card-bg) px-4 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-blue-500 text-start"
                required
              />
            </label>
          </div>

          <div className="space-y-4 rounded-xl border border-(--card-border) p-4">
            <div className="flex items-end gap-3">
              <label className="flex-1 text-start">
                <span className="mb-2 block text-sm font-semibold text-(--text-primary)">
                  {t("settingsPage.location", locale)}
                </span>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-(--card-border) bg-(--card-bg) px-4 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-blue-500 text-start"
                  placeholder={t("settingsPage.locationPlaceholder", locale)}
                />
              </label>
              <MapPin className="mt-7 shrink-0 text-blue-500" size={24} />
            </div>

            <div className="h-64 overflow-hidden rounded-lg border border-(--card-border) sm:h-80">
              <GeoLocationPicker
                latitude={mapLatitude}
                longitude={mapLongitude}
                onChange={(latitude, longitude) =>
                  setFormData((prev) => ({
                    ...prev,
                    geo_location: {
                      latitude: Number(latitude.toFixed(6)),
                      longitude: Number(longitude.toFixed(6)),
                    },
                  }))
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-start">
                <span className="mb-1 block text-xs font-medium text-(--text-secondary)">
                  {t("settingsPage.latitude", locale)}
                </span>
                <input
                  type="number"
                  value={formData.geo_location.latitude}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      geo_location: {
                        ...prev.geo_location,
                        latitude:
                          e.target.value === "" ? "" : Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-(--card-border) bg-(--card-bg) px-4 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-blue-500 text-start"
                  required
                  step="0.000001"
                />
              </label>

              <label className="block text-start">
                <span className="mb-1 block text-xs font-medium text-(--text-secondary)">
                  {t("settingsPage.longitude", locale)}
                </span>
                <input
                  type="number"
                  value={formData.geo_location.longitude}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      geo_location: {
                        ...prev.geo_location,
                        longitude:
                          e.target.value === "" ? "" : Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-(--card-border) bg-(--card-bg) px-4 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-blue-500 text-start"
                  required
                  step="0.000001"
                />
              </label>
            </div>
          </div>

          {/* Licence Upload */}
          <div className="rounded-xl border border-(--card-border) bg-(--semi-card-bg) p-4 text-start">
            <span className="mb-3 block text-sm font-semibold text-(--text-primary)">
              {t("settingsPage.licenceDoc", locale)}
            </span>
            <p className="mb-3 text-xs text-(--text-secondary)">
              {t("settingsPage.licenceUploadDesc", locale)}
            </p>
            <label className="inline-flex max-w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-(--card-border) bg-(--card-bg) px-4 py-3 text-sm text-(--text-primary) transition hover:border-blue-400 hover:bg-blue-50">
              <FileText size={18} className="shrink-0 text-blue-500" />
              <span className="max-w-[65vw] truncate sm:max-w-xs">
                {licenceFileName || t("settingsPage.chooseFile", locale)}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleLicenceChange}
                className="hidden"
              />
            </label>
            {licenceFileName && (
              <button
                type="button"
                onClick={() => { setLicenceFile(null); setLicenceFileName(""); }}
                className="ms-3 mt-2 cursor-pointer text-xs text-red-500 hover:underline"
              >
                {t("settingsPage.remove", locale)}
              </button>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-(--card-border) px-4 py-3 font-semibold text-(--text-primary) transition hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
            >
              {t("settingsPage.cancel", locale)}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  {t("settingsPage.saving", locale)}
                </>
              ) : (
                <>
                  <Save size={20} />
                  {t("settingsPage.saveChanges", locale)}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
