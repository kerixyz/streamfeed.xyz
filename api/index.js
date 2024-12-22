require('dotenv').config();

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
const bodyParser = require('body-parser');
const pool = require('./db'); 
const app = express();

const conversationManager = require('./conversationManager');

const apiUrl = process.env.API_URL || 'http://localhost:5001/api';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const dataRoutes = require('./routes/data');
app.use('/api', dataRoutes);

app.use((req, res, next) => {
    const isHttps = req.headers['x-forwarded-proto'] === 'https';
    const isWww = req.headers.host.startsWith('www.');

    if (!isHttps || !isWww) {
        return res.redirect(`https://www.streamfeed.xyz${req.url}`);
    }

    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; img-src 'self' https://www.streamfeed.xyz; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
    );
    next();
});

app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    const { userId, message } = req.body;

    try {
        // Get or assign user's version
        let userVersion = await getUserVersion(userId);
        if (!userVersion) {
            userVersion = assignVersion(); // Assign random version ('manual' or 'adaptive')
        }

        // Handle message based on the assigned version
        const reply = await conversationManager.handleMessage(userId, message, openai, 'the streamer');
        await saveMessage(userId, message, 'user', userVersion); // Save user's message with version info
        await saveMessage(userId, reply, 'assistant', userVersion); // Save bot's reply with version info

        return res.json({ reply });
    } catch (error) {
        console.error('Error processing chat:', error);
        return res.status(500).json({ error: 'An error occurred while processing the chat.' });
    }
});

// Save messages in chat_messages table with version info
async function saveMessage(userId, message, role, version) {
    try {
        await pool.query(
            'INSERT INTO chat_messages (user_id, message, role, version) VALUES ($1, $2, $3, $4)',
            [userId, message, role, version]
        );
    } catch (err) {
        console.error('Error saving message to database:', err);
    }
}

// Fetch user's assigned version directly from chat_messages
async function getUserVersion(userId) {
    try {
        const result = await pool.query(
            'SELECT version FROM chat_messages WHERE user_id = $1 LIMIT 1',
            [userId]
        );
        return result.rows.length ? result.rows[0].version : null;
    } catch (err) {
        console.error('Error retrieving user version from database:', err);
        return null;
    }
}
