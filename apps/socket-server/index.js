const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

// อนุญาตให้ Next.js dev server (localhost:3000) และ production URL เชื่อมต่อได้
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      process.env.CLIENT_URL, // ใส่ URL ของ Vercel ตอน deploy จริง
    ],
    methods: ["GET", "POST"],
  },
});

// เก็บ state ของแต่ละ session ไว้ใน memory
// key = sessionId, value = { formData, status: 'idle' | 'filling' | 'submitted' }
const sessions = {};

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Staff เข้ามาดูรายชื่อ session ทั้งหมดที่มีอยู่
  socket.on("staff:join", () => {
    socket.join("staff-room");
    socket.emit("staff:init", sessions);
  });

  // Patient เริ่ม session ใหม่ (สร้างตอนเปิดฟอร์มครั้งแรก)
  socket.on("patient:join", (sessionId) => {
    socket.join(sessionId);
    if (!sessions[sessionId]) {
      sessions[sessionId] = { formData: {}, status: "filling" };
    }
    io.to("staff-room").emit("staff:update", {
      sessionId,
      ...sessions[sessionId],
    });
  });

  // Patient พิมพ์ข้อมูลในฟอร์ม -> broadcast ไปหา staff ทันที
  socket.on("patient:formUpdate", ({ sessionId, formData }) => {
    if (!sessions[sessionId]) {
      sessions[sessionId] = { formData: {}, status: "filling" };
    }
    sessions[sessionId].formData = formData;
    sessions[sessionId].status = "filling";

    io.to("staff-room").emit("staff:update", {
      sessionId,
      ...sessions[sessionId],
    });
  });

  // Patient กด submit ฟอร์ม
  socket.on("patient:submit", ({ sessionId, formData }) => {
    if (!sessions[sessionId]) {
      sessions[sessionId] = { formData: {}, status: "submitted" };
    }
    sessions[sessionId].formData = formData;
    sessions[sessionId].status = "submitted";

    io.to("staff-room").emit("staff:update", {
      sessionId,
      ...sessions[sessionId],
    });
  });

  // Patient หยุดพิมพ์ไปสักพัก -> ฝั่ง client จะ emit event นี้หลัง debounce/timeout เอง
  socket.on("patient:inactive", (sessionId) => {
    if (sessions[sessionId] && sessions[sessionId].status !== "submitted") {
      sessions[sessionId].status = "inactive";
      io.to("staff-room").emit("staff:update", {
        sessionId,
        ...sessions[sessionId],
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});