import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = "તારું નામ miten.ai છે. તું એક પ્રોફેસનલ સ્માર્ટ AI આસિસ્ટન્ટ છે. નિયમ: જો યુઝર ગુજરાતીમાં પૂછે તો માત્ર શુદ્ધ ગુજરાતી અને ઇંગ્લિશમાં પૂછે તો માત્ર પ્રોફેશનલ ઇંગ્લિશમાં જ આન્સર આપવો. ભાષા મિક્સ ન કરવી.";

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// મુખ્ય ઇન્ટેલિજન્સ એપીઆઈ નોડ
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history, image, mode } = req.body;

        // જો ઈમેજ જનરેશન મોડ એક્ટિવ હોય
        if (mode === 'image-gen') {
            const imagePrompt = message || "A beautiful futuristic digital art";
            
            // Imagen 3 મોડલનો ઉપયોગ કરીને ઈમેજ જનરેટ કરવી
            const imagenResponse = await ai.models.generateImages({
                model: 'imagen-3.0-generate-002',
                prompt: imagePrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            });

            const generatedImgBase64 = imagenResponse.generatedImages[0].image.imageBytes;
            return res.json({ 
                reply: `### 🎨 Generated Artwork\nHere is your custom intelligence generation for prompt: *"${imagePrompt}"*`, 
                generatedImage: `data:image/jpeg;base64,${generatedImgBase64}` 
            });
        }

        // નોર્મલ ચેટ મોડ
        let contents = [];
        if (history && history.length > 0) {
            contents = history.map(item => ({
                role: item.role === 'user' ? 'user' : 'model',
                parts: [{ text: item.text }]
            }));
        }

        let currentParts = [{ text: message || "Analyze attached layer context." }];
        if (image) {
            const base64Data = image.split(',')[1];
            const mimeType = image.split(',')[0].split(':')[1].split(';')[0];
            currentParts.push({ inlineData: { data: base64Data, mimeType: mimeType } });
        }

        contents.push({ role: 'user', parts: currentParts });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error("Core Processing Error:", error);
        res.json({ reply: "I encountered an error synchronizing with the AI core. Please check your data layout or prompt structure." });
    }
});

app.post('/api/clear', (req, res) => {
    res.json({ status: "success" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Secure Server Node running on http://localhost:${PORT}`));