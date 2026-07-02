import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // ઈમેજ અપલોડ માટે લિમિટ વધારી

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// સિસ્ટમ ઇન્સ્ટ્રક્શન: લેંગ્વેજ રૂલ પરફેક્ટ કર્યો
const SYSTEM_INSTRUCTION = "તારું નામ miten.ai છે. તું એક અત્યંત બુદ્ધિશાળી અને આધુનિક AI છે. નિયમ: જો યુઝર ગુજરાતીમાં પ્રશ્ન પૂછે, તો તારે માત્ર ને માત્ર શુદ્ધ ગુજરાતીમાં જ સચોટ જવાબ આપવો. જો યુઝર ઇંગ્લિશમાં પૂછે, તો માત્ર પરફેક્ટ પ્રોફેશનલ ઇંગ્લિશમાં જ જવાબ આપવો. ભાષા મિક્સ (ગુજલિશ) ન કરવી. જવાબો માર્કડાઉન ફોર્મેટમાં અને આકર્ષક હોવા જોઈએ.";

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// મુખ્ય ચેટ એપીઆઈ
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history, image } = req.body;
        
        let contents = [];
        
        // જૂની હિસ્ટ્રી ફોર્મેટ સેટિંગ (ગ્લીચ વગર)
        if (history && history.length > 0) {
            contents = history.map(item => ({
                role: item.role === 'user' ? 'user' : 'model',
                parts: [{ text: item.text }]
            }));
        }

        // નવો મેસેજ પાર્ટ
        let currentParts = [{ text: message || "Analyze this image" }];

        // જો ઈમેજ મોકલી હોય તો
        if (image) {
            const base64Data = image.split(',')[1];
            const mimeType = image.split(',')[0].split(':')[1].split(';')[0];
            currentParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            });
        }

        contents.push({ role: 'user', parts: currentParts });

        // Gemini API કોલ
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });

        if (!response || !response.text) {
            throw new Error("Invalid API Response");
        }

        res.json({ reply: response.text });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.json({ reply: "Sorry, I encountered an issue analyzing that request. Please try again with clear text or proper format." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Miten.ai Server live on http://localhost:${PORT}`));