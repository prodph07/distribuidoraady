"use client";

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

export function AnalyticsProvider() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { trackEvent, sessionId } = useAnalytics();

    // Use a ref to prevent double tracking in Strict Mode,
    // though for page views simple useEffect dependency on pathname is usually enough.
    // We want to track every route change.

    useEffect(() => {
        if (sessionId) {
            // Track page view
            trackEvent('page_view', {
                search_params: searchParams.toString()
            });
        }
    }, [pathname, searchParams, sessionId]); // Re-run when path/params change

    return null;
}
