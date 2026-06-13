"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Star,
  User,
  Clock,
  Stethoscope,
  Calendar,
  DollarSign,
  FileText,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";
import EditProfileForm, { DoctorEditableProfile } from "./EditProfileForm";

const GeoLocationMap = dynamic(() => import("./GeoLocationPicker"), {
  ssr: false,
  loading: () => {
    const isEn = typeof window !== "undefined" && window.localStorage.getItem("locale") === "en";
    return (
      <div className="doctor-map-loading">
        <div className="doctor-map-loading-inner">
          <div className="doctor-map-pulse" />
          <span>{isEn ? "Loading map..." : "جاري تحميل الخريطة..."}</span>
        </div>
      </div>
    );
  },
});

type DoctorProfileData = {
  photo?: string | null;
  full_name?: string | null;
  phone?: string | null;
  gender?: string | null;
  bio?: string | null;
  location?: string | null;
  specialist?: string | null;
  work_days?: string | null;
  work_from?: string | null;
  work_to?: string | null;
  consultation_price?: number | string | null;
  years_of_experience?: number | string | null;
  total_ratings?: number | string | null;
  average_rating?: number | string | null;
  is_verified?: boolean | null;
  geo_location?: {
    latitude?: number | string | null;
    longitude?: number | string | null;
  } | null;
  licence?: string | null;
};

const DEFAULT_GEO_LOCATION = {
  latitude: 30.0444,
  longitude: 31.2357,
};

function valueOrDash(value: unknown) {
  return value === undefined || value === null || value === ""
    ? "—"
    : String(value);
}

function toNumberOrEmpty(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : "";
}

function formatWorkDays(workDays: string | null | undefined, locale: string) {
  if (!workDays) return "—";
  return workDays
    .split(",")
    .map((day) => {
      const d = day.trim().toLowerCase();
      return t(`settingsPage.${d}`, locale) || d;
    })
    .filter(Boolean)
    .join(" · ");
}

