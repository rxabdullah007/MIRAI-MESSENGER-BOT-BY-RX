const axios = require("axios");

const API_BASE = "https://mirai-store.onrender.com";
const ADMINS = [
  "100068565380737"
];

module.exports.config = {
  name: "miraistore",
  version: "1.3.0",
  hasPermssion: 2,
  credits: "Rx",
  description: "Mirai Command Store (Search, Like, Upload with Syntax Check, Delete)",
  commandCategory: "system",
  usages:
    "!miraistore <id | name | category>\n" +
    "!miraistore like <id>\n" +
    "!miraistore upload <public_raw_js_url>\n" +
    "!miraistore delete <id> <secret>",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID } = event;

  // ================= HELP =================
  if (!args[0]) {
    return api.sendMessage(
      "📦 Mirai Store\n\n" +
      "Usage:\n" +
      "• !miraistore <id | name | category>\n" +
      "• !miraistore like <id>\n" +
      "• !miraistore upload <public_raw_js_url> (admin)\n" +
      "• !miraistore delete <id> <secret> (admin)",
      threadID
    );
  }

  const sub = args[0].toLowerCase();

  // ================= UPLOAD =================
  if (sub === "upload") {
    if (!ADMINS.includes(senderID)) {
      return api.sendMessage("❌ You are not allowed to upload.", threadID);
    }

    const rawUrl = args[1];
    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
      return api.sendMessage(
        "❌ Invalid or missing public URL.",
        threadID
      );
    }

    try {
      // Fetch JS code
      const fetchRes = await axios.get(rawUrl, {
        timeout: 15000,
        responseType: "text"
      });
      const code = fetchRes.data;

      if (typeof code !== "string" || code.length < 50) {
        return api.sendMessage(
          "❌ Invalid JavaScript file.",
          threadID
        );
      }

      // Syntax check only (no execution)
      try {
        new Function(code);
      } catch (err) {
        return api.sendMessage(
          `❌ Syntax Error Found!\n\n${err.message}`,
          threadID
        );
      }

      // Direct upload to API
      const res = await axios.post(
        `${API_BASE}/miraistore/upload`,
        { rawUrl }
      );

      if (res.data?.error) {
        return api.sendMessage(
          `❌ Upload failed: ${res.data.error}`,
          threadID
        );
      }

      return api.sendMessage(
        `✅ Upload Successful!\n🆔 ID: ${res.data.id}`,
        threadID
      );

    } catch (err) {
      return api.sendMessage(
        "❌ Failed to fetch file or API error.",
        threadID
      );
    }
  }

  // ================= DELETE =================
  if (sub === "delete") {
    if (!ADMINS.includes(senderID)) {
      return api.sendMessage("❌ You are not allowed to delete.", threadID);
    }

    const id = args[1];
    const secret = args[2];

    if (!id || !secret) {
      return api.sendMessage(
        "❌ Missing data\nUsage: !miraistore delete <id> <secret>",
        threadID
      );
    }

    try {
      const res = await axios.post(
        `${API_BASE}/miraistore/delete/${id}`,
        { secret }
      );

      if (res.data?.error) {
        return api.sendMessage(`❌ ${res.data.error}`, threadID);
      }

      return api.sendMessage(
        `🗑️ Deleted Successfully!\n🆔 ID: ${id}`,
        threadID
      );
    } catch {
      return api.sendMessage("❌ Delete API error.", threadID);
    }
  }

  // ================= LIKE =================
  if (sub === "like") {
    const id = args[1];
    if (!id) {
      return api.sendMessage(
        "❌ ID missing\nUsage: !miraistore like <id>",
        threadID
      );
    }

    try {
      const res = await axios.post(
        `${API_BASE}/miraistore/like/${id}`,
        { userID: senderID }
      );

      if (res.data?.message) {
        return api.sendMessage(
          "⚠️ You already liked this command.",
          threadID
        );
      }

      return api.sendMessage(
        `❤️ Liked!\nTotal Likes: ${res.data.likes}`,
        threadID
      );
    } catch {
      return api.sendMessage("❌ Like API error.", threadID);
    }
  }

  // ================= SEARCH =================
  const query = args.join(" ");

  try {
    const res = await axios.get(
      `${API_BASE}/miraistore/search?q=${encodeURIComponent(query)}`
    );

    const data = res.data;

    if (!data || data.message) {
      return api.sendMessage("❌ Command not found.", threadID);
    }

    if (Array.isArray(data)) {
      let msg = `📂 Search Results (${data.length})\n\n`;
      data.forEach(cmd => {
        msg += `🆔 ${cmd.id} | ${cmd.name} (${cmd.category})\n`;
      });
      return api.sendMessage(msg, threadID);
    }

    // Single result
    const message = `╭─‣ 📦 Mirai Store
├‣ Name      : ${data.name}
├‣ Author    : ${data.author}
├‣ Category  : ${data.category}
├‣ Views     : ${data.views}
├‣ Likes     : ❤️ ${data.likes}
├‣ ID        : ${data.id}
╰────────────◊
 ⭔upload :  ${new Date(data.uploadDate).toDateString()}
🌐  url: ${data.rawUrl}`;

    return api.sendMessage(message, threadID);

  } catch {
    return api.sendMessage("❌ Search API error.", threadID);
  }
};
