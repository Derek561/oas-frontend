'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './utils/supabaseClient';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) router.push('/dashboard');
      else router.push('/login');
    }
    checkUser();
  }, [router]);

  return null;
}
