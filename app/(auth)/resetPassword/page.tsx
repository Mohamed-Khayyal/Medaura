"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  validatePassword,
  validateConfirmPassword,
} from "../validators";
import { ErrorAlert, PasswordInput } from "../components";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const isTokenMissing = !token;

  function validate() {
    const e: Record<string, string> = {};
    if (!token) {
      e.form = "رابط إعادة التعيين غير صالح، يرجى طلب رمز جديد";
    }
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirm);
    if (passwordError) e.password = passwordError;
    if (confirmError) e.confirm = confirmError;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/auth/reset-password/${encodeURIComponent(token)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, confirmPassword: confirm }),
          credentials: "include",
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "تعذر إعادة تعيين كلمة المرور");
      }

      setSubmitted(true);
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "تعذر إعادة تعيين كلمة المرور",
      });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-indigo-900">
          تم تعيين كلمة المرور!
        </h2>
        <p className="text-zinc-600">تم تعيين كلمة المرور الجديدة بنجاح</p>
        <Link
          href="/login"
          className="inline-block w-full bg-indigo-900 text-white py-2 sm:py-2.5 rounded-md text-sm sm:text-base transition-all duration-300 hover:bg-indigo-800 hover:shadow-lg active:scale-95"
        >
          الذهاب إلى تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-indigo-900 mb-2">
        إعادة تعيين كلمة المرور
      </h2>
      <p className="text-zinc-600 mb-6 text-sm">
        يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمات المرور التي استخدمتها
        سابقاً
      </p>

      {isTokenMissing && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          رابط إعادة التعيين غير صالح أو منتهي الصلاحية.
          <Link
            href="/forgot-password"
            className="ml-1 text-indigo-700 hover:text-indigo-900 transition"
          >
            طلب رمز جديد
          </Link>
        </div>
      )}

      <ErrorAlert errors={errors} />

      <PasswordInput
        label="كلمة المرور"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        showPassword={showPassword}
        onToggle={() => setShowPassword(!showPassword)}
        placeholder="كلمة المرور الجديدة"
        error={errors.password}
        id="password"
      />

      <PasswordInput
        label="تأكيد كلمة المرور"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        showPassword={showConfirm}
        onToggle={() => setShowConfirm(!showConfirm)}
        placeholder="تأكيد كلمة المرور الجديدة"
        error={errors.confirm}
        id="confirm"
      />

      <button
        type="submit"
        className="w-full bg-indigo-900 text-white py-2 sm:py-2.5 rounded-md text-sm sm:text-base transition-all duration-300 hover:bg-indigo-800 hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={loading || isTokenMissing}
        aria-busy={loading}
      >
        {loading ? "جاري الإرسال..." : "إرسال"}
      </button>

      <div className="text-center mt-4">
        <Link
          href="/login"
          className="text-sm text-indigo-700 hover:text-indigo-900 transition"
        >
          العودة إلى تسجيل الدخول
        </Link>
      </div>
    </form>
  );
}
