'use client';
import { Inter } from 'next/font/google';
import { useState } from 'react';
import { ChatForm } from './components/ChatForm';
import { Password } from './components/Password';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  const [pageType, setPageType] = useState<"Password" | "ChatForm">("Password")
  return (
    <main className={inter.className}>
      {pageType == "Password" && <Password onSuccess={() => setPageType("ChatForm")} />}
      {pageType == "ChatForm" && <ChatForm />}
    </main>
  );
}
