import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle.jsx'

export default function Navbar() {
	const location = useLocation()
	const navigate = useNavigate()
	const [query, setQuery] = useState('')

	useEffect(() => {
		setQuery('')
	}, [location.pathname])

	return (
		<header className="fixed top-0 left-0 right-0 z-50">
			<div className="backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-700/60">
				<div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-5xl h-16 flex items-center justify-between">
					<Link to="/" className="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm sm:text-base hover:bg-slate-100 dark:hover:bg-slate-800 transition">
						<span>Список новостей</span>
					</Link>
					<nav className="flex items-center gap-2">
						<Link to="/settings" className="p-2 rounded-md border border-blue-500/40 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 transition" title="Настройки">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-gear-fill" viewBox="0 0 16 16">
							<path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
							</svg>
						</Link>
						<ThemeToggle />
					</nav>
				</div>
			</div>
		</header>
	)
} 