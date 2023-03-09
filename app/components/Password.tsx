'use client';
import { FC, useState } from 'react';
import useSWR from 'swr';

type PasswordProps = {
	onSuccess?: () => void
}

const USER_PASSWORD = process.env.USER_PASSWORD ?? "ChatGPT"

export const Password: FC<PasswordProps> = ({ onSuccess }) => {
	const [userInput, setUserInput] = useState<string>('');
	const [passwordError, setPasswordError] = useState(false)

	useSWR('fetchingPassword', async () => {
		const storedPassword = localStorage.getItem('password');
		if (storedPassword) {
			chackPassword(storedPassword)
		}
	});

	const handleEnter = (
		e: React.KeyboardEvent<HTMLInputElement> &
			React.FormEvent<HTMLFormElement>
	) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		chackPassword(userInput)
	}

	const chackPassword = (password: string) => {
		if (password == USER_PASSWORD) {
			onSuccess?.()
			localStorage.setItem('password', password);
		} else {
			setPasswordError(true)
		}
	}

	return <form
		onSubmit={handleSubmit}
		className={'fixed bottom-0 top-0 left-0 right-0 m-auto h-16 max-w-sm bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)]' + (passwordError ? " border-red-500 border" : "")}
	>
		<input
			name='Message'
			placeholder='Input Password Here'
			type='password'
			value={userInput}
			onChange={(evt) => {
				setUserInput(evt.target.value)
				setPasswordError(false)
			}}
			onKeyDown={handleEnter}
			className='w-full resize-none bg-transparent outline-none pt-4 pl-4 translate-y-1'
		/>
		<button
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
}
