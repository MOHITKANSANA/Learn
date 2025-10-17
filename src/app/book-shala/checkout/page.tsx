
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CheckoutRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        // This page is a general fallback. In a real app, you might check for a cart
        // in local storage and redirect to the cart page if it exists.
        // For now, we'll just redirect to the main book-shala page.
        router.replace('/book-shala');
    }, [router]);

    return null; // Render nothing while redirecting
}
