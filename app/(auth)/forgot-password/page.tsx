"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { validateEmail } from "../validators";
import { ErrorAlert, EmailInput } from "../components";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function validate() {
    const e: Record<string, string> = {};
    const emailError = validateEmail(email);
    if (emailError) e.email = emailError;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "تعذر إرسال رمز إعادة التعيين");
      }

      router.push(`/verify-reset-otp?email=${encodeURIComponent(email)}`);
      return;
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "تعذر إرسال رمز إعادة التعيين",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-indigo-900 mb-2">
        نسيت كلمة المرور
      </h2>
      <p className="text-zinc-600 mb-6 text-sm">
        لا تقلق، سنرسل لك تعليمات لاعادة الضبط
      </p>

      <ErrorAlert errors={errors} />

      <EmailInput
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <button
        type="submit"
        className="w-full bg-indigo-900 text-white py-2 sm:py-2.5 rounded-md text-sm sm:text-base transition-all duration-300 hover:bg-indigo-800 hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={loading}
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
