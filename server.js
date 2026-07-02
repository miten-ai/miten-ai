import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

// ફોલ્ડરનો સાચો રસ્તો (Path) શોધવા માટેની સેટિંગ
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));

// Gemini API કનેક્શન (જે ઓનલાઇન સેટિંગમાંથી ઓટોમેટિક કી ઉપાડશે)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ચેટ હિસ્ટ્રી/મેમરી સ્ટોર કરવા માટે
let chatSession = null;

function getChatSession() {
    if (!chatSession) {
        chatSession = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                // એઆઈનો મસ્ત ગુજલિશ અને ફ્રેન્ડલી પર્સના અહીં સેટ કર્યો છે
                systemInstruction: "તારું નામ miten.ai છે. તું એક એકદમ કૂલ અને સ્માર્ટ એઆઈ દોસ્ત છે. તારે યુઝર સાથે હંમેશા એકદમ ફ્રેન્ડલી થઈને વાત કરવાની. તારી ભાષા સરળ ગુજરાતી અને ગુજલિશ (મિક્સ) હોવી જોઈએ. જવાબો શોર્ટ, સ્માર્ટ અને પોઈન્ટ ટુ પોઈન્ટ આપવાના જેથી વાંચવાની મજા આવે."
            }
        });
    }
    return chatSession;
}

// હોમ પેજ ઓપન થાય ત્યારે સીધી index.html ફાઇલ લોડ થશે
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ચેટ માટેનો મુખ્ય રૂટ
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const chat = getChatSession();

        const response = await chat.sendMessage({
            message: userMessage
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error("ભૂલ આવી:", error);
        res.status(500).json({ error: "સર્વરમાં ખામી છે અથવા API Key ખોટી છે." });
    }
});

// મેમરી ક્લીન કરવાનો રૂટ
app.post('/api/clear', (req, res) => {
    chatSession = null;
    res.json({ status: "success", message: "ચેટ મેમરી ક્લીન થઈ ગઈ!" });
});

// ઓનલાઇન સર્વર માટે પોર્ટ સેટિંગ (Render માટે મહત્વનું)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Super Server running at http://localhost:${PORT}`));