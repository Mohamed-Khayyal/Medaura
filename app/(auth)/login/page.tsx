"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDashboardPathByUserType } from "@/lib/utils/redirect";
import { validateEmail, validatePassword } from "../validators";
import { ErrorAlert, PasswordInput, EmailInput } from "../components";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError) e.email = emailError;
    if (passwordError) e.password = passwordError;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await login({ email, password });
      // Redirect based on user type/role
      const redirectPath = getDashboardPathByUserType(response.user_type);
      router.push(redirectPath);
    } catch (error) {
      let errorMessage = "تعذر تسجيل الدخول، حاول مرة أخرى";
      if (error instanceof Error) {
        const status = (error as any).status;
        if (
          status === 429 ||
          error.message.includes("Too many") ||
          error.message.includes("rate limit") ||
          error.message.includes("too many requests")
        ) {
          errorMessage = "محاولات تسجيل دخول كثيرة جداً. يرجى المحاولة لاحقاً";
        } else if (
          status === 401 ||
          error.message.includes("Incorrect email or password") ||
          error.message.includes("invalid") ||
          error.message.includes("unauthorized")
        ) {
          errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrors({
        form: errorMessage,
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
          تم تسجيل الدخول!
        </h2>
        <p className="text-zinc-600">تم دخولك بنجاح (محلي فقط).</p>
        <button
          onClick={() => {
            setSubmitted(false);
            setEmail("");
            setPassword("");
            setErrors({});
            setShowPassword(false);
          }}
          className="inline-block w-full bg-indigo-700 text-white py-2 rounded transition hover:bg-indigo-600 active:scale-95"
        >
          تسجيل دخول آخر
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <ErrorAlert errors={errors} />

      <EmailInput
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <PasswordInput
        label="كلمة المرور"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        showPassword={showPassword}
        onToggle={() => setShowPassword(!showPassword)}
        placeholder="كلمة المرور"
        error={errors.password}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="accent-indigo-700"
          />
          حفظ تسجيل الدخول
        </label>
        <Link
          href="/forgot-password"
          className="text-sm text-indigo-700 hover:text-indigo-900 transition"
        >
          نسيت كلمة المرور؟
        </Link>
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-900 text-white py-2 sm:py-2.5 rounded-md text-sm sm:text-base transition-all duration-300 hover:bg-indigo-800 hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
      </button>

      <p className="text-center text-sm text-zinc-600 mt-4">
        ليس لديك حساب بعد؟{" "}
        <Link
          href="/register"
          className="text-indigo-700 font-medium hover:text-indigo-900 transition"
        >
          سجل الآن
        </Link>
      </p>
    </form>
  );
}
