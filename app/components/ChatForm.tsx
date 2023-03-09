'use client';
import { ChatGPTMessage } from '@/app/api/chat/route';
import useIntersectionObserver from '@react-hook/intersection-observer';
import { FC, useRef, useState } from 'react';
import useSWR from 'swr';

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
  element.download = `chatgpt-${Date.now()}.txt`;
  document.body.appendChild(element); // required for this to work in FireFox
  element.click();
}


export const ChatForm: FC = () => {
  const [messages, setMessages] = useState<ChatGPTMessage[]>([]);

  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [models, setModels] = useState<ModelType[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('gpt-3.5-turbo');

  const bottomLine = useRef<HTMLDivElement>(null);

  const { isIntersecting } = useIntersectionObserver(bottomLine)

  const handleEnter = (
    e: React.KeyboardEvent<HTMLTextAreaElement> &
      React.FormEvent<HTMLFormElement>
  ) => {
    if (e.key === 'Enter' && isLoading === false) {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userInput) {
      return;
    }
    setUserInput("")
    setIsLoading(true);

    let newMessages: ChatGPTMessage[] = [...messages, {
      role: "user",
      content: userInput
    }]

    setMessages(newMessages);
    setTimeout(() => scrollToBottom(), 100)

    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: newMessages,
      }),
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
      newMessages
      if (isFirst) {
        newMessages = [...newMessages, { role: "assistant", content: currentResponse }]
      } else {
        newMessages = [...newMessages.slice(0, -1), { role: "assistant", content: currentResponse }]
      }
      setMessages(newMessages)
      scrollToBottom()

      if (done) break
    }
    // breaks text indent on refresh due to streaming
    localStorage.setItem('messages', JSON.stringify(newMessages));
    setIsLoading(false);
  };

  const handleReset = () => {
    localStorage.removeItem('messages');
    setMessages([]);
  };
  const handleExport = () => {
    downloadTxtFile(messages.map(i => i.content).join("\n------------------------------\n"))
  }

  useSWR('fetchingMessages', async () => {
    const storedMessages = localStorage.getItem('messages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
      setTimeout(() => scrollToBottom(true), 100)
    }
  });

  const fetcher = async () => {
    const models = await (await fetch('/api/models')).json();
    setModels(models.data);
    const modelIndex = models.data.findIndex(
      (model: ModelType) => model.id === 'gpt-3.5-turbo'
    );
    setCurrentModel(models.data[modelIndex].id);
    return models;
  };

  useSWR('fetchingModels', fetcher);


  return (
    <div className='flex justify-center'>
      <button
        onClick={handleReset}
        type='reset'
        className='fixed top-5 left-5 w-48 p-4 rounded-md bg-white text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-900 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent'
        disabled={isLoading}
      >
        Clear Conversation
      </button>
      <button
        onClick={handleExport}
        type='reset'
        className='fixed top-5 right-5 w-48 p-4 rounded-md bg-white text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-900 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent'
        disabled={isLoading || messages.length == 0}

      >
        Export Text
      </button>

      <div className='w-full mx-2 flex flex-col items-start gap-3 pt-6 md:mx-auto md:max-w-3xl mt-20'>
        {messages.map((i, idx) => {
          if (i.role == "user") {
            return <div key={idx} className={'bg-blue-500 p-3 rounded-lg'}            >
              <p style={{ whiteSpace: "pre-wrap" }}>{i.content}</p>
            </div>
          }
          if (i.role == "assistant") {
            return <div key={idx} className={'bg-gray-500 p-3 rounded-lg'}            >
              <p style={{ whiteSpace: "pre-wrap" }}>{i.content}</p>
            </div>
          }
          return null
        })}
        <div ref={bottomLine} className='w-full h-20'></div>

      </div>
      <form
        onSubmit={handleSubmit}
        className='fixed bottom-0 w-full md:max-w-3xl bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)]'
      >
        <textarea
          name='Message'
          placeholder='Type your query'
          value={userInput}
          onChange={(evt) => setUserInput(evt.target.value)}
          onKeyDown={handleEnter}
          className='w-full resize-none bg-transparent outline-none pt-4 pl-4 translate-y-1'
        />
        <button
          disabled={isLoading}
          type='submit'
          className='absolute top-[1.4rem] right-5 p-1 rounded-md text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-900 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent'
        >
          <svg
            stroke='currentColor'
            fill='currentColor'
            strokeWidth='0'
            viewBox='0 0 20 20'
            className='h-4 w-4 rotate-90'
            height='1em'
            width='1em'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
          </svg>
        </button>
      </form>
    </div>
  );
};

