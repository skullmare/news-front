import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle.jsx'
import { GearFill } from 'react-bootstrap-icons'

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
							<GearFill size={16} />
						</Link>
						<ThemeToggle />
					</nav>
				</div>
			</div>
		</header>
	)
}