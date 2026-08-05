"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { getSocket } from "@/lib/socket";

type FormData = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  email: string;
  preferredLanguage: string;
  nationality: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  religion: string;
};

export default function PatientPage() {
  const router = useRouter();
  const [sessionId] = useState(() => uuidv4());
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    email: "",
    preferredLanguage: "",
    nationality: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    religion: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const inactiveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ ใช้ useRef เก็บ socket เพื่อป้องกันการ disconnect
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  // ✅ useEffect สำหรับเชื่อมต่อ socket
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    console.log("📡 [PATIENT] Joining with session:", sessionId);
    socket.emit("patient:join", sessionId);

    // ✅ ไม่ต้อง disconnect ใน cleanup
    return () => {
      console.log("📡 [PATIENT] Component unmounting, keeping socket alive");
    };
  }, [sessionId]);

  // useEffect สำหรับส่งข้อมูล
  useEffect(() => {
    if (isSubmitted || !socketRef.current) return;

    console.log("📡 [PATIENT] Sending formUpdate:", { sessionId, formData });
    socketRef.current.emit("patient:formUpdate", {
      sessionId,
      formData,
    });

    if (inactiveTimerRef.current) {
      clearTimeout(inactiveTimerRef.current);
    }

    const timer = setTimeout(() => {
      console.log("📡 [PATIENT] Sending inactive for session:", sessionId);
      socketRef.current?.emit("patient:inactive", sessionId);
    }, 5000);

    inactiveTimerRef.current = timer;

    return () => {
      if (inactiveTimerRef.current) {
        clearTimeout(inactiveTimerRef.current);
      }
    };
  }, [formData, isSubmitted, sessionId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "กรุณากรอกชื่อจริง";
    if (!formData.lastName.trim()) newErrors.lastName = "กรุณากรอกนามสกุล";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "กรุณาเลือกวันเกิด";
    if (!formData.gender) newErrors.gender = "กรุณาเลือกเพศ";
    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = "กรุณากรอกเบอร์โทรศัพท์";
    if (!formData.email.trim()) newErrors.email = "กรุณากรอกอีเมล";
    if (!formData.preferredLanguage)
      newErrors.preferredLanguage = "กรุณาเลือกภาษาที่ต้องการ";
    if (!formData.nationality.trim())
      newErrors.nationality = "กรุณากรอกสัญชาติ";

    const phoneRegex = /^[0-9]{10}$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    socketRef.current?.emit("patient:submit", {
      sessionId,
      formData,
    });

    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            ✅
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            ส่งข้อมูลสำเร็จ!
          </h2>
          <p className="mt-2 text-gray-500">
            ขอบคุณที่กรอกข้อมูล เจ้าหน้าที่จะติดต่อท่านกลับ
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 w-full rounded-xl bg-gray-600 py-3 font-semibold text-white transition hover:bg-gray-700"
          >
            กลับหน้าแรก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            📋 ลงทะเบียนผู้ป่วย
          </h1>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg px-4 py-2 text-sm text-gray-500 transition hover:bg-gray-200"
          >
            ⬅ กลับ
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-lg"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* First Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ชื่อจริง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="เช่น สมชาย"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>

            {/* Middle Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ชื่อกลาง
              </label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="(ไม่บังคับ)"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="เช่น ใจดี"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                วันเกิด <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.dateOfBirth}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                เพศ <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">เลือกเพศ</option>
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="0812345678"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                อีเมล <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Preferred Language */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ภาษาที่ต้องการ <span className="text-red-500">*</span>
              </label>
              <select
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">เลือกภาษา</option>
                <option value="ไทย">ไทย</option>
                <option value="อังกฤษ">อังกฤษ</option>
                <option value="จีน">จีน</option>
                <option value="ญี่ปุ่น">ญี่ปุ่น</option>
                <option value="เกาหลี">เกาหลี</option>
              </select>
              {errors.preferredLanguage && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.preferredLanguage}
                </p>
              )}
            </div>

            {/* Nationality */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                สัญชาติ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="เช่น ไทย"
              />
              {errors.nationality && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.nationality}
                </p>
              )}
            </div>

            {/* Emergency Contact Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ชื่อผู้ติดต่อฉุกเฉิน
              </label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="(ไม่บังคับ)"
              />
            </div>

            {/* Emergency Contact Relationship */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ความสัมพันธ์ (ฉุกเฉิน)
              </label>
              <input
                type="text"
                name="emergencyContactRelationship"
                value={formData.emergencyContactRelationship}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="(ไม่บังคับ)"
              />
            </div>

            {/* Religion */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ศาสนา
              </label>
              <input
                type="text"
                name="religion"
                value={formData.religion}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="(ไม่บังคับ)"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-lg font-semibold text-white transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "กำลังส่ง..." : "ส่งข้อมูล"}
            </button>
            <p className="mt-3 text-center text-xs text-gray-400">
              ข้อมูลที่กรอกจะถูกส่งให้เจ้าหน้าที่เห็นแบบ Real-time
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}