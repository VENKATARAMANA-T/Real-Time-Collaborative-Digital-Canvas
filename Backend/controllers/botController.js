const RAGService = require('../services/RAGService');

exports.getChatResponse = async (req, res) => {
    try {
        const { message, contextSnapshot } = req.body;
        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        await RAGService.chatStream(message, contextSnapshot, res);
    } catch (error) {
        console.error('Error in Bot Controller:', error);
        res.status(500).json({ message: 'Failed to get AI response' });
    }
};