function formatTimeToAmPm(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  if (!Number.isFinite(hour) || !minuteText) return value;
  const isAr = locale === "ar";
  const period = hour >= 12 ? (isAr ? "م" : "PM") : (isAr ? "ص" : "AM");
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${minuteText.padStart(2, "0")} ${period}`;
}

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

function buildInitialData(profile: DoctorProfileData): DoctorEditableProfile {
  return {
    photo: profile.photo || null,
    full_name: profile.full_name || "",
    phone: profile.phone || "",
    gender: profile.gender || "",
    years_of_experience: toNumberOrEmpty(profile.years_of_experience),
    bio: profile.bio || "",
    work_days: profile.work_days || "",
    work_from: profile.work_from || "",
    work_to: profile.work_to || "",
    consultation_price: toNumberOrEmpty(profile.consultation_price),
    location: profile.location || "",
    geo_location: {
      latitude: toNumberOrEmpty(profile.geo_location?.latitude),
      longitude: toNumberOrEmpty(profile.geo_location?.longitude),
    },
    specialist: profile.specialist || "",
  };
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "gold" | "green" | "blue";
}) {
  const accentClasses = {
    gold: "ds-stat-gold",
    green: "ds-stat-green",
    blue: "ds-stat-blue",
  };
  return (
    <div className={`ds-stat-card ${accentClasses[accent]}`}>
      <div className="ds-stat-icon">{icon}</div>
      <div className="ds-stat-value">{value}</div>
      <div className="ds-stat-label">{label}</div>
    </div>
  );
}

// ─── Info Row ───────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="ds-info-row">
      <div className="ds-info-content">
        <div className="ds-info-value">{value}</div>
        <span className="ds-info-label">{label}</span>
      </div>
      <div className="ds-info-icon">{icon}</div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function DoctorSettingsPage() {
  const { user, loading, updateUser } = useAuth();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [profileOverride, setProfileOverride] =
    useState<DoctorProfileData | null>(null);

  const userPhoto =
    user && "photo" in user && typeof user.photo === "string"
      ? user.photo
      : null;

  const profileData: DoctorProfileData = {
    ...((user?.profile as DoctorProfileData | undefined) || {}),
    photo: userPhoto,
    ...(profileOverride || {}),
  };

  const mapLatitude = toNumberOrEmpty(profileData.geo_location?.latitude);
  const mapLongitude = toNumberOrEmpty(profileData.geo_location?.longitude);
  const resolvedLatitude =
    mapLatitude === "" ? DEFAULT_GEO_LOCATION.latitude : mapLatitude;
  const resolvedLongitude =
    mapLongitude === "" ? DEFAULT_GEO_LOCATION.longitude : mapLongitude;

  const initials = useMemo(() => {
    const name = profileData.full_name?.trim();
    if (!name) return "";
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("");
  }, [profileData.full_name]);

  const handleEditSuccess = (updatedProfile: Record<string, unknown>) => {
    const profileUpdate = updatedProfile as DoctorProfileData;
    setProfileOverride((prev) => ({
      ...(prev || profileData),
      ...profileUpdate,
    }));
    if (updateUser && user) {
      const mergedProfile = {
        ...((user.profile as DoctorProfileData) || {}),
        ...profileUpdate,
      };
      updateUser({
        ...user,
        profile: mergedProfile,
        ...(typeof profileUpdate.photo === "string"
          ? { photo: profileUpdate.photo }
          : {}),
      });
    }
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire({
        icon: "error",
        title: t("settingsPage.errorTitle", locale),
        text: t("settingsPage.fillAllFields", locale),
        confirmButtonText: t("settingsPage.ok", locale),
      });
      return;
    }

    if (newPassword.length < 8) {
      Swal.fire({
        icon: "error",
        title: t("settingsPage.errorTitle", locale),
        text: t("settingsPage.minChars", locale),
        confirmButtonText: t("settingsPage.ok", locale),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: t("settingsPage.errorTitle", locale),
        text: t("settingsPage.passwordMismatch", locale),
        confirmButtonText: t("settingsPage.ok", locale),
      });
      return;
    }

    try {
      setPasswordUpdating(true);
      const response = await fetch("/api/user/change-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token || ""}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || t("settingsPage.failedChange", locale));
      }

      Swal.fire({
        icon: "success",
        title: t("settingsPage.successTitle", locale),
        text: t("settingsPage.passwordChanged", locale),
        confirmButtonText: t("settingsPage.great", locale),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      Swal.fire({
        icon: "error",
        title: t("settingsPage.changeFailedTitle", locale),
        text:
          err instanceof Error
            ? err.message
            : t("settingsPage.changeError", locale),
        confirmButtonText: t("settingsPage.ok", locale),
      });
    } finally {
      setPasswordUpdating(false);
    }
  };


  if (loading) {
    return (
      <div className="ds-loading">
        <div className="ds-loading-spinner" />
        <p>{t("settingsPage.loadingData", locale)}</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* ── Google Fonts ── */
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Tajawal:wght@300;400;500;700&display=swap');

        /* ── Design Tokens ── */
        :root {
          --ds-teal:        #0d9488;
          --ds-teal-light:  #14b8a6;
          --ds-teal-glow:   rgba(13,148,136,0.09);
          --ds-teal-border: rgba(13,148,136,0.2);
          --ds-gold:        #f59e0b;
          --ds-gold-soft:   rgba(245,158,11,0.08);
          --ds-gold-border: rgba(245,158,11,0.18);
          --ds-green:       #10b981;
          --ds-green-soft:  rgba(16,185,129,0.08);
          --ds-green-border:rgba(16,185,129,0.18);
          --ds-blue:        #3b82f6;
          --ds-blue-soft:   rgba(59,130,246,0.08);
          --ds-blue-border: rgba(59,130,246,0.18);
          --ds-bg:          #f5f7fa;
          --ds-card:        #ffffff;
          --ds-border:      #e8edf3;
          --ds-border-hover:#d0dae8;
          --ds-text-primary:   #0f172a;
          --ds-text-secondary: #475569;
          --ds-text-muted:     #94a3b8;
          --ds-radius:    18px;
          --ds-radius-sm: 10px;
          --ds-shadow:    0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06);
          --ds-shadow-md: 0 2px 8px rgba(0,0,0,0.07), 0 8px 32px rgba(0,0,0,0.07);
        }

        /* ── Loading State ── */
        .ds-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: 16px;
          color: var(--ds-text-secondary);
          font-family: 'Cairo', sans-serif;
          background: var(--ds-bg);
        }
        .ds-loading-spinner {
          width: 40px; height: 40px;
          border: 3px solid var(--ds-border);
          border-top-color: var(--ds-teal);
          border-radius: 50%;
          animation: ds-spin 0.8s linear infinite;
        }
        @keyframes ds-spin { to { transform: rotate(360deg); } }

        /* ── Page Wrapper ── */
        .ds-page {
          --ds-align-items: flex-start;
          --ds-text-align: start;
          min-height: 100vh;
          background: var(--ds-bg);
          font-family: 'Cairo', sans-serif;
          padding: 32px 24px 60px;
          position: relative;
          overflow-x: hidden;
        }
        .ds-page::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 260px;
          background: linear-gradient(160deg, #e0f2f1 0%, #f0fdf8 50%, #f5f7fa 100%);
          pointer-events: none;
          z-index: 0;
        }
        .ds-inner {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ── Card base ── */
        .ds-card {
          min-width: 0;
          background: var(--ds-card);
          border: 1px solid var(--ds-border);
          border-radius: var(--ds-radius);
          box-shadow: var(--ds-shadow);
          transition: box-shadow 0.25s ease;
        }

        /* ── Hero Card ── */
        .ds-hero {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .ds-hero-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }
        .ds-hero-identity {
          display: flex;
          align-items: center;
          gap: 20px;
          min-width: 0;
        }

        /* Avatar */
        .ds-avatar-ring {
          position: relative;
          flex-shrink: 0;
        }
        .ds-avatar-ring::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, var(--ds-teal), #67e8f9, var(--ds-teal));
          animation: ds-spin 6s linear infinite;
          z-index: 0;
        }
        .ds-avatar-ring::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 50%;
          background: #fff;
          z-index: 1;
        }
        .ds-avatar {
          position: relative;
          z-index: 2;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e0f2f1, #ccfbf1);
          font-size: 36px;
          font-weight: 700;
          color: var(--ds-teal);
          letter-spacing: 2px;
          overflow: hidden;
          font-family: 'Tajawal', sans-serif;
        }
        .ds-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        /* Verified badge */
        .ds-verified-badge {
          position: absolute;
          bottom: 4px;
          left: 4px;
          z-index: 3;
          width: 26px; height: 26px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--ds-teal);
          box-shadow: 0 1px 4px rgba(0,0,0,0.12);
        }

        .ds-doc-name {
          font-size: 26px;
          font-weight: 700;
          color: var(--ds-text-primary);
          line-height: 1.2;
          margin: 0;
          font-family: 'Tajawal', sans-serif;
          overflow-wrap: anywhere;
        }
        .ds-doc-specialty {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          font-size: 13px;
          color: var(--ds-teal);
          background: var(--ds-teal-glow);
          border: 1px solid var(--ds-teal-border);
          border-radius: 20px;
          padding: 4px 12px;
          font-weight: 600;
        }

        /* Edit button */
        .ds-edit-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          border: 1px solid var(--ds-border);
          background: #fff;
          color: var(--ds-text-secondary);
          font-size: 14px;
          font-family: 'Cairo', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .ds-edit-btn:hover {
          background: var(--ds-teal-glow);
          border-color: var(--ds-teal-border);
          color: var(--ds-teal);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(13,148,136,0.14);
        }

        /* ── Divider ── */
        .ds-divider {
          height: 1px;
          background: var(--ds-border);
        }

        /* ── Stats Row ── */
        .ds-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .ds-stat-card {
          border-radius: 14px;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          border: 1px solid transparent;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .ds-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }
        .ds-stat-gold {
          background: var(--ds-gold-soft);
          border-color: var(--ds-gold-border);
        }
        .ds-stat-green {
          background: var(--ds-green-soft);
          border-color: var(--ds-green-border);
        }
        .ds-stat-blue {
          background: var(--ds-blue-soft);
          border-color: var(--ds-blue-border);
        }
        .ds-stat-icon { opacity: 0.9; }
        .ds-stat-value {
          font-size: 22px;
          font-weight: 700;
          color: var(--ds-text-primary);
          font-family: 'Tajawal', sans-serif;
        }
        .ds-stat-label {
          font-size: 12px;
          color: var(--ds-text-secondary);
          font-weight: 500;
          text-align: center;
          overflow-wrap: anywhere;
        }

        /* ── Bottom Grid ── */
        .ds-bottom-grid {
          display: grid;
          gap: 24px;
          min-width: 0;
        }
        @media (min-width: 1024px) {
          .ds-bottom-grid {
            grid-template-columns: 1fr 340px;
          }
        }

        /* ── Section header ── */
        .ds-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }
        .ds-section-icon {
          width: 36px; height: 36px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--ds-teal-glow);
          border: 1px solid var(--ds-teal-border);
          flex-shrink: 0;
        }
        .ds-section-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--ds-text-primary);
          font-family: 'Tajawal', sans-serif;
          margin: 0;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .ds-section-line {
          flex: 1;
          height: 1px;
          background: var(--ds-border);
        }

        /* ── Work Card ── */
        .ds-work-card {
          padding: 28px;
        }
        .ds-work-meta {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }
        .ds-work-chip {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #f8fafc;
          border: 1px solid var(--ds-border);
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 14px;
          color: var(--ds-text-secondary);
          min-width: 0;
          max-width: 100%;
        }
        .ds-work-chip strong {
          color: var(--ds-text-primary);
          font-weight: 600;
          overflow-wrap: anywhere;
        }
        .ds-work-chip svg {
          opacity: 0.5;
          flex-shrink: 0;
        }

        .ds-map-wrapper {
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--ds-border);
          height: 240px;
        }

        /* Map loading */
        .doctor-map-loading {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
        }
        .doctor-map-loading-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: var(--ds-text-muted);
          font-size: 13px;
          font-family: 'Cairo', sans-serif;
        }
        .doctor-map-pulse {
          width: 24px; height: 24px;
          border-radius: 50%;
          background: var(--ds-teal-glow);
          border: 2px solid var(--ds-teal);
          animation: ds-pulse 1.5s ease-in-out infinite;
        }
        @keyframes ds-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
        }

        .ds-bio {
          margin-top: 16px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid var(--ds-border);
          font-size: 14px;
          line-height: 1.9;
          color: var(--ds-text-secondary);
          font-family: 'Tajawal', sans-serif;
        }

        /* ── Info Card ── */
        .ds-info-card {
          padding: 28px;
        }
        .ds-info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          margin-bottom: 6px;
        }
        .ds-info-row:last-child { margin-bottom: 0; }
        .ds-info-row:hover {
          background: #f8fafc;
          border-color: var(--ds-border);
        }
        .ds-info-icon {
          width: 38px; height: 38px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--ds-teal-glow);
          border: 1px solid var(--ds-teal-border);
          flex-shrink: 0;
          color: var(--ds-teal);
        }
        .ds-info-content {
          display: flex;
          flex-direction: column;
          align-items: var(--ds-align-items);
          gap: 2px;
          min-width: 0;
          flex: 1;
        }
        .ds-info-label {
          font-size: 11px;
          color: var(--ds-text-muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .ds-info-value {
          font-size: 14px;
          color: var(--ds-text-primary);
          font-weight: 600;
          overflow-wrap: anywhere;
          word-break: normal;
          text-align: var(--ds-text-align);
          font-family: 'Tajawal', sans-serif;
        }

        /* ── Responsive ── */
        .ds-password-card {
          padding: 28px;
        }
        .ds-password-card form {
          padding: 0;
        }
        @media (max-width: 900px) {
          .ds-bottom-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        @media (max-width: 640px) {
          .ds-page { padding: 14px 10px 40px; }
          .ds-inner { gap: 14px; }
          .ds-card { border-radius: 14px; }
          .ds-hero { padding: 18px; gap: 20px; }
          .ds-hero-top {
            align-items: stretch;
            flex-direction: column;
          }
          .ds-hero-identity { gap: 14px; }
          .ds-avatar { width: 78px; height: 78px; font-size: 24px; }
          .ds-doc-name { font-size: 20px; }
          .ds-doc-specialty {
            white-space: normal;
            line-height: 1.5;
          }
          .ds-edit-btn {
            width: 100%;
            justify-content: center;
          }
          .ds-stats-row { grid-template-columns: 1fr; gap: 10px; }
          .ds-stat-card { padding: 16px 12px; }
          .ds-work-card, .ds-info-card, .ds-password-card { padding: 18px; }
          .ds-section-header { margin-bottom: 18px; }
          .ds-section-title { font-size: 16px; }
          .ds-work-meta {
            flex-direction: column;
            align-items: stretch;
          }
          .ds-work-chip {
            width: 100%;
            justify-content: flex-start;
            line-height: 1.6;
          }
          .ds-map-wrapper { height: 210px; }
          .ds-info-row { padding: 10px 6px; }
        }
        @media (max-width: 480px) {
          .ds-hero-identity { align-items: center; }
          .ds-avatar { width: 70px; height: 70px; }
          .ds-section-line { display: none; }
          .ds-map-wrapper { height: 190px; }
          .ds-info-label { font-size: 10px; }
          .ds-info-value { font-size: 13px; }
        }

        /* ── Entrance animations ── */
        @keyframes ds-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ds-inner > * {
          animation: ds-fade-up 0.5s ease forwards;
          opacity: 0;
        }
        .ds-inner > *:nth-child(1) { animation-delay: 0.05s; }
        .ds-inner > *:nth-child(2) { animation-delay: 0.15s; }
      `}</style>

      <div className="ds-page" dir={isRtl ? "rtl" : "ltr"}>
        {isEditOpen && (
          <EditProfileForm
            onClose={() => setIsEditOpen(false)}
            initialData={buildInitialData(profileData)}
            onSuccess={handleEditSuccess}
          />
        )}

        <div className="ds-inner">
          {/* ── HERO CARD ── */}
          <div className="ds-card ds-hero">
            <div className="ds-hero-top">
              <div className="ds-hero-identity">
                <div className="ds-avatar-ring">
                  <div className="ds-avatar">
                    {profileData.photo ? (
                      <img
                        src={profileData.photo}
                        alt={
                          profileData.full_name ||
                          t("settingsPage.doctorPhotoAlt", locale)
                        }
                      />
                    ) : (
                      initials || <User size={36} />
                    )}
                  </div>
                  {profileData.is_verified && (
                    <div className="ds-verified-badge">
                      <BadgeCheck size={14} color="#0d9488" />
                    </div>
                  )}
                </div>

                <div className="text-start">
                  <h2 className="ds-doc-name">
                    {valueOrDash(profileData.full_name)}
                  </h2>
                  {profileData.specialist && (
                    <div className="ds-doc-specialty">
                      <Stethoscope size={13} />
                      {getSpecialistLabel(profileData.specialist, locale)}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="ds-edit-btn"
              >
                <Pencil size={14} />
                {t("settingsPage.editProfile", locale)}
              </button>
            </div>

            <div className="ds-divider" />

            <div className="ds-stats-row">
              <StatCard
                accent="gold"
                icon={<Star size={22} fill="#f59e0b" color="#f59e0b" />}
                value={
                  profileData.average_rating
                    ? `${valueOrDash(profileData.average_rating)} / 5`
                    : "—"
                }
                label={`${valueOrDash(profileData.total_ratings)} ${t("settingsPage.ratings", locale)}`}
              />
              <StatCard
                accent="green"
                icon={<User size={22} color="#10b981" />}
                value={valueOrDash(profileData.years_of_experience)}
                label={t("settingsPage.yearsExperience", locale)}
              />
              <StatCard
                accent="blue"
                icon={
                  <BadgeCheck
                    size={22}
                    color={profileData.is_verified ? "#3b82f6" : "#4a6080"}
                  />
                }
                value={profileData.is_verified ? t("settingsPage.verified", locale) : t("settingsPage.notVerified", locale)}
                label={t("settingsPage.verificationStatus", locale)}
              />
            </div>
          </div>

          {/* ── BOTTOM GRID ── */}
          <div className="ds-bottom-grid">
            {/* Work Hours Card */}
            <div className="ds-card ds-work-card">
              <div className="ds-section-header">
                <div className="ds-section-icon">
                  <Clock size={16} color="#0d9488" />
                </div>
                <h3 className="ds-section-title">{t("settingsPage.workHoursLocation", locale)}</h3>
                <div className="ds-section-line" />
              </div>

              <div className="ds-work-meta">
                <div className="ds-work-chip">
                  <Calendar size={15} />
                  <strong>{formatWorkDays(profileData.work_days, locale)}</strong>
                </div>
                <div className="ds-work-chip">
                  <Clock size={15} />
                  <strong>
                    {formatTimeToAmPm(profileData.work_from, locale)} &nbsp;–&nbsp;{" "}
                    {formatTimeToAmPm(profileData.work_to, locale)}
                  </strong>
                </div>
                {profileData.consultation_price && (
                  <div className="ds-work-chip">
                    <DollarSign size={15} />
                    {t("settingsPage.consultationPrice", locale)}&nbsp;
                    <strong>{valueOrDash(profileData.consultation_price)}</strong>
                  </div>
                )}
              </div>

              <div className="ds-map-wrapper">
                <GeoLocationMap
                  latitude={resolvedLatitude}
                  longitude={resolvedLongitude}
                  onChange={() => {}}
                />
              </div>

              {profileData.bio && (
                <div className="ds-bio">{valueOrDash(profileData.bio)}</div>
              )}
            </div>

            {/* Personal Info Card */}
            <div className="ds-card ds-info-card">
              <div className="ds-section-header">
                <div className="ds-section-icon">
                  <User size={16} color="#0d9488" />
                </div>
                <h3 className="ds-section-title">{t("settingsPage.personalInfo", locale)}</h3>
              </div>

              <InfoRow
                icon={<Mail size={16} />}
                label={t("settingsPage.email", locale)}
                value={valueOrDash(user?.email)}
              />
              <InfoRow
                icon={<Phone size={16} />}
                label={t("settingsPage.phone", locale)}
                value={valueOrDash(profileData.phone)}
              />
              <InfoRow
                icon={<MapPin size={16} />}
                label={t("settingsPage.address", locale)}
                value={valueOrDash(profileData.location)}
              />
              <InfoRow
                icon={<User size={16} />}
                label={t("settingsPage.gender", locale)}
                value={
                  profileData.gender === "male"
                    ? t("settingsPage.genderMale", locale)
                    : profileData.gender === "female"
                      ? t("settingsPage.genderFemale", locale)
                      : profileData.gender
                        ? t("settingsPage.genderOther", locale)
                        : t("settingsPage.genderNotSpecified", locale)
                }
              />
              <InfoRow
                icon={<FileText size={16} />}
                label={t("settingsPage.professionalLicence", locale)}
                value={
                  profileData.licence ? (
                    <a
                      href={profileData.licence}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-800 underline font-semibold transition-colors"
                    >
                      {t("settingsPage.viewLicenceDoc", locale)}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          </div>

          {/* ── CHANGE PASSWORD CARD ── */}
          <div className="ds-card ds-password-card">
            <div className="ds-section-header">
              <div className="ds-section-icon">
                <Lock size={16} color="#0d9488" />
              </div>
              <h3 className="ds-section-title">{t("settingsPage.changePassword", locale)}</h3>
              <div className="ds-section-line" />
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 p-4">
              <div className="space-y-4 max-w-lg mx-auto">
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t("settingsPage.currentPassword", locale)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--ds-teal-border)] bg-transparent text-[var(--ds-text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--ds-teal)] transition-all text-start"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={t(
                      showCurrentPassword
                        ? "settingsPage.hidePassword"
                        : "settingsPage.showPassword",
                      locale,
                    )}
                    className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--ds-teal)] cursor-pointer ${isRtl ? "left-3" : "right-3"}`}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("settingsPage.newPassword", locale)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--ds-teal-border)] bg-transparent text-[var(--ds-text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--ds-teal)] transition-all text-start"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={t(
                      showNewPassword
                        ? "settingsPage.hidePassword"
                        : "settingsPage.showPassword",
                      locale,
                    )}
                    className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--ds-teal)] cursor-pointer ${isRtl ? "left-3" : "right-3"}`}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("settingsPage.confirmPassword", locale)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--ds-teal-border)] bg-transparent text-[var(--ds-text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--ds-teal)] transition-all text-start"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={t(
                      showConfirmPassword
                        ? "settingsPage.hidePassword"
                        : "settingsPage.showPassword",
                      locale,
                    )}
                    className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--ds-teal)] cursor-pointer ${isRtl ? "left-3" : "right-3"}`}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={passwordUpdating}
                  className="ds-edit-btn max-w-sm w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed justify-center"
                >
                  {passwordUpdating ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock size={16} />
                      {t("settingsPage.updatePassword", locale)}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>

  );
}
