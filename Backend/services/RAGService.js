const { Groq } = require("groq-sdk");
const { pipeline } = require("@xenova/transformers");
const fs = require('fs');
const path = require('path');

class RAGService {
    constructor() {
        if (!process.env.GROQ_API_KEY) {
            console.warn('WARNING: GROQ_API_KEY is not set in environment variables. Bot will not work.');
            console.warn('Please set GROQ_API_KEY in your .env file. Get one from: https://console.groq.com');
            this.groq = null;
        } else {
            this.groq = new Groq({
                apiKey: process.env.GROQ_API_KEY,
            });
        }
        this.knowledgeBase = [];
        this.embeddings = null;
        this.extractor = null;
        this.kbVectors = [];
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        console.log("Initializing RAG Service...");

        // 1. Load Knowledge Base
        const kbPath = path.join(__dirname, '../data/knowledge_base.json');
        if (fs.existsSync(kbPath)) {
            const data = fs.readFileSync(kbPath, 'utf8');
            this.knowledgeBase = JSON.parse(data);
        }

        // 2. Load Feature Extractor (Local Embeddings)
        this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

        // 3. Pre-compute vector embeddings for Knowledge Base
        for (const item of this.knowledgeBase) {
            const vector = await this.getEmbedding(`${item.question} ${item.answer}`);
            this.kbVectors.push({ ...item, vector });
        }

        this.isInitialized = true;
        console.log("RAG Service Initialized.");
    }

    async getEmbedding(text) {
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    async getContext(query) {
        const queryVector = await this.getEmbedding(query);
        const similarities = this.kbVectors.map(item => ({
            ...item,
            similarity: this.cosineSimilarity(queryVector, item.vector)
        }));

        // Sort by similarity and get top 3
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3)
            .map(item => `Q: ${item.question}\nA: ${item.answer}`)
            .join("\n\n");
    }

