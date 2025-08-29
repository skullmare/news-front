import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import PostDetail from './pages/PostDetail.jsx'
import Settings from './pages/Settings.jsx'
import PostAdd from './pages/PostAdd.jsx'

export default function App() {
	return (
		<div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
			<Navbar />
			<main className="container mx-auto px-3 sm:px-4 md:px-6 max-w-5xl pt-20 pb-10">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/post/:id" element={<PostDetail />} />
					<Route path="/settings" element={<Settings />} />
					<Route path="/post/add" element={<PostAdd />} />
					<Route path="*" element={<Home />} />
				</Routes>
			</main>
		</div>
	)
} 