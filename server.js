const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ၁။ MongoDB Atlas Connection String
// <password> နေရာမှာ သင်သတ်မှတ်ခဲ့တဲ့ Database User Password ကို အစားထိုးပါ
const mongoURI = 'mongodb+srv://Arkar_212:arkar12345@cluster0.tgqvhvu.mongodb.net/telegramDB?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
    .then(() => console.log("Cloud DB Connected Successfully"))
    .catch(err => console.error("DB Connection Error:", err));

// ၂။ Chat Schema နှင့် Model
const Chat = mongoose.model('Chat', { 
    user: String, 
    msg: String, 
    time: { type: Date, default: Date.now } 
});

app.use(express.static('public'));

// ၃။ Real-time Communication (Socket.io)
io.on('connection', async (socket) => {
    console.log('A user connected');

    // စာဟောင်း ၅၀ ကို Database မှ ဆွဲထုတ်ပြီး ဖုန်း/Browser ဆီ ပို့ပေးခြင်း
    try {
        const history = await Chat.find().sort({ time: 1 }).limit(50);
        socket.emit('load_history', history);
    } catch (err) {
        console.log("Error loading history:", err);
    }

    // စာအသစ် ပေးပို့ခြင်းနှင့် သိမ်းဆည်းခြင်း
    socket.on('send_message', async (data) => {
        try {
            const newMsg = new Chat(data);
            await newMsg.save();
            io.emit('receive_message', data); // လူတိုင်းဆီ စာပြန်ဖြန့်ခြင်း
        } catch (err) {
            console.log("Error saving message:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// ၄။ Port သတ်မှတ်ခြင်း (Render အတွက် process.env.PORT သည် မဖြစ်မနေလိုအပ်သည်)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});