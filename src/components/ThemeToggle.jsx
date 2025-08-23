import { useEffect, useState } from 'react'
import { SunFill, MoonStarsFill } from 'react-bootstrap-icons'

export default function ThemeToggle() {
	const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

	useEffect(() => {
		if (theme === 'dark') {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
		localStorage.setItem('theme', theme)
	}, [theme])

	return (
		<button
			className="p-2 rounded-md border border-blue-500/40 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 transition"
			onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
			title={theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
		>
			{theme === 'dark' ? (
				<SunFill size={16} />
			) : (
				<MoonStarsFill size={16} />
			)}
		</button>
	)
}