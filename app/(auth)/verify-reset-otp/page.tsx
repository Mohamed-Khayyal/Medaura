"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { validateEmail } from "../validators";
import { EmailInput, ErrorAlert } from "../components";

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 45;

function createEmptyOtp() {
  return Array.from({ length: OTP_LENGTH }, () => "");
}

function unwrapPayload(payload: unknown): any {
  if (payload && typeof payload === "object" && "data" in payload) {
    return unwrapPayload((payload as { data?: unknown }).data);
  }

  return payload;
}

function extractResetToken(payload: unknown): string | undefined {
  const unwrapped = unwrapPayload(payload);

  if (typeof unwrapped === "string") {
    return unwrapped;
  }

  if (!unwrapped || typeof unwrapped !== "object") {
    return undefined;
  }

  const data = unwrapped as {
    resetToken?: string;
    reset_token?: string;
    token?: string;
  };

  return data.resetToken || data.reset_token || data.token;
}

export default function VerifyResetOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState<string[]>(createEmptyOtp());
  const [timeLeft, setTimeLeft] = useState(OTP_TTL_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  function handleOtpChange(index: number, value: string) {
    const digits = value.replace(/\D/g, "");

    if (!digits) {
      setOtp((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    setOtp((prev) => {
      const next = [...prev];
      const chars = digits.split("");

      for (
        let offset = 0;
        offset < chars.length && index + offset < OTP_LENGTH;
        offset += 1
      ) {
        next[index + offset] = chars[offset];
      }

      return next;
    });

    const nextIndex = index + digits.length;
    if (nextIndex < OTP_LENGTH) {
      inputRefs.current[nextIndex]?.focus();
    }
  }

  function handleOtpPaste(
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number
  ) {
    const pasted = e.clipboardData.getData("text");
    const digits = pasted.replace(/\D/g, "");

    if (!digits) {
      return;
    }

    e.preventDefault();
    handleOtpChange(index, digits);
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function validate() {
    const e: Record<string, string> = {};
    const emailError = validateEmail(email);
    if (emailError) e.email = emailError;
    if (otp.some((digit) => !digit)) {
      e.otp = "يرجى إدخال رمز التحقق الكامل";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.join("") }),
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "تعذر التحقق من الرمز");
      }

      const resetToken = extractResetToken(result.data);
      if (!resetToken) {
        throw new Error("تعذر الحصول على رمز إعادة التعيين");
      }

      router.push(`/resetPassword?token=${encodeURIComponent(resetToken)}`);
    } catch (error) {
      setErrors({
        form:
          error instanceof Error ? error.message : "تعذر التحقق من الرمز",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setResending(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "تعذر إعادة إرسال الرمز");
      }

      setTimeLeft(OTP_TTL_SECONDS);
      setOtp(createEmptyOtp());
    } catch (error) {
      setErrors({
        form:
          error instanceof Error ? error.message : "تعذر إعادة إرسال الرمز",
      });
    } finally {
      setResending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-indigo-900 mb-2">
        التحقق من رمز إعادة التعيين
      </h2>
      <p className="text-sm text-zinc-600 mb-4">
        أرسلنا الرمز إلى بريدك الإلكتروني لإكمال إعادة تعيين كلمة المرور
      </p>

      <ErrorAlert errors={errors} />

      <EmailInput
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <div className="flex gap-2 justify-center my-6" dir="ltr">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handleOtpPaste(e, index)}
            maxLength={1}
            className="w-12 h-12 text-center border-2 border-indigo-300 rounded-lg text-2xl font-bold focus:outline-none focus:border-indigo-700 focus:ring-2 focus:ring-indigo-200"
            inputMode="numeric"
            autoComplete="one-time-code"
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-red-600 font-medium">
          {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
          {String(timeLeft % 60).padStart(2, "0")}
        </span>
        {timeLeft === 0 ? (
          <button
            type="button"
            onClick={handleResend}
            className="text-indigo-700 hover:text-indigo-900 font-medium transition disabled:opacity-60"
            disabled={resending}
          >
            {resending ? "جارٍ الإرسال..." : "إعادة إرسال الرمز"}
          </button>
        ) : (
          <span className="text-zinc-600">لم يتم استلام الرمز؟</span>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-900 text-white py-2 sm:py-2.5 rounded-md text-sm sm:text-base transition-all duration-300 hover:bg-indigo-800 hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "جاري التحقق..." : "تحقق وتابع"}
      </button>

      <div className="text-center mt-4">
        <Link
          href="/forgot-password"
          className="text-sm text-indigo-700 hover:text-indigo-900 transition"
        >
          العودة لطلب رمز جديد
        </Link>
      </div>
    </form>
  );
}
