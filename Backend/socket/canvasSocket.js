const Meeting = require('../models/Meeting');
const Canvas = require('../models/Canvas');

// --- SERVER-SIDE MEMORY ---
// 1. History Stack (Stores the sequence of drawing operations)
// Structure: { "meetingId": [op1, op2, op3...] }
const liveCanvasHistory = {}; 

// 2. Redo Stack (Stores undone operations for Redo)
// Structure: { "meetingId": [op3, op2...] }
const redoStack = {};

const canvasSocket = (io, socket) => {

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
            const meeting = await Meeting.findOne({ meetingId: meetingId });
            
            if (!meeting) {
                console.error("Meeting not found in DB!");
                return;
            }

            // 3. EXTRACT CANVAS ID FROM MEETING DOCUMENT
            const canvasId = meeting.canvas; // ObjectId ref

            // 4. GET FINAL DATA FROM RAM (Using liveCanvasHistory)
            const finalHistory = liveCanvasHistory[meetingId] || [];

            // 5. UPDATE CANVAS DOCUMENT
            if (canvasId) {
                await Canvas.findByIdAndUpdate(
                    canvasId,
                    { $set: { data: finalHistory } }, // Save the operations log
                    { new: true }
                );
                console.log(`Canvas ${canvasId} saved with ${finalHistory.length} operations.`);
            }

            // 6. CLOSE THE MEETING
            meeting.endTime = new Date();
            // meeting.status = 'completed'; // Uncomment if needed
            await meeting.save();

            // 7. CLEANUP RAM
            delete liveCanvasHistory[meetingId];
            delete redoStack[meetingId];

            // 8. NOTIFY CLIENTS
            io.to(meetingId).emit('meeting_ended_client');

        } catch (error) {
            console.error("End Meeting Error:", error);
            io.to(meetingId).emit('meeting_ended_client');
        }
    });
};

module.exports = { canvasSocket };