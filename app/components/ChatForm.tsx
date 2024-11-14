'use client';
import { Alert, AppBar, IconButton, InputBase, Paper, Snackbar, Toolbar, Typography } from '@mui/material';
import useIntersectionObserver from '@react-hook/intersection-observer';
import { FC, useRef, useState } from 'react';
import useSWR from 'swr';
import SendIcon from '@mui/icons-material/Send';
import { ChatGPTMessage, UserType } from '../types';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import { SettingsDialog } from './SettingsDialog';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { getLocalSettings } from '../utils/settings';

interface ModelType {
  object: 'engine';
  id: string;
  ready: boolean;
  owner: string;
  permissions: null;
  created: string;
}

const downloadTxtFile = (txt: string) => {
  const element = document.createElement("a");
  const file = new Blob([txt], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.style.display = "none"
  element.download = `conversation-${Date.now()}.txt`;
  document.body.appendChild(element); // required for this to work in FireFox
  element.click();
}


export const ChatForm: FC = () => {
  const [messageList, setMessageList] = useState<ChatGPTMessage[]>([]);

  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const settings = getLocalSettings()

  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);
  const [alertContent, setAlertContent] = useState<string>("");

  const showAlert = (msg: string) => {
    setAlertContent(msg)
    setIsAlertOpen(true)
  }

  const [showSettingDialog, setShowSettingDialog] = useState<boolean>(false);


  const bottomLine = useRef<HTMLDivElement>(null);

  const { isIntersecting } = useIntersectionObserver(bottomLine)

  const handleEnter = (
    e: React.KeyboardEvent<HTMLTextAreaElement> &
      React.FormEvent<HTMLFormElement>
  ) => {
    // use meta+enter/ctrl+enter to submit
    if (!isLoading && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  const scrollToBottom = (always = false) => {
    if (bottomLine && bottomLine.current) {
      if (always || isIntersecting)
        bottomLine.current.scrollIntoView(false);
    }
  }
  // useResizeObserver(document.body, () => scrollToBottom(true))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userInput) {
      return;
    }

    let currMessageList: ChatGPTMessage[] = [...messageList, {
      role: "user",
      content: userInput
    }]

    const userType = localStorage.getItem('userType') as UserType


    if (userType != UserType.admin && settings.isConversation && currMessageList.map(i => i.content.length).reduce((i, j) => i + j, 0) > 2000) {
      showAlert("Current conversation has too many tokens(>2000), please close conversation mode or click \"Clear\" button to start a new conversation")
      return
    }

    setUserInput("")
    setIsLoading(true);


    setMessageList(currMessageList);
    setTimeout(() => scrollToBottom(), 100)

    const messages = settings.isConversation ? currMessageList : currMessageList.slice(-1)

    if (settings.systemMessage) {
      messages.unshift({ role: 'system', content: settings.systemMessage })
    }
    const resp = await fetch('/api/chat2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      throw new Error(resp.statusText);
    }

    const data = resp.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();

    let currentResponse = "";
    while (true) {
      const { value, done } = await reader.read();
      const isFirst = !currentResponse
      currentResponse += decoder.decode(value);
      currMessageList
      if (isFirst) {
        currMessageList = [...currMessageList, { role: "assistant", content: currentResponse }]
      } else {
        currMessageList = [...currMessageList.slice(0, -1), { role: "assistant", content: currentResponse }]
      }
      setMessageList(currMessageList)
      scrollToBottom()

      if (done) break
    }
    // breaks text indent on refresh due to streaming
    localStorage.setItem('messages', JSON.stringify(currMessageList));
    setIsLoading(false);
  };

  const handleReset = () => {
    localStorage.removeItem('messages');
    setMessageList([]);
  };
  const handleExport = () => {
    downloadTxtFile(messageList.map(i => `${i.role}:\n${i.content}`).join("\n------------------------------\n"))
  }

  useSWR('fetchingMessages', async () => {
    const storedMessages = localStorage.getItem('messages');
    if (storedMessages) {
      setMessageList(JSON.parse(storedMessages));
      setTimeout(() => scrollToBottom(true), 100)
    }
  });




  return (
    <div className='flex justify-center'>

      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ChatGPT
          </Typography>

          <IconButton
            size="large"
            edge="start"
            color="inherit"
            sx={{ ml: 1 }}
            disabled={isLoading}
            onClick={handleReset}

          >
            <DeleteIcon />
          </IconButton>

          <IconButton
            size="large"
            edge="start"
            color="inherit"
            sx={{ ml: 1 }}
            disabled={isLoading}
            onClick={handleExport}

          >
            <FileDownloadIcon />
          </IconButton>

          <IconButton
            size="large"
            edge="start"
            color="inherit"
            sx={{ ml: 1 }}
            disabled={isLoading}
            onClick={() => setShowSettingDialog(true)}
          >
            <SettingsIcon />
          </IconButton>

        </Toolbar>
      </AppBar>


      <div className='w-full mx-2 flex flex-col items-start gap-3 md:mx-auto md:max-w-3xl mt-20'>
        {messageList.map((i, idx) => {
          if (i.role == "user") {
            return <div key={idx} className={'bg-blue-300 dark:bg-blue-500 p-3 rounded-lg'}>
              <p style={{ whiteSpace: "pre-wrap" }}>{i.content}</p>
            </div>
          }
          if (i.role == "assistant") {
            return <div key={idx} className={'bg-gray-300 dark:bg-gray-500 p-3 rounded-lg'}>
              <p style={{ whiteSpace: "pre-wrap" }}>{i.content}</p>
            </div>
          }
          return null
        })}
        <div ref={bottomLine} className='w-full h-20'></div>

      </div>


      <Paper
        component="form"
        className='fixed bottom-0 w-full md:max-w-3xl p-3 '
        sx={{ display: 'flex', alignItems: 'center' }}
        elevation={3}
        onSubmit={handleSubmit}
      >
        <InputBase
          className='max-h-40 overflow-y-auto'
          sx={{ ml: 1, flex: 1 }}
          placeholder="Type your query, use enter to submit, shift + enter to start a new line"
          multiline
          value={userInput}
          onChange={(evt) => setUserInput(evt.target.value)}
          onKeyDown={handleEnter}
        />
        <IconButton
          className='p-4'
          type='submit'
          disabled={isLoading}
        >
          <SendIcon />
        </IconButton>
      </Paper>
      <Snackbar open={isAlertOpen} autoHideDuration={6000} onClose={() => setIsAlertOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setIsAlertOpen(false)} severity="error" sx={{ width: '100%' }}>
          {alertContent}
        </Alert>
      </Snackbar>

      <SettingsDialog open={showSettingDialog} onClose={() => setShowSettingDialog(false)} />
    </div>
  );
};

