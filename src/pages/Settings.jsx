import { useEffect, useState } from 'react'
import { ChannelsAPI, SettingsAPI } from '../lib/api.js'
import Modal from '../components/Modal.jsx'

export default function Settings() {
	const [prompt, setPrompt] = useState('Загрузка...')
	const [count, setCount] = useState('0')
	const [saving, setSaving] = useState(false)
	const [channels, setChannels] = useState([])
	const [newChannel, setNewChannel] = useState('')
	const [confirmChannel, setConfirmChannel] = useState({ open: false, id: null, url: '' })
	const [toasts, setToasts] = useState([])

	useEffect(() => {
		let canceled = false
		async function load() {
			try {
				const s = await SettingsAPI.getSettings()
				if (!canceled) {
					setPrompt(s?.prompt || 'Загрузка...')
					setCount(Number(s?.count_news || '0'))
				}
				const ch = await ChannelsAPI.list()
				if (!canceled) setChannels(ch || [])
			} catch (e) {
				console.error(e)
				showToast('Ошибка при загрузке настроек', 'error')
			}
		}
		load()
		return () => {
			canceled = true
		}
	}, [])

	// Функция для показа уведомлений
	const showToast = (message, type = 'success') => {
		const id = Date.now()
		setToasts(prev => [...prev, { id, message, type }])
	}

	// Автоматическое скрытие toast через 3 секунды
	useEffect(() => {
		if (toasts.length > 0) {
			const timer = setTimeout(() => {
				setToasts(prev => prev.slice(1))
			}, 3000)
			return () => clearTimeout(timer)
		}
	}, [toasts])

	async function saveSettings() {
		try {
			setSaving(true)
			await SettingsAPI.setPrompt(prompt)
			await SettingsAPI.setCountNews(count)
			showToast('Настройки успешно сохранены!')
		} catch (e) {
			console.error(e)
			showToast('Ошибка при сохранении настроек', 'error')
		} finally {
			setSaving(false)
		}
	}

	async function addChannel() {
		try {
			await ChannelsAPI.add({ url: newChannel })
			setNewChannel('')
			const ch = await ChannelsAPI.list()
			setChannels(ch || [])
			showToast('Канал успешно добавлен!')
		} catch (e) {
			console.error(e)
			showToast('Ошибка при добавлении канала', 'error')
		}
	}

	async function removeChannel(id) {
		try {
			await ChannelsAPI.remove(id)
			const ch = await ChannelsAPI.list()
			setChannels(ch || [])
			showToast('Канал успешно удален!')
		} catch (e) {
			console.error(e)
			showToast('Ошибка при удалении канала', 'error')
		}
	}

	async function handleConfirmRemoveChannel() {
		const { id } = confirmChannel
		await removeChannel(id)
		setConfirmChannel({ open: false, id: null, url: '' })
	}

	return (
		<div className="space-y-6">
			{/* Toast уведомления */}
			<div className="fixed inset-0 flex flex-col items-center justify-center z-50 space-y-1 pointer-events-none">
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className={`px-3 py-1.5 rounded-md shadow-lg transform transition-all duration-300 ease-in-out pointer-events-auto 
                       bg-opacity-20 backdrop-blur-sm text-xs max-w-[200px] text-center ${toast.type === 'error'
								? 'bg-red-500 text-white'
								: 'bg-green-500 text-white'
							}`}
					>
						{toast.message}
					</div>
				))}
			</div>

			<div className="rounded-xl p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
				<h3 className="text-xl font-semibold mb-4">Настройки</h3>
				<div className="grid gap-4">
					<label className="grid gap-2">
						<span className="text-sm text-slate-500 dark:text-slate-400">Системный промпт</span>
						<textarea className="w-full min-h-[120px] rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-3 outline-none" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
					</label>
					<label className="grid gap-2 max-w-xs">
						<span className="text-sm text-slate-500 dark:text-slate-400">Количество новостей</span>
						<input type="number" min={1} className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-2 outline-none" value={count} onChange={(e) => setCount(Number(e.target.value))} />
					</label>
					<div>
						<button className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition" disabled={saving} onClick={saveSettings}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
					</div>
				</div>
			</div>

			<div className="rounded-xl p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
				<h3 className="text-xl font-semibold mb-4">
					Телеграм-каналы для парсинга
				</h3>
				<div className="flex flex-col sm:flex-row gap-2 sm:items-end">
					<label className="grid gap-2 flex-1">
						<span className="text-sm text-slate-500 dark:text-slate-400">Ссылка на канал</span>
						<input className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-2 outline-none" placeholder="https://t.me/..." value={newChannel} onChange={(e) => setNewChannel(e.target.value)} />
					</label>
					<button className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition" onClick={addChannel} disabled={!newChannel}>Добавить</button>
				</div>
				<ul className="mt-4 space-y-2">
					{channels.map((c) => {
						const channelUrl = c?.url ?? c?.link ?? ''
						return (
							<li key={c.id} className="flex items-center justify-between gap-2">
								<a href={channelUrl} target="_blank" rel="noreferrer" className="flex-1 min-w-0 underline underline-offset-4 truncate">{channelUrl}</a>
								<button className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 text-white px-3 py-1.5 hover:bg-red-700 transition" onClick={() => setConfirmChannel({ open: true, id: c.id, url: channelUrl })}>Удалить</button>
							</li>
						)
					})}
				</ul>
			</div>

			<Modal open={confirmChannel.open} title="Удалить канал?" onClose={() => setConfirmChannel({ open: false, id: null, url: '' })}>
				<p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Вы уверены, что хотите удалить канал: <span className="font-medium">{confirmChannel.url}</span>?</p>
				<div className="flex justify-end gap-2">
					<button className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition" onClick={() => setConfirmChannel({ open: false, id: null, url: '' })}>Отмена</button>
					<button className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition" onClick={handleConfirmRemoveChannel}>Удалить</button>
				</div>
			</Modal>
		</div>
	)
}