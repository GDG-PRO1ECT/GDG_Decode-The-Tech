import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useAdminAuth(quizCode) {
  const router = useRouter();

  const handleUnauthorized = useCallback(() => {
    sessionStorage.removeItem(`admin_pass_${quizCode}`);
    alert("Session Expired or Unauthorized. Please log in again.");
    window.location.reload();
  }, [quizCode]);

  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const adminPass = sessionStorage.getItem(`admin_pass_${quizCode}`) || '';
    
    if (!adminPass) {
      handleUnauthorized();
      return null;
    }

    const headers = {
      ...options.headers,
      'x-admin-password': adminPass,
    };

    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        handleUnauthorized();
        return null; // Return null so caller knows it failed auth
      }
      return res;
    } catch (err) {
      console.error("Network error during authenticated fetch:", err);
      throw err;
    }
  }, [quizCode, handleUnauthorized]);

  return { authenticatedFetch, handleUnauthorized };
}
