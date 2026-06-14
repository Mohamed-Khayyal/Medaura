"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth, useLocale } from "@/lib/hooks";
import { useApi } from "@/lib/hooks/useApi";
import type { BookingResponse, BookingWithAccess, Prescription } from "@/lib/types/api";
import {
  Pill,
  Stethoscope,
  FlaskConical,
  StickyNote,
  CheckCircle,
  XCircle,
  Clock,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import Swal from "sweetalert2";

type ProfileForm = {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
};

type BookingView = BookingResponse &
  Partial<BookingWithAccess> & {
    booking_id?: number;
    booking_to?: string;
    doctor_name?: string;
    doctor_specialty?: string;
    staff_id?: number;
    staff_name?: string;
    staff_specialty?: string;
    specialist?: string;
    specialty?: string;
  };

type ProfileSummary = {
  name?: string;
  specialty?: string;
  photo?: string | null;
  image?: string | null;
};

type ProfileResponse = {
  status?: string;
  user?: {
    user_id: number;
    email: string;
    role: string;
    is_active: boolean;
    photo: string | null;
    updated_at?: string;
    profile?: {
      full_name?: string | null;
      date_of_birth?: string | null;
      gender?: string | null;
      phone?: string | null;
    };
  };
  email?: string;
  photo?: string | null;
  updated_at?: string;
  profile?: {
    full_name?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    phone?: string | null;
  };
};

const translations = {
  ar: {
    welcome: "مرحبًا بك في ملف المريض",
    summaryDesc: "هنا تجد ملخص حسابك، سجل الزيارات، الوصفات الطبية، وكل ما تحتاجه لتتبع حالتك الصحية بسهولة.",
    visits: "الزيارات",
    prescriptions: "الوصفات",
    lastUpdate: "أحدث تحديث",
    patientName: "اسم المريض",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    dob: "تاريخ الميلاد",
    gender: "النوع",
    quickMenu: "القائمة السريعة",
    navProfile: "الملف الشخصي",
    navHistory: "سجل الزيارات",
    navPrescriptions: "الوصفات الطبية",
    navFollowup: "المتابعة",
    updateProfile: "تحديث الملف الشخصي",
    profileSubtitle: "نمذج بياناتك الشخصية",
    profilePhoto: "صورة الملف الشخصي",
    noPhoto: "لا توجد صورة",
    chooseNewPhoto: "اختر صورة جديدة",
    photoRequirements: "JPG, PNG بحد أقصى 5MB",
    changePhoto: "تغيير الصورة",
    savePhoto: "حفظ الصورة",
    savingPhoto: "جارٍ الرفع...",
    photoSuccess: "تم تحديث الصورة بنجاح.",
    fullNameLabel: "الاسم الكامل",
    phonePlaceholder: "010XXXXXXXX",
    genderUnspecified: "غير محدد",
    genderMale: "ذكر",
    genderFemale: "أنثى",
    changesSuccess: "تم حفظ التغييرات بنجاح.",
    saveChanges: "حفظ التغييرات",
    savingChanges: "جارٍ الحفظ...",
    reset: "إعادة تعيين",
    changePasswordTitle: "تغيير كلمة المرور",
    changePasswordSubtitle: "تحديث كلمة المرور الخاصة بك",
    currentPasswordLabel: "كلمة المرور الحالية",
    newPasswordLabel: "كلمة المرور الجديدة",
    confirmPasswordLabel: "تأكيد كلمة المرور الجديدة",
    updatePasswordBtn: "تحديث كلمة المرور",
    updatingPassword: "جارٍ التحديث...",
    historyTitle: "سجل زياراتك",
    historySubtitle: "آخر زيارات",
    historyCount: "عرض {count} زيارة",
    loadingHistory: "جارٍ تحميل السجل...",
    noHistory: "لا توجد زيارات حتى الآن.",
    doctor: "الطبيب",
    time: "الوقت",
    pendingAccess: "الطبيب يطلب إذنك لكتابة روشتة طبية لهذا الحجز",
    accept: "قبول",
    reject: "رفض",
    acceptedAccess: "تم منح الطبيب صلاحية كتابة الروشتة",
    revokeAccess: "إلغاء الصلاحية",
    rejectedAccess: "تم رفض/إلغاء صلاحية الروشتة",
    allowAccess: "السماح بالوصول",
    prescriptionsTitle: "الوصفات الطبية",
    prescriptionsSubtitle: "الوصفات الأخيرة",
    prescriptionsCount: "عرض {count} وصفة",
    loadingPrescriptions: "جارٍ تحميل الوصفات...",
    noPrescriptions: "لا توجد وصفات طبية بعد.",
    noDate: "بدون تاريخ",
    prescriptionNumber: "وصفة #{id}",
    diagnosis: "التشخيص",
    medication: "الدواء",
    tests: "الفحوصات",
    notes: "ملاحظات",
    prescriptionDetails: "تفاصيل الوصفة",
    dose: "الجرعة",
    duration: "المدة",
    forDuration: "لمدة {duration}",
    followupTitle: "متابعة الحالة",
    followupSubtitle: "خطة المتابعة",
    followupDesc: "تحديث سريع لحالتك الصحية",
    recommendationsTitle: "التوصيات",
    recommendationsText: "تابع مع الطبيب بانتظام، احرص على تسجيل الأعراض، واحضر نتائج التحاليل في كل زيارة.",
    tipsTitle: "نصائح مهمه",
    tipsText: "يمكنك تحديث رقم الهاتف والملاحظات الخاصة بك في أي وقت ثم الضغط على حفظ للتأكد من وصول الرسائل بسهولة.",
    notAvailable: "غير متوفر",
    checkingAccount: "جارٍ التحقق من حسابك...",
    needLoginTitle: "أنت بحاجة لتسجيل الدخول",
    needLoginDesc: "يرجى تسجيل الدخول أولاً لعرض صفحتك الشخصية وسجل زياراتك.",
    status: "الحالة",
    successAlert: "تم بنجاح",
    successMsg: "تم تغيير كلمة المرور بنجاح",
    alertOk: "موافق",
    alertCool: "رائع",
    alertError: "خطأ",
    alertFillFields: "الرجاء تعبئة جميع حقول كلمة المرور",
    alertMinLength: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل",
    alertMatchError: "كلمة المرور الجديدة وتأكيدها غير متطابقتين",
    changePasswordFail: "فشل التغيير",
    symptoms: "الأعراض"
  },
  en: {
    welcome: "Welcome to Patient Profile",
    summaryDesc: "Here you will find a summary of your account, visit history, prescriptions, and everything you need to easily track your health status.",
    visits: "Visits",
    prescriptions: "Prescriptions",
    lastUpdate: "Last Update",
    patientName: "Patient Name",
    email: "Email",
    phone: "Phone Number",
    dob: "Date of Birth",
    gender: "Gender",
    quickMenu: "Quick Menu",
    navProfile: "Profile",
    navHistory: "Visit History",
    navPrescriptions: "Prescriptions",
    navFollowup: "Follow-up",
    updateProfile: "Update Profile",
    profileSubtitle: "Model your personal details",
    profilePhoto: "Profile Photo",
    noPhoto: "No image",
    chooseNewPhoto: "Choose a new photo",
    photoRequirements: "JPG, PNG max 5MB",
    changePhoto: "Change photo",
    savePhoto: "Save photo",
    savingPhoto: "Uploading...",
    photoSuccess: "Photo updated successfully.",
    fullNameLabel: "Full Name",
    phonePlaceholder: "010XXXXXXXX",
    genderUnspecified: "Unspecified",
    genderMale: "Male",
    genderFemale: "Female",
    changesSuccess: "Changes saved successfully.",
    saveChanges: "Save Changes",
    savingChanges: "Saving...",
    reset: "Reset",
    changePasswordTitle: "Change Password",
    changePasswordSubtitle: "Update your account password",
    currentPasswordLabel: "Current Password",
    newPasswordLabel: "New Password",
    confirmPasswordLabel: "Confirm New Password",
    updatePasswordBtn: "Update Password",
    updatingPassword: "Updating...",
    historyTitle: "Your Visits History",
    historySubtitle: "Last Visits",
    historyCount: "Showing {count} visit(s)",
    loadingHistory: "Loading history...",
    noHistory: "No visits recorded yet.",
    doctor: "Doctor",
    time: "Time",
    pendingAccess: "The doctor is requesting access to write a prescription for this booking",
    accept: "Accept",
    reject: "Reject",
    acceptedAccess: "Doctor has been granted access to write a prescription",
    revokeAccess: "Revoke Access",
    rejectedAccess: "Prescription access has been rejected/revoked",
    allowAccess: "Allow Access",
    prescriptionsTitle: "Prescriptions",
    prescriptionsSubtitle: "Recent Prescriptions",
    prescriptionsCount: "Showing {count} prescription(s)",
    loadingPrescriptions: "Loading prescriptions...",
    noPrescriptions: "No prescriptions found yet.",
    noDate: "No Date",
    prescriptionNumber: "Prescription #{id}",
    diagnosis: "Diagnosis",
    medication: "Medication",
    tests: "Tests/Labs",
    notes: "Notes",
    prescriptionDetails: "Prescription Details",
    dose: "Dose",
    duration: "Duration",
    forDuration: "for {duration}",
    followupTitle: "Status Follow-up",
    followupSubtitle: "Follow-up Plan",
    followupDesc: "Quick update on your health status",
    recommendationsTitle: "Recommendations",
    recommendationsText: "Follow up with your doctor regularly, keep track of symptoms, and bring lab results to every visit.",
    tipsTitle: "Important Tips",
    tipsText: "You can update your phone number and notes at any time and click save to ensure messages reach you easily.",
    notAvailable: "N/A",
    checkingAccount: "Checking your account...",
    needLoginTitle: "You need to log in",
    needLoginDesc: "Please log in first to view your personal profile and visit history.",
    status: "Status",
    successAlert: "Successful",
    successMsg: "Password changed successfully",
    alertOk: "OK",
    alertCool: "Cool",
    alertError: "Error",
    alertFillFields: "Please fill in all password fields",
    alertMinLength: "Password must be at least 8 characters long",
    alertMatchError: "New password and confirmation do not match",
    changePasswordFail: "Failed to Change",
    symptoms: "Symptoms"
  }
};

const DOCTOR_FALLBACK_IMAGE = "/images/blank-profile-picture.png";

export default function PatientProfilePage() {
  const locale = useLocale() as "ar" | "en";
  const isRtl = locale === "ar";

  const navItems = [
    { id: "profile", label: translations[locale].navProfile },
    { id: "history", label: translations[locale].navHistory },
    { id: "prescriptions", label: translations[locale].navPrescriptions },
    { id: "followup", label: translations[locale].navFollowup },
  ];

  const { user, loading: authLoading } = useAuth();
  const profileApi = useApi<ProfileResponse>();
  const bookingsApi = useApi<BookingResponse[]>();
  const prescriptionsApi = useApi<Prescription[]>();

  const [activeSection, setActiveSection] = useState("profile");
  const [form, setForm] = useState<ProfileForm>({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
  });
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoState, setPhotoState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [doctorProfiles, setDoctorProfiles] = useState<
    Record<number, ProfileSummary>
  >({});
  const [staffProfiles, setStaffProfiles] = useState<
    Record<number, ProfileSummary>
  >({});

  // Booking access respond state
  const [accessRespondLoading, setAccessRespondLoading] = useState<number | null>(null);
  const [localBookings, setLocalBookings] = useState<BookingView[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const profileUser = useMemo(() => {
    const data = profileApi.data;

    if (!data) return null;

    if (data.user) {
      return data.user;
    }

    return {
      user_id: user?.id || 0,
      email: data.email || user?.email || "",
      role: user?.user_type || "patient",
      is_active: true,
      photo: data.photo || null,
      updated_at: data.updated_at,
      profile: data.profile || {},
    };
  }, [profileApi.data, user]);

  useEffect(() => {
    if (!user) return;

    profileApi.execute("/api/user/me");
    bookingsApi.execute("/api/bookings/my-bookings");
    prescriptionsApi.execute("/api/prescriptions/my-prescriptions");
  }, [user]);

  useEffect(() => {
    if (!profileUser) return;

    // Keep the editable form in sync when the profile response arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      full_name: profileUser.profile?.full_name || "",
      email: profileUser.email || "",
      phone: profileUser.profile?.phone || "",
      date_of_birth: formatDateOnly(profileUser.profile?.date_of_birth || ""),
      gender: profileUser.profile?.gender || "",
    });
  }, [profileUser]);

  useEffect(() => {
    if (!profileUser || photoFile) return;
    setPhotoPreview(profileUser.photo || "");
  }, [profileUser, photoFile]);

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const bookings = useMemo(
    () =>
      Array.isArray(bookingsApi.data)
        ? (bookingsApi.data as BookingView[])
        : [],
    [bookingsApi.data],
  );

  // Sync localBookings when API data arrives
  useEffect(() => {
    if (Array.isArray(bookingsApi.data)) {
      setLocalBookings(bookingsApi.data as BookingView[]);
    }
  }, [bookingsApi.data]);

  const prescriptions = useMemo(
    () => (Array.isArray(prescriptionsApi.data) ? prescriptionsApi.data : []),
    [prescriptionsApi.data],
  );

  const bookingCount = bookings.length;
  const prescriptionCount = prescriptions.length;

  const visitsSummary = useMemo(() => {
    return bookings.slice(0, 4).map((booking) => ({
      id: booking.id,
      title:
        booking.status === "completed"
          ? (isRtl ? "زيارة مكتملة" : "Completed Visit")
          : booking.status === "confirmed"
            ? (isRtl ? "حجز مؤكد" : "Confirmed Booking")
            : (isRtl ? "حجز جديد" : "New Booking"),
      subtitle: booking.booking_date,
      extra: booking.booking_from,
      status: booking.status,
    }));
  }, [bookings, isRtl]);

  const prescriptionsSummary = useMemo(() => {
    return prescriptions.slice(0, 4).map((prescription) => ({
      id: prescription.id,
      title: isRtl ? `وصفة طبية #${prescription.id}` : `Prescription #${prescription.id}`,
      subtitle: prescription.created_at?.split("T")[0] || "",
      extra: prescription.content || (isRtl ? "لا يوجد تفاصيل إضافية" : "No additional details"),
    }));
  }, [prescriptions, isRtl]);

  type ApiRecord = Record<string, unknown>;

  function isRecord(value: unknown): value is ApiRecord {
    return typeof value === "object" && value !== null;
  }

  function unwrapData(data: unknown): unknown {
    if (isRecord(data) && data.data !== undefined) return unwrapData(data.data);
    return data;
  }

  function normalizeProfileSummary(payload: unknown): ProfileSummary | null {
    const unwrapped = unwrapData(payload);
    if (!isRecord(unwrapped)) return null;

    const record = (unwrapped.profile ||
      unwrapped.doctor ||
      unwrapped.staff ||
      unwrapped) as ApiRecord;
    const name =
      typeof record.full_name === "string"
        ? record.full_name
        : typeof record.name === "string"
          ? record.name
          : undefined;
    const specialty =
      typeof record.specialist === "string"
        ? record.specialist
        : typeof record.role_title === "string"
          ? record.role_title
          : typeof record.specialty === "string"
            ? record.specialty
            : undefined;
    const photo = typeof record.photo === "string" ? record.photo : null;
    const image = typeof record.image === "string" ? record.image : null;

    if (!name && !specialty && !photo && !image) return null;
    return { name, specialty, photo, image };
  }

  function formatDateOnly(value?: string) {
    if (!value) return "";
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toISOString().slice(0, 10);
  }

  useEffect(() => {
    if (bookings.length === 0) return;

    const doctorIds = Array.from(
      new Set(bookings.map((booking) => booking.doctor_id).filter(Boolean)),
    ) as number[];
    const staffIds = Array.from(
      new Set(bookings.map((booking) => booking.staff_id).filter(Boolean)),
    ) as number[];

    const missingDoctorIds = doctorIds.filter((id) => !doctorProfiles[id]);
    const missingStaffIds = staffIds.filter((id) => !staffProfiles[id]);

    if (missingDoctorIds.length === 0 && missingStaffIds.length === 0) return;

    let cancelled = false;

    async function loadProfiles() {
      const doctorRequests = missingDoctorIds.map(async (id) => {
        const response = await fetch(`/api/doctors/profile?id=${id}`, {
          credentials: "include",
        });
        const payload = await response.json();
        if (!response.ok || payload.success === false) {
          throw new Error(
            payload.error || payload.message || "Failed to load doctor profile",
          );
        }
        const summary = normalizeProfileSummary(payload);
        return summary ? { id, summary } : null;
      });

      const staffRequests = missingStaffIds.map(async (id) => {
        const response = await fetch(`/api/staff/${id}/profile`, {
          credentials: "include",
        });
        const payload = await response.json();
        if (!response.ok || payload.success === false) {
          throw new Error(
            payload.error || payload.message || "Failed to load staff profile",
          );
        }
        const summary = normalizeProfileSummary(payload);
        return summary ? { id, summary } : null;
      });

      const results = await Promise.allSettled([
        ...doctorRequests,
        ...staffRequests,
      ]);

      if (cancelled) return;

      const nextDoctors: Record<number, ProfileSummary> = {};
      const nextStaff: Record<number, ProfileSummary> = {};

      results.forEach((result, index) => {
        if (result.status !== "fulfilled" || !result.value) return;
        const value = result.value;
        if (index < doctorRequests.length) {
          nextDoctors[value.id] = value.summary;
        } else {
          nextStaff[value.id] = value.summary;
        }
      });

      if (Object.keys(nextDoctors).length > 0) {
        setDoctorProfiles((current) => ({ ...current, ...nextDoctors }));
      }
      if (Object.keys(nextStaff).length > 0) {
        setStaffProfiles((current) => ({ ...current, ...nextStaff }));
      }
    }

    loadProfiles();

    return () => {
      cancelled = true;
    };
  }, [bookings, doctorProfiles, staffProfiles]);

  const handleFieldChange = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
    setSaveState("idle");
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoPreview(previewUrl);
    setPhotoState("idle");
    setPhotoError(null);
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    setPhotoState("uploading");
    setPhotoError(null);

    try {
      const formData = new FormData();
      formData.append("photo", photoFile);

      const response = await fetch("/api/user/me", {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });
      const payload = await response.json();

      if (!response.ok || payload.success === false) {
        throw new Error(
          payload.error || payload.message || "Failed to update photo",
        );
      }

      setPhotoState("success");
      setPhotoFile(null);
      profileApi.execute("/api/user/me");
    } catch (error: unknown) {
      setPhotoState("error");
      setPhotoError(
        error instanceof Error ? error.message : translations[locale].changePasswordFail,
      );
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaveState("saving");
    setFormError(null);

    try {
      const payload = {
        full_name: form.full_name || null,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
      };

      await profileApi.execute("/api/user/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setSaveState("success");
    } catch (error: unknown) {
      setSaveState("error");
      setFormError(
        error instanceof Error ? error.message : (isRtl ? "حدث خطأ أثناء حفظ التغييرات." : "An error occurred while saving changes."),
      );
    }
  };

  const handleRespondAccess = async (bookingId: number, action: "accept" | "reject") => {
    setAccessRespondLoading(bookingId);
    try {
      const response = await fetch(
        `/api/prescriptions/bookings/${bookingId}/access`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || (isRtl ? "حدث خطأ" : "An error occurred"));
        return;
      }
      // Update local bookings state
      setLocalBookings((prev) =>
        prev.map((b) =>
          (b.booking_id || (b as unknown as Record<string, number>).booking_id) === bookingId
            ? { ...b, prescription_access_status: action === "accept" ? "accepted" : "rejected" }
            : b,
        ),
      );
    } catch {
      alert(isRtl ? "حدث خطأ في الاتصال" : "Connection error");
    } finally {
      setAccessRespondLoading(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire({
        icon: "error",
        title: translations[locale].alertError,
        text: translations[locale].alertFillFields,
        confirmButtonText: translations[locale].alertOk,
      });
      return;
    }

    if (newPassword.length < 8) {
      Swal.fire({
        icon: "error",
        title: translations[locale].alertError,
        text: translations[locale].alertMinLength,
        confirmButtonText: translations[locale].alertOk,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: translations[locale].alertError,
        text: translations[locale].alertMatchError,
        confirmButtonText: translations[locale].alertOk,
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
        throw new Error(result.error || (isRtl ? "فشل تغيير كلمة المرور" : "Failed to change password"));
      }

      Swal.fire({
        icon: "success",
        title: translations[locale].successAlert,
        text: translations[locale].successMsg,
        confirmButtonText: translations[locale].alertCool,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: translations[locale].changePasswordFail,
        text: err.message || (isRtl ? "حدث خطأ أثناء تغيير كلمة المرور" : "An error occurred while changing password"),
        confirmButtonText: translations[locale].alertOk,
      });
    } finally {
      setPasswordUpdating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-6 shadow-md border border-slate-200">
          {translations[locale].checkingAccount}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center px-4 py-10" dir={isRtl ? "rtl" : "ltr"}>
        <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-3">
            {translations[locale].needLoginTitle}
          </h1>
          <p className="text-slate-600">
            {translations[locale].needLoginDesc}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="mx-auto max-w-6xl px-0 pb-16 pt-28 sm:px-6 lg:px-8 w-full min-w-0 overflow-x-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <div className="space-y-6">
        <div className="rounded-3xl sm:rounded-4xl border border-slate-200 bg-slate-50 p-4 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-500">{translations[locale].welcome}</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                {form.full_name || (isRtl ? "مستخدم مدورا" : "Medaura User")}
              </h1>
              <p className="mt-2 text-slate-600 max-w-2xl">
                {translations[locale].summaryDesc}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {translations[locale].visits}
                </p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">
                  {bookingCount}
                </p>
              </div>
              <div className="rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {translations[locale].prescriptions}
                </p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">
                  {prescriptionCount}
                </p>
              </div>
              <div className="rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {translations[locale].lastUpdate}
                </p>
                <p className="mt-4 text-xl font-semibold text-slate-900">
                  {profileUser?.updated_at
                    ? new Date(profileUser.updated_at).toLocaleDateString(
                        isRtl ? "ar-EG" : "en-US",
                      )
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_1fr] w-full min-w-0">
          <aside className="space-y-5 w-full min-w-0">
            <div className="rounded-3xl sm:rounded-4xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm w-full min-w-0 overflow-hidden">
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={form.full_name || "Patient"}
                    className="h-16 w-16 rounded-3xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#001A6E] text-white text-2xl font-semibold">
                    {form.full_name ? form.full_name.charAt(0) : (isRtl ? "م" : "M")}
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-500">{translations[locale].patientName}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">
                    {form.full_name || translations[locale].notAvailable}
                  </h2>
                </div>
              </div>
              <div className="mt-6 space-y-3 text-slate-600">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {translations[locale].email}
                  </p>
                  <p className="mt-2 text-sm text-slate-900 break-all">
                    {form.email || translations[locale].notAvailable}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {translations[locale].phone}
                  </p>
                  <p className="mt-2 text-sm text-slate-900">
                    {form.phone || translations[locale].notAvailable}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {translations[locale].dob}
                  </p>
                  <p className="mt-2 text-sm text-slate-900">
                    {formatDateOnly(form.date_of_birth) || translations[locale].notAvailable}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {translations[locale].gender}
                  </p>
                  <p className="mt-2 text-sm text-slate-900">
                    {form.gender === "male"
                      ? translations[locale].genderMale
                      : form.gender === "female"
                        ? translations[locale].genderFemale
                        : (form.gender || translations[locale].notAvailable)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl sm:rounded-4xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm w-full min-w-0 overflow-hidden">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {translations[locale].quickMenu}
              </h3>
              <nav className="flex flex-row overflow-x-auto gap-2 xl:flex-col pb-2 xl:pb-0 scrollbar-none w-full">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      const element = document.getElementById(item.id);
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className={`whitespace-nowrap rounded-2xl px-4 py-3 text-start transition ${
                      activeSection === item.id
                        ? "bg-[#001A6E] text-white"
                        : "text-slate-700 hover:bg-slate-100 bg-slate-50 xl:bg-transparent"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <main className="space-y-6 w-full min-w-0">
            <section
              id="profile"
              className="rounded-3xl sm:rounded-4xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm w-full min-w-0 overflow-hidden"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{translations[locale].updateProfile}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    {translations[locale].profileSubtitle}
                  </h2>
                </div>
                <div className="inline-flex gap-3">
                  <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {bookingCount} {translations[locale].visits}
                  </div>
                  <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {prescriptionCount} {translations[locale].prescriptions}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {translations[locale].profilePhoto}
                  </label>
                  <div className="flex flex-col gap-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt={form.full_name || "Patient"}
                          className="h-16 w-16 rounded-2xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 text-xs">
                          {translations[locale].noPhoto}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {translations[locale].chooseNewPhoto}
                        </p>
                        <p className="text-xs text-slate-500">
                          {translations[locale].photoRequirements}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <label className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100">
                        {translations[locale].changePhoto}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handlePhotoUpload}
                        disabled={!photoFile || photoState === "uploading"}
                        className="inline-flex items-center justify-center rounded-3xl bg-[#001A6E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#00307e] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {photoState === "uploading"
                          ? translations[locale].savingPhoto
                          : translations[locale].savePhoto}
                      </button>
                    </div>
                  </div>
                  {photoError && (
                    <p className="mt-3 text-sm text-red-700">{photoError}</p>
                  )}
                  {photoState === "success" && (
                    <p className="mt-3 text-sm text-emerald-700">
                      {translations[locale].photoSuccess}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {translations[locale].fullNameLabel}
                  </label>
                  <input
                    value={form.full_name}
                    onChange={(e) =>
                      handleFieldChange("full_name", e.target.value)
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#001A6E] focus:ring-2 focus:ring-[#001A6E]/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {translations[locale].phone}
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    placeholder={translations[locale].phonePlaceholder}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#001A6E] focus:ring-2 focus:ring-[#001A6E]/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {translations[locale].dob}
                  </label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) =>
                      handleFieldChange("date_of_birth", e.target.value)
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#001A6E] focus:ring-2 focus:ring-[#001A6E]/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {translations[locale].gender}
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      handleFieldChange("gender", e.target.value)
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#001A6E] focus:ring-2 focus:ring-[#001A6E]/10"
                  >
                    <option value="">{translations[locale].genderUnspecified}</option>
                    <option value="male">{translations[locale].genderMale}</option>
                    <option value="female">{translations[locale].genderFemale}</option>
                  </select>
                </div>
              </div>

              {formError && (
                <p className="mt-4 text-sm text-red-700">{formError}</p>
              )}
              {saveState === "success" && (
                <p className="mt-4 text-sm text-emerald-700">
                  {translations[locale].changesSuccess}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveState === "saving"}
                  className="inline-flex items-center justify-center rounded-3xl bg-[#001A6E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#00307e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveState === "saving" ? translations[locale].savingChanges : translations[locale].saveChanges}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      full_name: profileUser?.profile?.full_name || "",
                      email: profileUser?.email || "",
                      phone: profileUser?.profile?.phone || "",
                      date_of_birth: formatDateOnly(
                        profileUser?.profile?.date_of_birth || "",
                      ),
                      gender: profileUser?.profile?.gender || "",
                    })
                  }
                  className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {translations[locale].reset}
                </button>
              </div>
            </section>

            <section
              className="rounded-3xl sm:rounded-4xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <p className="text-sm text-slate-500">{translations[locale].changePasswordTitle}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {translations[locale].changePasswordSubtitle}
                </h2>
              </div>

              <form onSubmit={handleChangePassword} className="mt-6 space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {translations[locale].currentPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={translations[locale].currentPasswordLabel}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 pl-12 pr-4 rtl:pr-12 rtl:pl-4 py-3 text-slate-900 outline-none transition focus:border-[#001A6E] focus:ring-2 focus:ring-[#001A6E]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-4 text-slate-400 hover:text-[#001A6E] cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {translations[locale].newPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={translations[locale].newPasswordLabel}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 pl-12 pr-4 rtl:pr-12 rtl:pl-4 py-3 text-slate-900 outline-none transition focus:border-[#001A6E] focus:ring-2 focus:ring-[#001A6E]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-4 text-slate-400 hover:text-[#001A6E] cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {translations[locale].confirmPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={translations[locale].confirmPasswordLabel}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 pl-12 pr-4 rtl:pr-12 rtl:pl-4 py-3 text-slate-900 outline-none transition focus:border-[#001A6E] focus:ring-2 focus:ring-[#001A6E]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-4 text-slate-400 hover:text-[#001A6E] cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-start">
                  <button
                    type="submit"
                    disabled={passwordUpdating}
                    className="inline-flex items-center justify-center gap-2 rounded-3xl bg-[#001A6E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#00307e] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {passwordUpdating ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock size={16} />
                        {translations[locale].updatePasswordBtn}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            <section
              id="history"
              className="rounded-3xl sm:rounded-4xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{translations[locale].historyTitle}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    {translations[locale].historySubtitle}
                  </h2>
                </div>
                <p className="text-sm text-slate-500">
                  {translations[locale].historyCount.replace("{count}", bookingCount.toString())}
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {bookingsApi.loading ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
                    {translations[locale].loadingHistory}
                  </div>
                ) : localBookings.length ? (
                  localBookings.map((booking, index) => {
                    const bookingId =
                      booking.booking_id ||
                      (booking as unknown as Record<string, number>).booking_id;
                    const doctorName =
                      booking.doctor_name ||
                      booking.staff_name ||
                      (booking.doctor_id
                        ? `Doctor #${booking.doctor_id}`
                        : booking.staff_id
                          ? `Staff #${booking.staff_id}`
                          : "—");
                    const bookingDate = formatDateOnly(booking.booking_date);
                    const accessStatus = booking.prescription_access_status;
                    const isPending = accessStatus === "pending";

                    return (
                      <div
                        key={`${booking.id ?? booking.booking_id ?? "booking"}-${booking.booking_date ?? ""}-${index}`}
                        className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-3"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-sm text-slate-500">{translations[locale].doctor}</p>
                              <p className="mt-1 text-base font-semibold text-slate-900">
                                {doctorName}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-slate-600 ltr:text-left rtl:text-right sm:ltr:text-right sm:rtl:text-left">
                            <p className="mt-1 text-base font-semibold text-slate-900">
                              {bookingDate || "—"}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {translations[locale].time}: {booking.booking_from}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white uppercase tracking-[0.12em]">
                            {booking.status}
                          </span>
                        </div>

                        {/* Prescription access request banner */}
                        {isPending && bookingId && (
                          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                            <div className="flex items-start gap-3 flex-col sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-2 text-amber-800">
                                <Clock size={16} className="shrink-0" />
                                <p className="text-sm font-medium">
                                  {translations[locale].pendingAccess}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRespondAccess(bookingId, "accept")}
                                  disabled={accessRespondLoading === bookingId}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-60"
                                >
                                  <CheckCircle size={13} />
                                  {translations[locale].accept}
                                </button>
                                <button
                                  onClick={() => handleRespondAccess(bookingId, "reject")}
                                  disabled={accessRespondLoading === bookingId}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition disabled:opacity-60"
                                >
                                  <XCircle size={13} />
                                  {translations[locale].reject}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {accessStatus === "accepted" && bookingId && (
                          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl p-4 mt-2">
                            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                              <CheckCircle size={16} className="shrink-0" />
                              <span>{translations[locale].acceptedAccess}</span>
                            </div>
                            <button
                              onClick={() => handleRespondAccess(bookingId, "reject")}
                              disabled={accessRespondLoading === bookingId}
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition disabled:opacity-60"
                            >
                              {translations[locale].revokeAccess}
                            </button>
                          </div>
                        )}

                        {accessStatus === "rejected" && bookingId && (
                          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-2xl p-4 mt-2">
                            <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                              <XCircle size={16} className="shrink-0" />
                              <span>{translations[locale].rejectedAccess}</span>
                            </div>
                            <button
                              onClick={() => handleRespondAccess(bookingId, "accept")}
                              disabled={accessRespondLoading === bookingId}
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-60"
                            >
                              {translations[locale].allowAccess}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
                    {translations[locale].noHistory}
                  </div>
                )}
              </div>
            </section>

            <section
              id="prescriptions"
              className="rounded-3xl sm:rounded-4xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{translations[locale].prescriptionsTitle}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    {translations[locale].prescriptionsSubtitle}
                  </h2>
                </div>
                <p className="text-sm text-slate-500">
                  {translations[locale].prescriptionsCount.replace("{count}", prescriptionCount.toString())}
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {prescriptionsApi.loading ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
                    {translations[locale].loadingPrescriptions}
                  </div>
                ) : prescriptions.length ? (
                  prescriptions.map((prescription, index) => (
                    <div
                      key={`${prescription.prescription_id ?? prescription.id ?? "rx"}-${index}`}
                      className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-3 cursor-pointer hover:border-[#001A6E]/30 transition"
                      onClick={() => setSelectedPrescription(prescription)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          {prescription.created_at?.split("T")[0] || translations[locale].noDate}
                        </span>
                        <span className="font-bold text-slate-900">
                          {translations[locale].prescriptionNumber.replace("{id}", (prescription.prescription_id || prescription.id || 0).toString())}
                        </span>
                      </div>

                      {prescription.provider_name && (
                        <p className="text-sm text-slate-600">
                          {translations[locale].doctor}: <span className="font-medium text-slate-900">{prescription.provider_name}</span>
                        </p>
                      )}

                      {prescription.diagnosis && (
                        <div className="rounded-2xl bg-blue-50 px-4 py-2.5">
                          <p className="text-xs font-semibold text-blue-600 flex items-center gap-1 mb-1">
                            <Stethoscope size={12} /> {translations[locale].diagnosis}
                          </p>
                          <p className="text-sm text-blue-900 ltr:text-left rtl:text-right">{prescription.diagnosis}</p>
                        </div>
                      )}
                      {prescription.medication_name && (
                        <div className="rounded-2xl bg-green-50 px-4 py-2.5">
                          <p className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-1">
                            <Pill size={12} /> {translations[locale].medication}
                          </p>
                          <p className="text-sm text-green-900 ltr:text-left rtl:text-right">
                            {prescription.medication_name}
                            {prescription.dose && <span className="text-green-600"> — {prescription.dose}</span>}
                            {prescription.duration && <span className="text-green-600"> — {translations[locale].forDuration.replace("{duration}", prescription.duration)}</span>}
                          </p>
                        </div>
                      )}
                      {prescription.test_name && (
                        <div className="rounded-2xl bg-purple-50 px-4 py-2.5">
                          <p className="text-xs font-semibold text-purple-700 flex items-center gap-1 mb-1">
                            <FlaskConical size={12} /> {translations[locale].tests}
                          </p>
                          <p className="text-sm text-purple-900 ltr:text-left rtl:text-right">
                            {prescription.test_name}
                            {prescription.test_result && <span className="text-purple-600"> — {prescription.test_result}</span>}
                          </p>
                        </div>
                      )}
                      {prescription.notes && (
                        <div className="rounded-2xl bg-amber-50 px-4 py-2.5">
                          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-1">
                            <StickyNote size={12} /> {translations[locale].notes}
                          </p>
                          <p className="text-sm text-amber-900 ltr:text-left rtl:text-right">{prescription.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
                    {translations[locale].noPrescriptions}
                  </div>
                )}
              </div>
            </section>

            <section
              id="followup"
              className="rounded-3xl sm:rounded-4xl border border-slate-200 bg-slate-50 p-4 sm:p-6 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{translations[locale].followupTitle}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    {translations[locale].followupSubtitle}
                  </h2>
                </div>
                <p className="text-sm text-slate-500">
                  {translations[locale].followupDesc}
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">
                    {translations[locale].recommendationsTitle}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {translations[locale].recommendationsText}
                  </p>
                </div>
                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">
                    {translations[locale].tipsTitle}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {translations[locale].tipsText}
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>

    {/* Prescription Detail Modal */}
    {selectedPrescription && (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={() => setSelectedPrescription(null)}
      >
        <div
          className="bg-white rounded-4xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4"
          dir={isRtl ? "rtl" : "ltr"}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedPrescription(null)}
              className="p-2 rounded-2xl hover:bg-slate-100 transition"
            >
              ✕
            </button>
            <div className="ltr:text-left rtl:text-right">
              <p className="text-sm text-slate-500">{translations[locale].prescriptionDetails}</p>
              <h3 className="font-bold text-xl text-slate-900">
                {translations[locale].prescriptionNumber.replace("{id}", (selectedPrescription.prescription_id || selectedPrescription.id || 0).toString())}
              </h3>
            </div>
          </div>

          <div className="border-t border-slate-200" />

          <div className="space-y-3">
            {selectedPrescription.provider_name && (
              <div className="ltr:text-left rtl:text-right">
                <p className="text-xs text-slate-500">{translations[locale].doctor}</p>
                <p className="font-semibold text-slate-900">{selectedPrescription.provider_name}</p>
                {selectedPrescription.provider_specialty && (
                  <p className="text-sm text-slate-500">{selectedPrescription.provider_specialty}</p>
                )}
              </div>
            )}
            <p className="text-xs text-slate-400 ltr:text-left rtl:text-right">
              {selectedPrescription.created_at?.split("T")[0]}
            </p>

            {selectedPrescription.symptoms && (
              <div className="rounded-3xl bg-slate-50 p-4 ltr:text-left rtl:text-right">
                <p className="text-xs font-semibold text-slate-600 mb-1">{translations[locale].symptoms}</p>
                <p className="text-sm text-slate-900">{selectedPrescription.symptoms}</p>
              </div>
            )}
            {selectedPrescription.diagnosis && (
              <div className="rounded-3xl bg-blue-50 p-4 ltr:text-left rtl:text-right">
                <p className="text-xs font-semibold text-blue-600 mb-1">{translations[locale].diagnosis}</p>
                <p className="text-sm text-blue-900">{selectedPrescription.diagnosis}</p>
              </div>
            )}
            {selectedPrescription.medication_name && (
              <div className="rounded-3xl bg-green-50 p-4 ltr:text-left rtl:text-right">
                <p className="text-xs font-semibold text-green-700 mb-1">{translations[locale].medication}</p>
                <p className="text-sm text-green-900">
                  {selectedPrescription.medication_name}
                  {selectedPrescription.dose && <span className="text-green-600"> — {selectedPrescription.dose}</span>}
                  {selectedPrescription.duration && <span className="text-green-600"> — {translations[locale].forDuration.replace("{duration}", selectedPrescription.duration)}</span>}
                </p>
              </div>
            )}
            {selectedPrescription.test_name && (
              <div className="rounded-3xl bg-purple-50 p-4 ltr:text-left rtl:text-right">
                <p className="text-xs font-semibold text-purple-700 mb-1">{translations[locale].tests}</p>
                <p className="text-sm text-purple-900">
                  {selectedPrescription.test_name}
                  {selectedPrescription.test_result && <span className="text-purple-600"> — {selectedPrescription.test_result}</span>}
                </p>
              </div>
            )}
            {selectedPrescription.notes && (
              <div className="rounded-3xl bg-amber-50 p-4 ltr:text-left rtl:text-right">
                <p className="text-xs font-semibold text-amber-700 mb-1">{translations[locale].notes}</p>
                <p className="text-sm text-amber-900">{selectedPrescription.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
