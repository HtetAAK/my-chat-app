const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ၁။ Database ချိတ်ဆက်ခြင်း 
// (Hosting တင်လျှင် 'mongodb://127.0.0.1...' နေရာမှာ MongoDB Atlas Link ကို အစားထိုးပါ)
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/telegramDB';

mongoose.connect(mongoURI)
    .then(() => console.log("DB Connected Successfully"))
    .catch(err => console.error("DB Connection Error:", err));

// ၂။ Schema သတ်မှတ်ခြင်း
const Chat = mongoose.model('Chat', { 
    user: String, 
    msg: String, 
    time: { type: Date, default: Date.now } 
});

app.use(express.static('public'));

// ၃။ Socket.io Logic
io.on('connection', async (socket) => {
    // စာဟောင်း ၅၀ ကို Database မှ ဆွဲထုတ်ပြခြင်း
    try {
        const history = await Chat.find().sort({ time: 1 }).limit(50);
        socket.emit('load_history', history);
    } catch (err) {
        console.log("Error loading history:", err);
    }

    // စာအသစ် ပေးပို့ခြင်း
    socket.on('send_message', async (data) => {
        const newMsg = new Chat(data);
        await newMsg.save();
        io.emit('receive_message', data);
    });
});

// ၄။ Port သတ်မှတ်ခြင်း (Render အတွက် process.env.PORT လိုအပ်သည်)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));