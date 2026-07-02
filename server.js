import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// યુઝર વાઇઝ ચેટ મેમરી સ્ટોર કરવા માટે
let chatSession = null;

function getChatSession() {
    if (!chatSession) {
        chatSession = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "તારું નામ miten.ai છે. તું ChatGPT જેવો જ પાવરફુલ અને સ્માર્ટ AI છે. તારે હંમેશા ગુજરાતી અને ઇંગ્લિશ મિક્સ (ગુજલિશ) ભાષામાં વાત કરવાની. જો યુઝરના સ્પેલિંગમાં ભૂલ હોય કે વાક્ય અધૂરું હોય, તો પણ તારે તારા મગજથી સમજીને બેસ્ટ જવાબ આપવાનો. જો સાવ ન સમજાય, તો એરર આપવાના બદલે ફ્રેન્ડલી થઈને પૂછવાનું કે 'ભાઈ, થોડું વિગતવાર સમજાવો ને!' જવાબો એકદમ ક્લીન ફોર્મેટમાં આપવાના."
            }
        });
    }
    return chatSession;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage || userMessage.trim() === "") {
            return res.json({ reply: "ભાઈ, કંઈક ટાઈપ તો કરો! 🤔" });
        }

        const chat = getChatSession();
        const response = await chat.sendMessage({ message: userMessage });

        res.json({ reply: response.text });
    } catch (error) {
        console.error("AI Error:", error);
        // જો કોઈ ગરબડ થાય તો કનેક્શન તૂટવાને બદલે સ્માર્ટ રીપ્લાય
        res.json({ reply: "અરે ભાઈ, આ પ્રશ્ન સમજવામાં મારે થોડું કન્ફ્યુઝન થયું. જરા અલગ રીતે અથવા સાચા સ્પેલિંગ સાથે પૂછશો? 🛠️" });
    }
});

app.post('/api/clear', (req, res) => {
    chatSession = null;
    res.json({ status: "success" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));