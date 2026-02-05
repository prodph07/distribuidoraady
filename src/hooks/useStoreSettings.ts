"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useStoreSettings() {
    const [isOpen, setIsOpen] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();

        // Real-time subscription
        const channel = supabase
            .channel('store_settings_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'store_settings'
                },
                (payload) => {
                    if (payload.new) {
                        setIsOpen(payload.new.is_open);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('store_settings')
                .select('is_open')
                .single();

            if (data) {
                setIsOpen(data.is_open);
            }
        } catch (error) {
            console.error('Error fetching store settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStoreStatus = async () => {
        try {
            const newValue = !isOpen;
            // Optimistic update
            setIsOpen(newValue);

            const { error } = await supabase
                .from('store_settings')
                .update({ is_open: newValue })
                // Assuming ID 1 is the main settings row
                .eq('id', 1);

            if (error) {
                console.error('Error updating store status:', error);
                // Revert on error
                setIsOpen(!newValue);
            }
        } catch (error) {
            console.error('Error in toggleStoreStatus:', error);
            setIsOpen(!isOpen); // Revert
        }
    };

    return { isOpen, loading, toggleStoreStatus };
}
