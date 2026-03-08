const Meeting = require('../models/Meeting');
const Canvas = require('../models/Canvas');

// --- SERVER-SIDE MEMORY ---
// 1. History Stack (Stores the sequence of drawing operations)
// Structure: { "meetingId": [op1, op2, op3...] }
const liveCanvasHistory = {}; 

// 2. Redo Stack (Stores undone operations for Redo)
// Structure: { "meetingId": [op3, op2...] }
const redoStack = {};

// 3. Latest Canvas State (Full elements array)
// Structure: { "meetingId": [elements...] }
const liveCanvasState = {};

// Auto-save timers for periodic canvas state persistence
const autoSaveTimers = {};

const canvasSocket = (io, socket) => {

    // Auto-save canvas state to DB (debounced, 30s after last change)
    const scheduleAutoSave = (meetingId) => {
        if (autoSaveTimers[meetingId]) clearTimeout(autoSaveTimers[meetingId]);
        autoSaveTimers[meetingId] = setTimeout(async () => {
            try {
                const elements = liveCanvasState[meetingId];
                if (!elements || elements.length === 0) return;
                const meeting = await Meeting.findById(meetingId);
                if (!meeting || !meeting.canvas) return;
                await Canvas.findByIdAndUpdate(meeting.canvas, { $set: { data: { elements } } });
                console.log(`💾 Auto-saved canvas for meeting ${meetingId} (${elements.length} elements)`);
            } catch (err) {
                console.error(`Auto-save failed for meeting ${meetingId}:`, err.message);
            }
            delete autoSaveTimers[meetingId];
        }, 30000);
    };

    // =================================================================
    // 1. GENERIC CANVAS OPERATION (Draw, Text, Shape, etc.)
    // =================================================================
    socket.on('canvas_operation', (data) => {
        // data: { meetingId, op: { type: "line"|"rect", ... } }
        const { meetingId, op } = data;
        const { userId, username } = socket.userData || {};

        if (!userId || !meetingId || !op) return;

        try {
            // --- A. PREPARE GENERIC PAYLOAD ---
            const genericOperation = {
                ...op,              // Pass through frontend data exactly
                userId: userId,     // Tag author
                username: username, // Tag author name
                timestamp: Date.now(),
                id: `${socket.id}-${Date.now()}` // Unique ID
            };

            // --- B. UPDATE HISTORY (RAM) ---
            if (!liveCanvasHistory[meetingId]) {
                liveCanvasHistory[meetingId] = [];
            }
            liveCanvasHistory[meetingId].push(genericOperation);

            // --- C. CLEAR REDO STACK ---
            // If you draw something new, you cannot "Redo" old actions anymore
            if (redoStack[meetingId]) {
                redoStack[meetingId] = [];
            }

            // --- D. BROADCAST TO OTHERS ---
            socket.to(meetingId).emit('canvas_operation', genericOperation);

        } catch (error) {
            console.error('Canvas Op Error:', error);
        }
    });

    // =================================================================
    // 2. UNDO OPERATION
    // =================================================================
    socket.on('canvas_undo', (meetingId) => {
        if (!liveCanvasHistory[meetingId] || liveCanvasHistory[meetingId].length === 0) return;

        // 1. Initialize Redo Stack if needed
        if (!redoStack[meetingId]) {
            redoStack[meetingId] = [];
        }

        // 2. Pop from History
        const lastOp = liveCanvasHistory[meetingId].pop();

        // 3. Push to Redo Stack
        redoStack[meetingId].push(lastOp);

        // 4. Broadcast Refresh (Send updated history to sync everyone)
        io.to(meetingId).emit('canvas_refresh', liveCanvasHistory[meetingId]);
    });

    // =================================================================
    // 3. REDO OPERATION
    // =================================================================
    socket.on('canvas_redo', (meetingId) => {
        if (!redoStack[meetingId] || redoStack[meetingId].length === 0) return;

        // 1. Pop from Redo Stack
        const opToRedo = redoStack[meetingId].pop();

        // 2. Push back to History
        liveCanvasHistory[meetingId].push(opToRedo);

        // 3. Broadcast Refresh
        io.to(meetingId).emit('canvas_refresh', liveCanvasHistory[meetingId]);
    });

    // =================================================================
    // 4. HISTORY SYNC (For Late Joiners / Reload)
    // =================================================================
    socket.on('request_canvas_history', (meetingId) => {
        const history = liveCanvasHistory[meetingId] || [];
        // Send only to the requesting user
        socket.emit('load_canvas_history', history);
    });

    // =================================================================
    // 5. CLEAR BOARD
    // =================================================================
    socket.on('canvas_clear', (meetingId) => {
        // 1. Clear History
        liveCanvasHistory[meetingId] = [];
        
        // 2. Clear Redo Stack
        redoStack[meetingId] = [];
        
        // 3. Broadcast Clear
        io.to(meetingId).emit('canvas_clear');
    });

    // =================================================================
    // 5B. FULL STATE SYNC (Realtime)
    // =================================================================
    socket.on('canvas_state_updated', (data) => {
        const { meetingId, elements } = data || {};
        if (!meetingId || !Array.isArray(elements)) return;
        liveCanvasState[meetingId] = elements;
        socket.to(meetingId).emit('canvas_state_updated', { elements });
        scheduleAutoSave(meetingId);
    });

    socket.on('request_canvas_state', async (data) => {
        const meetingId = typeof data === 'string' ? data : data?.meetingId;
        if (!meetingId) return;
        // If we have in-memory state, use it
        if (liveCanvasState[meetingId] && liveCanvasState[meetingId].length > 0) {
            socket.emit('canvas_state_snapshot', {
                elements: liveCanvasState[meetingId]
            });
            return;
        }
        // Fall back to DB (server restart or first joiner)
        try {
            const meeting = await Meeting.findById(meetingId);
            if (meeting?.canvas) {
                const canvas = await Canvas.findById(meeting.canvas);
                const savedElements = canvas?.data?.elements || (Array.isArray(canvas?.data) ? canvas.data : null);
                if (savedElements && savedElements.length > 0) {
                    liveCanvasState[meetingId] = savedElements;
                    socket.emit('canvas_state_snapshot', { elements: savedElements });
                    return;
                }
            }
        } catch (err) {
            console.error('Failed to load canvas from DB:', err.message);
        }
        socket.emit('canvas_state_snapshot', { elements: [] });
    });

    // =================================================================
    // 6. END MEETING (SAVE TO DB)
    // =================================================================
    socket.on('meeting_ended', async () => {
        // 1. GET MEETING ID FROM SOCKET SESSION (Zero Payload)
        const { meetingId } = socket.userData || {};

        if (!meetingId) {
            console.error("Error: No meetingId found in socket session.");
            return;
        }

        console.log(`Ending Meeting: ${meetingId}...`);

        try {
            // 2. FIND THE MEETING TO GET THE CANVAS ID
            const meeting = await Meeting.findById(meetingId);
            
            if (!meeting) {
                console.error("Meeting not found in DB!");
                return;
            }

            // 3. EXTRACT CANVAS ID FROM MEETING DOCUMENT
            const canvasId = meeting.canvas; // ObjectId ref

            // 4. GET FINAL DATA FROM RAM (Using liveCanvasHistory)
            const finalHistory = liveCanvasHistory[meetingId] || [];
            const finalElements = liveCanvasState[meetingId] || [];

            // 5. UPDATE CANVAS DOCUMENT
            if (canvasId) {
                const updateData = { data: finalHistory };
                if (finalElements.length > 0) {
                    updateData.data = { elements: finalElements, history: finalHistory };
                }
                await Canvas.findByIdAndUpdate(
                    canvasId,
                    { $set: updateData },
                    { new: true }
                );
                console.log(`Canvas ${canvasId} saved with ${finalElements.length} elements and ${finalHistory.length} operations.`);
            }

            // 6. CLOSE THE MEETING
            meeting.endTime = new Date();
            // meeting.status = 'completed'; // Uncomment if needed
            await meeting.save();

            // 7. CLEANUP RAM
            delete liveCanvasHistory[meetingId];
            delete redoStack[meetingId];
            delete liveCanvasState[meetingId];
            if (autoSaveTimers[meetingId]) {
                clearTimeout(autoSaveTimers[meetingId]);
                delete autoSaveTimers[meetingId];
            }

            // 8. NOTIFY CLIENTS
            io.to(meetingId).emit('meeting_ended_client');

        } catch (error) {
            console.error("End Meeting Error:", error);
            io.to(meetingId).emit('meeting_ended_client');
        }
    });
};

module.exports = { canvasSocket };