import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";
import cors from "cors";

dotenv.config();

const app = express();

// ✅ CORS: Allow your Netlify frontend and local dev
app.use(cors({
  origin: [
    "https://<your-netlify-site>.netlify.app", // 🔁 replace with your actual Netlify site URL
    "http://localhost:5173" // allow local development
  ],
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = "./uploads";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEFAULT_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// ✅ Ensure uploads folder exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// ✅ Multer setup for handling uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// ✅ Telegram bot setup
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
bot.getMe().then(() => {
  console.log("🤖 Telegram bot connected successfully");
  bot.sendMessage(DEFAULT_CHAT_ID, "✅ Bot is online and ready to send keys!");
});

// ✅ Upload + Telegram sending route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { chatId, keyBase64 } = req.body;
    const receiverId = chatId || DEFAULT_CHAT_ID;
    const filePath = path.join(UPLOAD_DIR, req.file.filename);

    const caption = `🔐 *File Encrypted Successfully!*\n\n📄 File: ${req.file.filename}\n🗝️ Key (Base64):\n\`${keyBase64}\``;

    // Send encrypted file & key to Telegram
    await bot.sendDocument(receiverId, filePath, { caption, parse_mode: "Markdown" });
    console.log(`✅ File & key sent to Telegram user ${receiverId}`);

    res.json({
      success: true,
      message: "File uploaded and sent to Telegram successfully!",
      fileUrl: `${BASE_URL}/uploads/${req.file.filename}`,
    });
  } catch (err) {
    console.error("❌ Telegram send error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Serve uploaded files for download
app.use("/uploads", express.static(UPLOAD_DIR));

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at ${BASE_URL}`);
});
