const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const API_ENDPOINT = "https://metakexbyneokex.fly.dev/images/generate";

module.exports.config = {
    name: "meta",
    version: "1.2",
    credits: "rX | api from neoaz",
    description: "Meta AI Image Generator (Reply 1-4 / all)",
    usages: "!meta <prompt>",
    commandCategory: "AI",
    cooldowns: 10
};

// Download image from URL to local path
async function downloadImage(url, savePath) {
    const imgBuffer = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(savePath, imgBuffer.data);
    return savePath;
}

// Create 2x2 grid image with numbers
async function createGridImage(imagePaths, outputPath) {
    const images = await Promise.all(imagePaths.map(p => loadImage(p)));
    const imgWidth = images[0].width;
    const imgHeight = images[0].height;
    const padding = 10;
    const numberSize = 40;

    const canvasWidth = (imgWidth * 2) + (padding * 3);
    const canvasHeight = (imgHeight * 2) + (padding * 3);
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const positions = [
        { x: padding, y: padding },
        { x: imgWidth + (padding * 2), y: padding },
        { x: padding, y: imgHeight + (padding * 2) },
        { x: imgWidth + (padding * 2), y: imgHeight + (padding * 2) }
    ];

    for (let i = 0; i < images.length; i++) {
        const { x, y } = positions[i];
        ctx.drawImage(images[i], x, y, imgWidth, imgHeight);

        // Draw number circle
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(x + numberSize, y + numberSize, numberSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((i + 1).toString(), x + numberSize, y + numberSize);
    }

    fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
    return outputPath;
}

// Main command run
module.exports.run = async function ({ api, event, args }) {
    const prompt = args.join(" ");
    if (!prompt)
        return api.sendMessage(`❌ Please provide a prompt.\nExample: !meta A bear riding a bike`, event.threadID, event.messageID);

    const cache = path.join(__dirname, 'cache_meta');
    if (!fs.existsSync(cache)) fs.mkdirSync(cache);

    api.setMessageReaction("⏳", event.messageID);

    try {
        const response = await axios.post(API_ENDPOINT, { prompt });
        const data = response.data;

        if (!data.success || !data.images || data.images.length === 0)
            return api.sendMessage("❌ Failed to generate images.", event.threadID, event.messageID);

        const imageCount = Math.min(4, data.images.length);
        const downloaded = [];

        for (let i = 0; i < imageCount; i++) {
            const url = data.images[i].url;
            const filePath = path.join(cache, `meta_${Date.now()}_${i}.png`);
            await downloadImage(url, filePath);
            downloaded.push(filePath);
        }

        const gridPath = path.join(cache, `grid_${Date.now()}.png`);
        await createGridImage(downloaded, gridPath);

        await api.sendMessage({
            body: `✨ Meta AI Generated\nReply with: 1 | 2 | 3 | 4 | all`,
            attachment: fs.createReadStream(gridPath)
        }, event.threadID, async (err, info) => {
            if (!err) {
                // Push handleReply object
                if (!global.client.handleReply) global.client.handleReply = [];
                global.client.handleReply.push({
                    name: this.config.name,
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID,
                    urls: data.images.slice(0, imageCount).map(img => img.url),
                    downloaded,
                    gridPath
                });
            }
        });

        api.setMessageReaction("✅", event.messageID);

    } catch (err) {
        console.log(err.message);
        api.setMessageReaction("❌", event.messageID);
        return api.sendMessage("❌ API Error — Please try again", event.threadID);
    }
};

// Handle replies (1-4 or all)
module.exports.handleReply = async function ({ api, event }) {
    // Find the handleReply object based on replied message ID
    const handleReply = global.client.handleReply?.find(h => h.messageID == event.messageReply?.messageID);
    if (!handleReply) return api.sendMessage("❌ Missing value to respond your problem", event.threadID);

    if (event.senderID !== handleReply.author) return;

    const selection = event.body.toLowerCase().trim();

    api.setMessageReaction("⏳", event.messageID);

    // Handle "all"
    if (selection === "all") {
        try {
            const attachments = handleReply.downloaded.map(p => fs.createReadStream(p));
            await api.sendMessage({ body: "✨ Here are all images", attachment: attachments }, event.threadID);
            api.setMessageReaction("✅", event.messageID);
        } catch (err) {
            console.log(err);
            api.setMessageReaction("❌", event.messageID);
            return api.sendMessage("❌ Failed to send images", event.threadID);
        }
        return;
    }

    // Handle single selection 1-4
    const index = parseInt(selection);
    if (isNaN(index) || index < 1 || index > handleReply.downloaded.length)
        return api.sendMessage("❌ Send only 1 | 2 | 3 | 4 | all", event.threadID);

    try {
        const selectedPath = handleReply.downloaded[index - 1];
        await api.sendMessage({ body: "✨ Here is your image", attachment: fs.createReadStream(selectedPath) }, event.threadID);
        api.setMessageReaction("✅", event.messageID);
    } catch (err) {
        console.log(err);
        api.setMessageReaction("❌", event.messageID);
        return api.sendMessage("❌ Failed to send image", event.threadID);
    }
};
