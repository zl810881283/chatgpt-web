'use client';
import { useMemo, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Inter } from 'next/font/google';
import { ChatForm } from './components/ChatForm';
import { Password } from './components/Password';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  const [pageType, setPageType] = useState<"Password" | "ChatForm">("Password")
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(
    () => createTheme({
      palette: {
        mode: prefersDarkMode ? 'dark' : 'light',
      },
    }),
    [prefersDarkMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main className={inter.className}>
        {pageType == "Password" && <Password onSuccess={() => setPageType("ChatForm")} />}
        {pageType == "ChatForm" && <ChatForm />}
      </main>
    </ThemeProvider>

  );
}
