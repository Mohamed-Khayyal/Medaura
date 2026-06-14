"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { SuccessMessage } from "../components";

function UploadCard({
  title,
  hint,
  file,
  onChange,
  accept = ".pdf,.png,.jpg,.jpeg",
  required = false,
  compact = false,
}: {
  title: string;
  hint?: string;
  file: File | null;
  onChange: (f: File | null) => void;
  accept?: string;
  required?: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    onChange(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    onChange(f);
  }

  function onClickChoose() {
    inputRef.current?.click();
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`w-full ${compact ? "sm:w-44 p-3" : "p-4"} rounded-lg border-2 border-dashed border-zinc-200 bg-white hover:shadow-lg transition-shadow duration-200`}
    >
      <label className="flex items-start gap-2">
        <span className="text-sm font-medium text-zinc-700">{title}</span>
        {required && <span className="text-red-500">*</span>}
      </label>

      <div className={`${compact ? "mt-2 p-2" : "mt-3 p-4"} text-center`}>
        <div className="flex flex-col items-center gap-3">
          <div
            className={`${compact ? "h-10 w-10" : "h-14 w-14"} bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center shadow-sm`}
          >
            <svg
              className={`${compact ? "w-5 h-5" : "w-7 h-7"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M12 16V8"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 12l4-4 4 4"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="text-sm text-zinc-600">
            {hint ?? "اسحب وافلت الملف هنا"}
          </div>
          <div className="text-xs text-zinc-400">
            أو{" "}
            <button
              type="button"
              onClick={onClickChoose}
              className="text-indigo-700 underline"
            >
              اختر من جهازك
            </button>
          </div>

          <div className="text-xs text-zinc-400">
            الملفات المقبولة: <span className="text-rose-600">PDF</span>, JPG,
            PNG
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFile}
            aria-hidden
          />

          {file ? (
            <div className="mt-3 text-sm text-zinc-700 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-zinc-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 2v6h6"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={`truncate ${compact ? "max-w-32" : "max-w-40"}`}>
                {file.name}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function DoctorDocumentPage() {
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [otherDocsFile, setOtherDocsFile] = useState<File | null>(null);

  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseAuthority, setLicenseAuthority] = useState("");
  const [licenseDate, setLicenseDate] = useState("");

  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!licenseFile) e.licenseFile = "الرجاء رفع صورة/ملف الرخصة الطبية";
    if (!licenseNumber.trim()) e.licenseNumber = "رقم الرخصة مطلوب";
    if (!licenseAuthority.trim()) e.licenseAuthority = "جهة الإصدار مطلوبة";
    if (!licenseDate.trim()) e.licenseDate = "تاريخ الإصدار مطلوب";
    if (!agree) e.agree = "يجب الموافقة على شروط رفع المستندات";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <SuccessMessage
          title="تم إرسال المستندات للمراجعة"
          description="سنراجع المستندات وسيتم التواصل معك حال الموافقة أو لطلب مزيد من المعلومات."
          buttonLabel="العودة"
          onAction={() => setSubmitted(false)}
        />
      </div>
    );
  }

  return (
    <div dir="rtl" className="max-w-4xl mx-auto py-10 px-4 text-right">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="relative h-10 w-10 shrink-0">
            <Image
              src="/images/Logo1.png"
              alt="Medaura logo"
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>
          <div className="text-indigo-900 font-bold tracking-wide text-2xl">Medaura</div>
        </div>
        <h1 className="text-lg sm:text-2xl font-semibold text-zinc-900">
          رفع المستندات للتحقق من هويتك المهنية
        </h1>
        <p className="text-sm text-zinc-500 mt-2">
          يرجى رفع المستندات التالية للتأكد من هويتك ومؤهلاتك
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UploadCard
            title="الهوية الوطنية"
            hint="اسحب وافلت الملف هنا"
            file={nationalIdFile}
            onChange={setNationalIdFile}
            accept=".pdf,.png,.jpg,.jpeg"
          />

          <div className="p-4 rounded-lg border border-zinc-200 bg-white shadow-sm md:col-span-2">
            <label className="flex items-start gap-2">
              <span className="text-sm font-medium text-zinc-700">
                الرخصة الطبية
              </span>
              <span className="text-red-500">*</span>
            </label>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div className="sm:col-span-1 sm:w-44">
                <UploadCard
                  title="ارفق الرخصة هنا"
                  hint="اسحب وافلت الملف هنا"
                  file={licenseFile}
                  onChange={setLicenseFile}
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  compact
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  رقم الرخصة
                </label>
                <input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 mb-3 ${errors.licenseNumber ? "border-red-300" : "border-zinc-200"}`}
                  placeholder="رقم الرخصة"
                />

                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  جهة الاصدار
                </label>
                <input
                  value={licenseAuthority}
                  onChange={(e) => setLicenseAuthority(e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 mb-3 ${errors.licenseAuthority ? "border-red-300" : "border-zinc-200"}`}
                  placeholder="الجهة التي أصدرت الترخيص"
                />

                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  تاريخ الإصدار
                </label>
                <input
                  type="date"
                  value={licenseDate}
                  onChange={(e) => setLicenseDate(e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 ${errors.licenseDate ? "border-red-300" : "border-zinc-200"}`}
                />

                {errors.licenseFile && (
                  <p className="text-sm text-red-700 mt-2">
                    {errors.licenseFile}
                  </p>
                )}
                {errors.licenseNumber && (
                  <p className="text-sm text-red-700 mt-2">
                    {errors.licenseNumber}
                  </p>
                )}
                {errors.licenseAuthority && (
                  <p className="text-sm text-red-700 mt-2">
                    {errors.licenseAuthority}
                  </p>
                )}
                {errors.licenseDate && (
                  <p className="text-sm text-red-700 mt-2">
                    {errors.licenseDate}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-zinc-200 bg-white shadow-sm">
          <label className="flex items-start gap-2">
            <span className="text-sm font-medium text-zinc-700">
              الشهادات والمؤهلات
            </span>
            <span className="text-zinc-400 text-xs">
              (اختياري - يمكن رفع ملفات متعددة لاحقًا)
            </span>
          </label>

          <div className="mt-3">
            <UploadCard
              title="اسحب وافلت الملف هنا"
              hint="اسحب وافلت الملف هنا"
              file={otherDocsFile}
              onChange={setOtherDocsFile}
              accept=".pdf,.png,.jpg,.jpeg"
            />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-zinc-200 bg-white shadow-sm flex gap-4 items-start">
          <div className="flex-1">
            <div className="bg-zinc-50 border border-zinc-100 rounded-md p-4">
              <h3 className="text-sm font-semibold text-zinc-800">
                ملاحظات هامة:
              </h3>

              <ul className="mt-2 space-y-2 text-sm text-zinc-600">
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-600 mt-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>تأكد من وضوح جميع المستندات المرفوعة</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-600 mt-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>يجب أن تكون الرخصة سارية المفعول</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-600 mt-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>سيتم مراجعة المستندات خلال 1-3 أيام عمل</span>
                </li>
              </ul>

              <label className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  className="accent-indigo-700"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                بالموافقة على شروط رفع المستندات أقر بأن جميع المستندات صحيحة
              </label>
              {errors.agree && (
                <p className="text-sm text-red-700 mt-2">{errors.agree}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            className="px-4 py-2 border border-zinc-200 rounded-md text-zinc-700"
          >
            رجوع
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-900 text-white rounded-md transition hover:bg-indigo-800 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "جاري الإرسال..." : "إرسال للمراجعة"}
          </button>
        </div>
      </form>
    </div>
  );
}
