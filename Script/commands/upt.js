const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "upt",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "rX",
  usePrefix: true,
  description: "Neon Bot Status Image",
  commandCategory: "system",
  usages: "",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event }) {
  try {
    // 🖼 Background
    const bgPath = path.join(__dirname, "cache", "status_bg.png");
    const bg = await loadImage(bgPath);

    const canvas = createCanvas(bg.width, bg.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // 🌑 Dark overlay
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 🟦 Neon frame
    ctx.strokeStyle = "#00fff0";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#00fff0";
    ctx.shadowBlur = 25;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // ⏱ Uptime
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const ping = Date.now() - event.timestamp;
    const owner = "rX";

    // 🔤 Text base
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#00eaff";
    ctx.shadowBlur = 18;

    // ⚡ Title
    ctx.font = "bold 60px Sans";
    ctx.fillText("BOT STATUS", 80, 110);

    // Divider line
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 135);
    ctx.lineTo(canvas.width - 80, 135);
    ctx.stroke();

    // 📍 Positions
    const iconX = 80;
    const textX = 150;
    const y1 = 210;
    const y2 = 290;
    const y3 = 370;

    ctx.font = "bold 40px Sans";

    // 🧠 Text
    ctx.fillText(`${h}h ${m}m ${s}s`, textX, y1);
    ctx.fillText(`${ping} ms`, textX, y2);
    ctx.fillText(owner, textX, y3);

    // 🔹 Labels
    ctx.font = "24px Sans";
    ctx.fillText("UPTIME", textX, y1 - 35);
    ctx.fillText("PING", textX, y2 - 35);
    ctx.fillText("OWNER", textX, y3 - 35);

    // 🧩 Icons
    const iconClock = await loadImage("https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/23f1.png");
    const iconSignal = await loadImage("https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4f6.png");
    const iconCrown = await loadImage("https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f451.png");

    ctx.shadowBlur = 0;
    ctx.drawImage(iconClock, iconX, y1 - 55, 48, 48);
    ctx.drawImage(iconSignal, iconX, y2 - 55, 48, 48);
    ctx.drawImage(iconCrown, iconX, y3 - 55, 48, 48);

    // 🪪 Footer
    ctx.font = "20px Sans";
    ctx.fillStyle = "#aefcff";
    ctx.fillText("Powered by rX Bot", canvas.width - 280, canvas.height - 40);

    // 💾 Save
    const outPath = path.join(__dirname, "cache", `upt_${event.senderID}.png`);
    fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

    // 📤 Send
    return api.sendMessage(
      { attachment: fs.createReadStream(outPath) },
      event.threadID,
      () => fs.unlinkSync(outPath),
      event.messageID
    );

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Status image generate failed!", event.threadID, event.messageID);
  }
};
