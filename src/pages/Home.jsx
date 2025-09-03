import { useEffect, useMemo, useState } from 'react'
import PostCard from '../components/PostCard.jsx'
import Modal from '../components/Modal.jsx'
import Spinner from '../components/Spinner.jsx'
import LoadingSpinner from '../components/LoadingSpinner';
import { NewsAPI } from '../lib/api.js'
import { ArrowRepeat, Openai, Plus } from 'react-bootstrap-icons'

export default function Home() {
	const [posts, setPosts] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [confirm, setConfirm] = useState({ open: false, id: null, type: null })
	const [promptModal, setPromptModal] = useState({ open: false, id: null, label: '', action: null })
	const [message, setMessage] = useState(null)
	const [requestInProgress, setRequestInProgress] = useState(false)
	const [refreshing, setRefreshing] = useState(false)

	// Состояние для модального окна добавления новости
	const [addNewsModal, setAddNewsModal] = useState({
		open: false,
		title: '',
		text: '',
		imgFile: null,
		imgPreview: null
	})

	// Функция для загрузки новостей
	const fetchNews = async () => {
		try {
			const data = await NewsAPI.listNews()
			setPosts(data || [])
			setError('')
		} catch (e) {
			setError('Ошибка загрузки')
			console.error('Ошибка при загрузке новостей:', e)
		}
	}

	useEffect(() => {
		let canceled = false
		const POLLING_INTERVAL = 5000 // 5 секунд

		async function initialFetch() {
			try {
				setLoading(true)
				const data = await NewsAPI.listNews()
				if (!canceled) {
					setPosts(data || [])
					setLoading(false)
				}
			} catch (e) {
				if (!canceled) {
					setError('Ошибка загрузки')
					setLoading(false)
					showMessage('Ошибка при загрузке новостей', 'error')
				}
			}
		}

		// Первоначальная загрузка
		initialFetch()

		// Настройка интервального обновления
		const intervalId = setInterval(() => {
			if (!canceled) {
				fetchNews()
			}
		}, POLLING_INTERVAL)

		return () => {
			canceled = true
			clearInterval(intervalId)
		}
	}, [])

	// Функция для ручного обновления
	const handleRefresh = async () => {
		setRefreshing(true)
		try {
			await fetchNews()
			showMessage('Новости обновлены')
		} catch (e) {
			showMessage('Ошибка при обновлении', 'error')
		} finally {
			setRefreshing(false)
		}
	}

	// Функция для показа уведомлений
	const showMessage = (text, type = 'success') => {
		setMessage(null)
		setTimeout(() => {
			setMessage({ text, type })
			setTimeout(() => setMessage(null), 3000)
		}, 10)
	}

	const onPublish = (id) => setConfirm({ open: true, id, type: 'publish' })
	const onDelete = (id) => setConfirm({ open: true, id, type: 'delete' })
	const onRegen = (id) => setPromptModal({ open: true, id, label: 'Что вы хотите изменить?', action: 'regen' })

	const [genOpen, setGenOpen] = useState(false)
	const [genPrompt, setGenPrompt] = useState('')

	async function handleConfirm() {
		setRequestInProgress(true)
		const { id, type } = confirm
		try {
			if (type === 'publish') {
				const response = await NewsAPI.publishPost(id)
				if (response.error == 'not_publish') {
					showMessage('Ошибка публикации! Содержание новости слишком длинное.', 'error')
				} else {
					showMessage('Новость успешно опубликована!')
				}
				
			}
			if (type === 'delete') {
				await NewsAPI.deletePost(id)
				showMessage('Новость успешно удалена!')
			}
			// Обновляем данные после действия
			await fetchNews()
		} catch (e) {
			console.error(e)
			const errorMessage = type === 'publish'
				? 'Ошибка при публикации новости'
				: 'Ошибка при удалении новости'
			showMessage(errorMessage, 'error')
		} finally {
			setConfirm({ open: false, id: null, type: null })
			setRequestInProgress(false)
		}
	}

	const content = useMemo(() => {
		if (loading) return <Spinner />
		if (error) return <div className="text-center py-12 text-red-500">{error}</div>
		if (!posts.length) return <div className="text-center py-12">Постов нет</div>
		return posts.map((p) => (
			<PostCard key={p.id} post={p} onPublish={onPublish} onDelete={onDelete} onRegen={onRegen} />
		))
	}, [posts, loading, error])

	return (
		<div>
			{/* Кнопка ручного обновления */}
			{/* <div className="flex justify-end mb-4">
				<button
					onClick={handleRefresh}
					disabled={refreshing}
					className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
				>
					<ArrowRepeat className={refreshing ? 'animate-spin' : ''} />
					{refreshing ? 'Обновление...' : 'Обновить'}
				</button>
			</div> */}

			{/* Центральное сообщение */}
			{message && (
				<div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
					<div className={`px-6 py-4 rounded-md shadow-lg transform transition-all duration-300 ease-in-out pointer-events-auto ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
						{message.text}
					</div>
				</div>
			)}

			{content}

			<Modal open={confirm.open} title={confirm.type === 'publish' ? 'Опубликовать новость?' : 'Удалить новость?'} onClose={() => setConfirm({ open: false, id: null, type: null })}>
				<p className="mb-4">Вы уверены?</p>
				<div className="flex justify-end gap-2">
					<button
						className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={() => setConfirm({ open: false, id: null, type: null })}
						disabled={requestInProgress}
					>
						Отмена
					</button>
					<button
						className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${confirm.type === 'publish'
								? 'bg-green-600 hover:bg-green-700'
								: 'bg-red-600 hover:bg-red-700'
							}`}
						onClick={handleConfirm}
						disabled={requestInProgress}
					>
						{requestInProgress ? (
							<>
								<LoadingSpinner />
								Загрузка...
							</>
						) : (
							'Подтвердить'
						)}
					</button>
				</div>
			</Modal>
		</div>
	)
}