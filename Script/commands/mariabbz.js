module.exports.config = {
  name: "mariabbz",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "rX Abdullah",
  description: "Sticker after 6 sec on bby/baby/mari",
  commandCategory: "QTV BOX",
  usages: "",
  cooldowns: 2
};

module.exports.handleEvent = async ({ event, api }) => {
  const KEY = ["bby", "baby", "mari"];

  let thread = global.data.threadData.get(event.threadID) || {};
  if (typeof thread["baby"] !== "undefined" && thread["baby"] === false) return;

  const body = event.body.toLowerCase();

  if (KEY.some(word => body.includes(word))) {
    const stickers = [
      "526214684778630", "526220108111421", "526220308111401", "526220484778050",
      "526220691444696", "526220814778017", "526220978111334", "526221104777988",
      "526221318111300", "526221564777942", "526221711444594", "526221971444568",
      "2041011389459668", "2041011569459650", "2041011726126301", "2041011836126290",
      "2041011952792945", "2041012109459596", "2041012262792914", "2041012406126233",
      "2041012539459553", "2041012692792871", "2041014432792697", "2041014739459333"
    ];

    const randomSticker = stickers[Math.floor(Math.random() * stickers.length)];

    // 6 second por sticker pathabe
    setTimeout(() => {
      api.sendMessage({ sticker: randomSticker }, event.threadID);
    }, 6000); // exactly 6 seconds
  }
};

module.exports.languages = {
  "en": { "on": "on", "off": "off", "successText": "bby/baby/mari → sticker after 6s activated!" },
  "vi": { "on": "Bật", "off": "Tắt", "successText": "đã bật sticker sau 6s khi gọi bby/baby/mari" }
};

module.exports.run = async ({ event, api, Threads, getText }) => {
  let { threadID, messageID } = event;
  let data = (await Threads.getData(threadID)).data || {};

  data["baby"] = !data["baby"];
  await Threads.setData(threadID, { data });
  global.data.threadData.set(threadID, data);

  api.sendMessage(`\( {data["baby"] ? getText("on") : getText("off")} \){getText("successText")}`, threadID, messageID);
};
