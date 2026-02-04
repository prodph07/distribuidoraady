"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export type EventType =
    | 'page_view'
    | 'add_to_cart'
    | 'checkout_start'
    | 'order_complete'
    | 'whatsapp_click'
    | 'search'
    | 'product_view';

export function useAnalytics() {
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        // Initialize Session ID
        let sid = localStorage.getItem('analytics_session_id');
        if (!sid) {
            sid = uuidv4();
            localStorage.setItem('analytics_session_id', sid);
        }
        setSessionId(sid);
    }, []);

    const trackEvent = async (eventType: EventType, metadata: Record<string, any> = {}) => {
        if (!sessionId) return; // Wait for session initialization

        try {
            const { error } = await supabase.from('analytics_events').insert({
                session_id: sessionId,
                event_type: eventType,
                page_path: window.location.pathname,
                metadata: metadata
            });

            if (error) {
                console.error('Supabase Analytics Error:', error);
            }
        } catch (error) {
            console.error('Failed to track event (Exception):', error);
        }
    };

    return { trackEvent, sessionId };
}
