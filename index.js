process.env.NTBA_FIX_350 = "1";

const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

// apna token yahan daalo
const token = "8680035276:AAG3QHIghuv1CrRY09PI7EkY_ZWQ6A5qFoE";

const bot = new TelegramBot(token, { polling: true });
const chatStages = new Map();

const part2FilePath = path.join(__dirname, "files", "part2.mp4");

const tempBatchLinks = {
    "Temp Batch 2": "https://t.me/your_temp_batch_2",
    "Temp Batch 3": "https://t.me/your_temp_batch_3",
};

const botStartKeyboard = {
    reply_markup: {
        keyboard: [["BotStart"]],
        resize_keyboard: true,
        one_time_keyboard: false,
    },
};

const mainMenuKeyboard = {
    reply_markup: {
        keyboard: [
            ["Batch", "Books"],
            ["Module", "Temp option", "Back"],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
    },
};

const batchMenuKeyboard = {
    reply_markup: {
        keyboard: [
            ["Temp Batch 1", "Temp Batch 2"],
            ["Temp Batch 3", "Exit"],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
    },
};

bot.on("polling_error", (error) => {
    console.error("Polling error:", error?.message || error);
});

bot.on("error", (error) => {
    console.error("Bot error:", error?.message || error);
});

bot.setMyCommands([
    { command: "start", description: "Bot start karo" },
]);

bot.onText(/^\/start$/, (msg) => {
    chatStages.set(msg.chat.id, "awaiting_botstart");

    bot.sendMessage(
        msg.chat.id,
        "Welcome! Sabse pehle neeche diye gaye BotStart button par click karo.",
        botStartKeyboard
    );
});

bot.on("message", async (msg) => {
    const text = msg.text?.trim();
    const chatId = msg.chat.id;
    const stage = chatStages.get(chatId);

    if (!text || text === "/start") {
        return;
    }

    if (text.startsWith("/")) {
        await bot.sendMessage(chatId, "Abhi sirf /start command available hai.");
        return;
    }

    if (text === "BotStart") {
        chatStages.set(chatId, "menu_open");
        await bot.sendMessage(
            chatId,
            "Ab Batch, Books aur Module ke options aa gaye hain. Apna option select karo.",
            mainMenuKeyboard
        );
        return;
    }

    if (stage === "batch_menu") {
        if (text === "Exit") {
            chatStages.set(chatId, "menu_open");
            await bot.sendMessage(
                chatId,
                "Batch menu band ho gaya. Main options wapas aa gaye hain.",
                mainMenuKeyboard
            );
            return;
        }

        if (text === "Temp Batch 1") {
            try {
                if (!fs.existsSync(part2FilePath)) {
                    await bot.sendMessage(
                        chatId,
                        "part2.mp4 file abhi available nahi hai.",
                        batchMenuKeyboard
                    );
                    return;
                }

                await bot.sendMessage(
                    chatId,
                    "Temp Batch 1 ke liye part2.mp4 bhej raha hoon. Neeche se download kar lo.",
                    batchMenuKeyboard
                );

                const fileStream = fs.createReadStream(part2FilePath);

                await bot.sendDocument(
                    chatId,
                    fileStream,
                    {
                        caption: "Temp Batch 1 - part2.mp4",
                    },
                    {
                        filename: "part2.mp4",
                        contentType: "video/mp4",
                    }
                );
            } catch (error) {
                console.error("Temp Batch 1 send failed:", error?.response?.body || error);
                await bot.sendMessage(
                    chatId,
                    "File bhejne me problem aa gayi. Ek baar fir try karo.",
                    batchMenuKeyboard
                );
            }
            return;
        }

        if (tempBatchLinks[text]) {
            await bot.sendMessage(
                chatId,
                `${text} group link: ${tempBatchLinks[text]}`,
                batchMenuKeyboard
            );
            return;
        }

        await bot.sendMessage(
            chatId,
            "Batch menu me se Temp Batch 1, Temp Batch 2, Temp Batch 3 ya Exit select karo.",
            batchMenuKeyboard
        );
        return;
    }

    if (stage !== "menu_open") {
        await bot.sendMessage(
            chatId,
            "Pehle BotStart button par click karo.",
            botStartKeyboard
        );
        return;
    }

    if (text === "Back") {
        chatStages.set(chatId, "awaiting_botstart");
        await bot.sendMessage(
            chatId,
            "Tum previous screen par aa gaye ho. Dobara aage badhne ke liye BotStart par click karo.",
            botStartKeyboard
        );
        return;
    }

    if (text === "Batch") {
        chatStages.set(chatId, "batch_menu");
        await bot.sendMessage(
            chatId,
            "Batch ke neeche 3 temp options aa gaye hain. Kisi bhi temp batch par click karo, ya Exit dabakar main menu me wapas aa jao.",
            batchMenuKeyboard
        );
        return;
    }

    if (text === "Books" || text === "Module") {
        await bot.sendMessage(
            chatId,
            `${text} option select ho gaya. Neeche menu hamesha available rahega.`,
            mainMenuKeyboard
        );
        return;
    }

    if (text === "Temp option") {
        await bot.sendMessage(
            chatId,
            "Temp option abhi setup me hai.",
            mainMenuKeyboard
        );
        return;
    }

    await bot.sendMessage(
        chatId,
        `Please neeche diye gaye options me se select karo. Tumne "${text}" bheja hai.`,
        mainMenuKeyboard
    );
});
