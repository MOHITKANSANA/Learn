
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page is now a redirector. 
// It checks if the user is enrolled and redirects them accordingly.
export default function CourseRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // The logic has been moved to the parent pages (courses/page.tsx and home).
    // This page is now largely redundant, but we'll keep it as a fallback 
    // to redirect users to the main courses page if they land here directly.
    router.replace('/courses');
  }, [router]);

  return null; // Render nothing as the redirect will happen.
}
