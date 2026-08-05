"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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

type Session = {
  formData: FormData;
  status: "idle" | "filling" | "submitted" | "inactive";
};

type Sessions = Record<string, Session>;

export default function StaffPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Sessions>({});
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  
  // ✅ ใช้ useRef เก็บ socket
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    console.log("📡 [STAFF] Joining staff room");
    socket.emit("staff:join");

    socket.on("staff:init", (data: Sessions) => {
      console.log("📡 [STAFF] Received init:", Object.keys(data).length, "sessions");
      setSessions(data);
    });

    socket.on("staff:update", (data: { sessionId: string } & Session) => {
      console.log("📡 [STAFF] Received update:", data);
      setSessions((prev) => ({
        ...prev,
        [data.sessionId]: {
          formData: data.formData,
          status: data.status,
        },
      }));
    });

    // ✅ ไม่ต้อง disconnect
    return () => {
      console.log("📡 [STAFF] Component unmounting, keeping socket alive");
      socket.off("staff:init");
      socket.off("staff:update");
    };
  }, []);

  const getStatusBadge = (status: string) => {
    const config = {
      idle: { color: "bg-gray-300", label: "🟡 ยังไม่เริ่ม" },
      filling: { color: "bg-blue-500", label: "🔵 กำลังกรอก" },
      inactive: { color: "bg-orange-400", label: "🟠 หยุดพิมพ์" },
      submitted: { color: "bg-emerald-500", label: "✅ ส่งแล้ว" },
    };
    const c = config[status as keyof typeof config] || config.idle;
    return (
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-medium text-white ${c.color}`}
      >
        {c.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH");
  };

  const selectedData = selectedSession ? sessions[selectedSession] : null;
  const sessionList = Object.entries(sessions);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">
            🏥 หน้าจอเจ้าหน้าที่
          </h1>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg px-4 py-2 text-sm text-gray-500 transition hover:bg-gray-100"
          >
            ⬅ กลับ
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-xl bg-white p-4 shadow-lg">
              <h2 className="mb-3 text-lg font-semibold text-gray-700">
                👥 รายชื่อผู้ป่วย
              </h2>
              <p className="mb-3 text-sm text-gray-400">
                {sessionList.length} คนกำลังกรอกข้อมูล
              </p>

              <div className="max-h-[70vh] space-y-2 overflow-y-auto">
                {sessionList.length === 0 ? (
                  <p className="py-8 text-center text-gray-400">
                    ยังไม่มีผู้ป่วยกำลังกรอกข้อมูล
                  </p>
                ) : (
                  sessionList.map(([id, session]) => (
                    <button
                      key={id}
                      onClick={() => setSelectedSession(id)}
                      className={`w-full rounded-lg p-3 text-left transition ${
                        selectedSession === id
                          ? "bg-blue-50 ring-2 ring-blue-400"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          {session.formData.firstName ||
                            session.formData.lastName
                            ? `${session.formData.firstName} ${session.formData.lastName}`
                            : "ไม่ระบุชื่อ"}
                        </span>
                        {getStatusBadge(session.status)}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        ID: {id.slice(0, 8)}...
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl bg-white p-6 shadow-lg">
              {selectedData ? (
                <>
                  <div className="mb-4 flex items-center justify-between border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      ข้อมูลผู้ป่วย
                    </h2>
                    {getStatusBadge(selectedData.status)}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoItem
                      label="ชื่อจริง"
                      value={selectedData.formData.firstName}
                    />
                    <InfoItem
                      label="ชื่อกลาง"
                      value={selectedData.formData.middleName || "-"}
                    />
                    <InfoItem
                      label="นามสกุล"
                      value={selectedData.formData.lastName}
                    />
                    <InfoItem
                      label="วันเกิด"
                      value={formatDate(selectedData.formData.dateOfBirth)}
                    />
                    <InfoItem
                      label="เพศ"
                      value={selectedData.formData.gender || "-"}
                    />
                    <InfoItem
                      label="เบอร์โทรศัพท์"
                      value={selectedData.formData.phoneNumber || "-"}
                    />
                    <InfoItem
                      label="อีเมล"
                      value={selectedData.formData.email || "-"}
                    />
                    <InfoItem
                      label="ภาษาที่ต้องการ"
                      value={selectedData.formData.preferredLanguage || "-"}
                    />
                    <InfoItem
                      label="สัญชาติ"
                      value={selectedData.formData.nationality || "-"}
                    />
                    <InfoItem
                      label="ชื่อผู้ติดต่อฉุกเฉิน"
                      value={selectedData.formData.emergencyContactName || "-"}
                    />
                    <InfoItem
                      label="ความสัมพันธ์ (ฉุกเฉิน)"
                      value={
                        selectedData.formData.emergencyContactRelationship ||
                        "-"
                      }
                    />
                    <InfoItem
                      label="ศาสนา"
                      value={selectedData.formData.religion || "-"}
                    />
                  </div>

                  {selectedData.status === "submitted" && (
                    <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-emerald-700">
                      ✅ ผู้ป่วยรายนี้ส่งข้อมูลเรียบร้อยแล้ว
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-[400px] items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-3">👆</div>
                    <p>เลือกผู้ป่วยจากรายการด้านซ้าย</p>
                    <p className="text-sm">เพื่อดูข้อมูลแบบ Real-time</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-1 text-gray-800">{value || "-"}</p>
    </div>
  );
}