import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/exam", async (req, res) => {
    try {
        // ----------------------------
        // CONFIG (with defaults)
        // ----------------------------
        const subject = req.body.subject || "math";
        const grade = req.body.grade || "9";
        const total = Number(req.body.total || 20);
        const explain = Boolean(req.body.explain);
        const diff = req.body.diff || "olimpiad level";
        const model = req.body.model || "gemini-2.5-flash";
        const key = req.body.key;

        const ai = new GoogleGenAI({
            apiKey: key,
        });

        const prompt = `
        Generate EXACTLY ${total} ${subject} questions.

        Rules:
        - Multiple choice (A–D)
        - Only ONE correct answer
        - Difficulty: ${diff}
        ${explain ? "- Provide a clear explanation for the correct answer" : ""}
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            question: { type: "string" },
                            A: { type: "string" },
                            B: { type: "string" },
                            C: { type: "string" },
                            D: { type: "string" },
                            CorrectAnswer: {
                                type: "string",
                                enum: ["A", "B", "C", "D"]
                            },
                            Explanation: { type: "string" }
                        },
                        required: [
                            "question",
                            "A",
                            "B",
                            "C",
                            "D",
                            "CorrectAnswer",
                            "Explanation"
                        ]
                    }
                }
            }
        });

        const parsed = JSON.parse(response.text);
        res.json({ questions: parsed.slice(0, total) });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
