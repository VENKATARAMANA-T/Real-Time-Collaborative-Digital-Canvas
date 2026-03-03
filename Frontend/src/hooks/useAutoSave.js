import { useState, useEffect, useRef, useCallback } from 'react';
import { canvasAPI } from '../services/api';

/**
 * useAutoSave — Autosave hook for canvas data
 *
 * Debounces canvas data changes and saves to the server automatically.
 * Returns saving status for UI feedback.
 *
 * @param {string} canvasId - The canvas ID to autosave
 * @param {Object} canvasData - Current canvas data (elements, pixelData, etc.)
 * @param {string} thumbnail - Current canvas thumbnail (base64 or URL)
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Debounce interval in ms (default: 30000)
 * @param {boolean} options.enabled - Whether autosave is enabled (default: true)
 * @returns {{ isSaving: boolean, lastSavedAt: Date|null, error: string|null, triggerSave: Function }}
 */
const useAutoSave = (canvasId, canvasData, thumbnail, options = {}) => {
    const { interval = 30000, enabled = true } = options;

    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [error, setError] = useState(null);

    const timerRef = useRef(null);
    const lastSavedDataRef = useRef(null);
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    // Perform the actual save
    const performSave = useCallback(async (data, thumb) => {
        if (!canvasId || !data) return;

        setIsSaving(true);
        setError(null);

        try {
            await canvasAPI.autosave(canvasId, {
                data: data,
                thumbnail: thumb || '',
            });

            if (isMountedRef.current) {
                const now = new Date();
                setLastSavedAt(now);
                lastSavedDataRef.current = JSON.stringify(data);
            }
        } catch (err) {
            if (isMountedRef.current) {
                setError(err.response?.data?.message || 'Autosave failed');
                console.error('[AutoSave] Failed:', err.message);
            }
        } finally {
            if (isMountedRef.current) {
                setIsSaving(false);
            }
        }
    }, [canvasId]);

    // Debounced autosave on data change
    useEffect(() => {
        if (!enabled || !canvasId || !canvasData) return;

        // Check if data actually changed
        const currentDataStr = JSON.stringify(canvasData);
        if (currentDataStr === lastSavedDataRef.current) return;

        // Clear existing timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Set new debounce timer
        timerRef.current = setTimeout(() => {
            performSave(canvasData, thumbnail);
        }, interval);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [canvasData, thumbnail, canvasId, interval, enabled, performSave]);

    // Manual trigger for immediate save
    const triggerSave = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        performSave(canvasData, thumbnail);
    }, [canvasData, thumbnail, performSave]);

    return { isSaving, lastSavedAt, error, triggerSave };
};

export default useAutoSave;
