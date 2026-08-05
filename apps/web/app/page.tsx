"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-center text-gray-800">
          AGNOS
        </h1>
        <p className="mb-8 text-center text-gray-500">
          เลือกบทบาทของคุณเพื่อเริ่มต้น
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/patient")}
            className="w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 active:scale-95"
          >
            👤 ผู้ป่วย (Patient)
          </button>

          <button
            onClick={() => router.push("/staff")}
            className="w-full rounded-xl bg-emerald-600 py-4 text-lg font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
          >
            🏥 เจ้าหน้าที่ (Staff)
          </button>
        </div>
      </div>
    </div>
  );
}