    async chatStream(userMessage, contextSnapshot, res) {
        if (!this.isInitialized) await this.initialize();

        // Check if API key is set
        if (!process.env.GROQ_API_KEY) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            const errorMsg = "I apologize, but the AI bot is not configured. Please ask your administrator to set up the GROQ_API_KEY in the .env file.";
            res.write(`data: ${JSON.stringify({ content: errorMsg, error: true })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
            return;
        }

        try {
            const ragContext = await this.getContext(userMessage);

            const canvasW = contextSnapshot?.canvasSize?.width  || 1920;
            const canvasH = contextSnapshot?.canvasSize?.height || 1080;
            const systemPrompt = `You are an AI Agent controlling a digital canvas. When the user asks to draw or modify anything, you MUST include [ACTION: ...] tags in your response. Tags are machine-parsed and invisible to the user.

CANVAS: ${canvasW}x${canvasH}px. Center zone: x ${Math.round(canvasW*0.25)}-${Math.round(canvasW*0.75)}, y ${Math.round(canvasH*0.2)}-${Math.round(canvasH*0.7)}.

RULES:
- ALWAYS include [ACTION: {...}] tags when the user wants to draw, change tools, undo, etc.
- You can emit MULTIPLE ACTION tags in sequence - they execute in order. Use this for multi-step requests.
- Write a short friendly sentence first, then the action tags at the end.
- Never echo the canvas_state or knowledge blocks.
- Use real hex colors and numbers, never placeholders.
- When the user says to MODIFY existing shapes (resize, recolor, reshape): use MODIFY_SHAPES with their IDs from canvas_state.elements — do NOT draw new shapes.
- When the user refers to "the squares", "the circles", "both shapes" etc., look at canvas_state.elements, find the matching elements, and put their ids in a MODIFY_SHAPES action.

FILL vs OUTLINE:
- fill: "#hex"        -> filled shape (solid color inside)
- fill: "transparent" -> outline only (just the border, no fill inside)
- stroke: "#hex"      -> border/outline color
- For a "round black circle" outline: fill:"transparent", stroke:"#000000"
- For a "solid black circle": fill:"#000000", stroke:"#000000"

ACTION TYPES:
DRAW_SHAPE:    {"type":"DRAW_SHAPE","shape":"rect|circle|triangle|line|star|pentagon|hexagon|callout|arrow|rhombus","x":N,"y":N,"width":N,"height":N,"fill":"#hex or transparent","stroke":"#hex","strokeWidth":N}
DRAW_MULTIPLE: {"type":"DRAW_MULTIPLE","shapes":[...array of shape objects...]}
ARRANGE_GRID:  {"type":"ARRANGE_GRID","shape":"rect","rows":N,"cols":N,"x":N,"y":N,"width":N,"height":N,"colSpacing":N,"rowSpacing":N,"fill":"#hex","stroke":"#hex"}
ADD_TEXT:      {"type":"ADD_TEXT","text":"...","x":N,"y":N,"fontSize":N,"fontFamily":"Arial","color":"#hex"}
FILL_BACKGROUND: {"type":"FILL_BACKGROUND","color":"#hex"}
CLEAR_CANVAS:  {"type":"CLEAR_CANVAS"}
CHANGE_TOOL:   {"type":"CHANGE_TOOL","tool":"pencil|brush|eraser|text|select"}
CHANGE_COLOR:  {"type":"CHANGE_COLOR","color":"#hex"}
SET_STROKE_WIDTH: {"type":"SET_STROKE_WIDTH","width":N}
SET_FILL_MODE: {"type":"SET_FILL_MODE","enabled":true|false}
SET_ZOOM:      {"type":"SET_ZOOM","zoom":N}
UNDO:          {"type":"UNDO"}
REDO:          {"type":"REDO"}
DELETE_SELECTED: {"type":"DELETE_SELECTED"}
DUPLICATE_SELECTED: {"type":"DUPLICATE_SELECTED","offsetX":N,"offsetY":N}
MOVE_SELECTED: {"type":"MOVE_SELECTED","dx":N,"dy":N}
RESIZE_SELECTED:  {"type":"RESIZE_SELECTED","width":N,"height":N}
MODIFY_SHAPES:    {"type":"MODIFY_SHAPES","ids":[id1,id2,...],"width":N,"height":N,"fill":"#hex or transparent","stroke":"#hex","strokeWidth":N}
   - Use "ids" with ACTUAL element IDs from canvas_state.elements to target specific existing shapes.
   - OR use "matchType":"rect|circle|..." to modify ALL elements of that shape type.
   - Only include the properties you want to change (all optional except ids/matchType).

WHEN TO USE MULTIPLE TAGS:
- User says "alone", "standalone", "only", "just", "clean", "fresh", "start over" -> CLEAR_CANVAS first, then draw
- User wants shape on colored background -> FILL_BACKGROUND first, then DRAW_SHAPE
- "black circle on white" = CLEAR + FILL_BACKGROUND white + DRAW_SHAPE circle

<canvas_state>
${JSON.stringify(contextSnapshot)}
</canvas_state>

<knowledge>
${ragContext}
</knowledge>`;

            // Few-shot examples teaching multi-tag sequences + fill vs outline + separate fill/stroke colors
            const fewShotMessages = [
                { role: "user", content: "draw a red filled circle" },
                { role: "assistant", content: "Here's a solid red circle!\n\n[ACTION: {\"type\":\"DRAW_SHAPE\",\"shape\":\"circle\",\"x\":636,\"y\":269,\"width\":180,\"height\":180,\"fill\":\"#ef4444\",\"stroke\":\"#c53030\",\"strokeWidth\":2}]" },
                { role: "user", content: "draw a yellow circle with black border" },
                { role: "assistant", content: "Here's a yellow circle with a black border!\n\n[ACTION: {\"type\":\"DRAW_SHAPE\",\"shape\":\"circle\",\"x\":636,\"y\":219,\"width\":200,\"height\":200,\"fill\":\"#facc15\",\"stroke\":\"#000000\",\"strokeWidth\":4}]" },
                { role: "user", content: "draw just a black circle outline alone on white" },
                { role: "assistant", content: "Done! Cleared, white background, black circle outline.\n\n[ACTION: {\"type\":\"CLEAR_CANVAS\"}]\n[ACTION: {\"type\":\"FILL_BACKGROUND\",\"color\":\"#ffffff\"}]\n[ACTION: {\"type\":\"DRAW_SHAPE\",\"shape\":\"circle\",\"x\":586,\"y\":169,\"width\":200,\"height\":200,\"fill\":\"transparent\",\"stroke\":\"#000000\",\"strokeWidth\":3}]" },
                { role: "user", content: "draw a blue outlined square, no fill" },
                { role: "assistant", content: "Here's a blue outlined square with no fill!\n\n[ACTION: {\"type\":\"DRAW_SHAPE\",\"shape\":\"rect\",\"x\":636,\"y\":219,\"width\":200,\"height\":200,\"fill\":\"transparent\",\"stroke\":\"#3b82f6\",\"strokeWidth\":3}]" },
                { role: "user", content: "draw a house" },
                { role: "assistant", content: "I've drawn a simple house for you!\n\n[ACTION: {\"type\":\"DRAW_MULTIPLE\",\"shapes\":[{\"shape\":\"rect\",\"x\":500,\"y\":300,\"width\":250,\"height\":180,\"fill\":\"#f5e0c0\",\"stroke\":\"#8b6914\",\"strokeWidth\":2},{\"shape\":\"triangle\",\"x\":480,\"y\":200,\"width\":290,\"height\":120,\"fill\":\"#ef4444\",\"stroke\":\"#b91c1c\",\"strokeWidth\":2},{\"shape\":\"rect\",\"x\":593,\"y\":400,\"width\":60,\"height\":80,\"fill\":\"#8b6914\",\"stroke\":\"#5a3e0a\",\"strokeWidth\":2}]}]" },
                { role: "user", content: "undo that" },
                { role: "assistant", content: "Done! Undone.\n\n[ACTION: {\"type\":\"UNDO\"}]" },
                { role: "user",      content: "make the two squares as rectangle" },
                { role: "assistant", content: "Got it! I'll stretch both squares into wide rectangles using their IDs from the canvas.\n\n[ACTION: {\"type\":\"MODIFY_SHAPES\",\"ids\":[SQUARE_ID_1,SQUARE_ID_2],\"width\":260,\"height\":120}]" },
                { role: "user",      content: "the canvas has two red squares (ids 101 and 202) and a blue circle (id 303) — make both squares rectangles" },
                { role: "assistant", content: "Done! Both red squares are now rectangles.\n\n[ACTION: {\"type\":\"MODIFY_SHAPES\",\"ids\":[101,202],\"width\":260,\"height\":120}]" },
                { role: "user",      content: "change all circles to green" },
                { role: "assistant", content: "Done! All circles are now green.\n\n[ACTION: {\"type\":\"MODIFY_SHAPES\",\"matchType\":\"circle\",\"fill\":\"#22c55e\",\"stroke\":\"#16a34a\"}]" },
                { role: "user",      content: "create three rectangles with red color and a circle in the middle with blue color" },
                { role: "assistant", content: "Done! I've drawn three red rectangles with a single blue circle in the center between them.\n\n[ACTION: {\"type\":\"DRAW_MULTIPLE\",\"shapes\":[{\"shape\":\"rect\",\"x\":350,\"y\":320,\"width\":100,\"height\":60,\"fill\":\"#ef4444\",\"stroke\":\"#991b1b\",\"strokeWidth\":2},{\"shape\":\"rect\",\"x\":520,\"y\":320,\"width\":100,\"height\":60,\"fill\":\"#ef4444\",\"stroke\":\"#991b1b\",\"strokeWidth\":2},{\"shape\":\"circle\",\"x\":700,\"y\":300,\"width\":80,\"height\":80,\"fill\":\"#3b82f6\",\"stroke\":\"#1e40af\",\"strokeWidth\":2},{\"shape\":\"rect\",\"x\":850,\"y\":320,\"width\":100,\"height\":60,\"fill\":\"#ef4444\",\"stroke\":\"#991b1b\",\"strokeWidth\":2}]}]" },
                { role: "user",      content: "draw a circle-rectangle-rectangle-rectangle-circle pattern with blue and red" },
                { role: "assistant", content: "Done! I've drawn a circle at each end with three rectangles in between.\n\n[ACTION: {\"type\":\"DRAW_MULTIPLE\",\"shapes\":[{\"shape\":\"circle\",\"x\":250,\"y\":300,\"width\":100,\"height\":100,\"fill\":\"#3b82f6\",\"stroke\":\"#1e40af\",\"strokeWidth\":2},{\"shape\":\"rect\",\"x\":420,\"y\":320,\"width\":100,\"height\":60,\"fill\":\"#ef4444\",\"stroke\":\"#991b1b\",\"strokeWidth\":2},{\"shape\":\"rect\",\"x\":580,\"y\":320,\"width\":100,\"height\":60,\"fill\":\"#ef4444\",\"stroke\":\"#991b1b\",\"strokeWidth\":2},{\"shape\":\"rect\",\"x\":740,\"y\":320,\"width\":100,\"height\":60,\"fill\":\"#ef4444\",\"stroke\":\"#991b1b\",\"strokeWidth\":2},{\"shape\":\"circle\",\"x\":910,\"y\":300,\"width\":100,\"height\":100,\"fill\":\"#3b82f6\",\"stroke\":\"#1e40af\",\"strokeWidth\":2}]}]" },
            ];

            const stream = await this.groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    ...fewShotMessages,
                    { role: "user", content: userMessage }
                ],
                model: "llama-3.3-70b-versatile",
                stream: true,
            });

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
            }
            res.write('data: [DONE]\n\n');
            res.end();
        } catch (error) {
            console.error('Error in RAG chat stream:', error.message);
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            const errorMsg = `I encountered an error: ${error.message}. Please try again later or contact support if the issue persists.`;
            res.write(`data: ${JSON.stringify({ content: errorMsg, error: true })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
        }
    }
}

module.exports = new RAGService();
