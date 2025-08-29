import { useEffect, useMemo, useState } from 'react'
import PostCard from '../components/PostCard.jsx'
import Modal from '../components/Modal.jsx'
import Spinner from '../components/Spinner.jsx'
import LoadingSpinner from '../components/LoadingSpinner'; // путь к вашему файлу
import { NewsAPI } from '../lib/api.js'
import { ArrowRepeat, Openai, Plus } from 'react-bootstrap-icons'

export default function Home() {
	const [posts, setPosts] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [confirm, setConfirm] = useState({ open: false, id: null, type: null })
	const [promptModal, setPromptModal] = useState({ open: false, id: null, label: '', action: null })
	const [message, setMessage] = useState(null)
	const [requestInProgress, setRequestInProgress] = useState(false) // Новое состояние для отслеживания выполнения запроса

	// Состояние для модального окна добавления новости
	const [addNewsModal, setAddNewsModal] = useState({
		open: false,
		title: '',
		text: '',
		imgFile: null,
		imgPreview: null
	})

	useEffect(() => {
		let canceled = false
		async function fetchData() {
			try {
				setLoading(true)
				const data = await NewsAPI.listNews()
				if (!canceled) setPosts(data || [])
			} catch (e) {
				if (!canceled) {
					setError('Ошибка загрузки')
					showMessage('Ошибка при загрузке новостей', 'error')
				}
			} finally {
				if (!canceled) setLoading(false)
			}
		}
		fetchData()
		return () => {
			canceled = true
		}
	}, [])

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
		setRequestInProgress(true) // Начало запроса
		const { id, type } = confirm
		try {
			if (type === 'publish') {
				await NewsAPI.publishPost(id)
				showMessage('Новость успешно опубликована!')
			}
			if (type === 'delete') {
				await NewsAPI.deletePost(id)
				showMessage('Новость успешно удалена!')
			}
			const data = await NewsAPI.listNews()
			setPosts(data || [])
		} catch (e) {
			console.error(e)
			const errorMessage = type === 'publish'
				? 'Ошибка при публикации новости'
				: 'Ошибка при удалении новости'
			showMessage(errorMessage, 'error')
		} finally {
			setConfirm({ open: false, id: null, type: null })
			setRequestInProgress(false) // Конец запроса
		}
	}

	async function handlePromptModal(value) {
		setRequestInProgress(true) // Начало запроса
		const { id, action } = promptModal
		try {
			if (action === 'regen') {
				await NewsAPI.reGeneratePost({ id, prompt: value })
				showMessage('Новость успешно перегенерирована!')
			}
			const data = await NewsAPI.listNews()
			setPosts(data || [])
		} catch (e) {
			console.error(e)
			showMessage('Ошибка при перегенерации новости', 'error')
		} finally {
			setPromptModal({ open: false, id: null, label: '', action: null })
			setRequestInProgress(false) // Конец запроса
		}
	}

	async function handleGenerateNew() {
		setRequestInProgress(true) // Начало запроса
		try {
			await NewsAPI.generatePost(genPrompt)
			const data = await NewsAPI.listNews()
			setPosts(data || [])
			showMessage('Новость успешно сгенерирована!')
		} catch (e) {
			console.error(e)
			showMessage('Ошибка при генерации новости', 'error')
		} finally {
			setGenOpen(false)
			setGenPrompt('')
			setRequestInProgress(false) // Конец запроса
		}
	}

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setAddNewsModal({
					...addNewsModal,
					imgFile: file,
					imgPreview: e.target.result
				});
			};
			reader.readAsDataURL(file);
		}
	};

	const removeImage = () => {
		setAddNewsModal({
			...addNewsModal,
			imgFile: null,
			imgPreview: null
		});
	};

	async function handleAddNew() {
		setRequestInProgress(true) // Начало запроса
		try {
			const formData = new FormData();
			formData.append('title', addNewsModal.title);
			formData.append('text', addNewsModal.text);
			if (addNewsModal.imgFile) {
				formData.append('img', addNewsModal.imgFile);
			}

			await NewsAPI.addPost(formData);
			const data = await NewsAPI.listNews();
			setPosts(data || []);

			showMessage('Новость успешно добавлена!');

			// Закрываем модальное окно и сбрасываем поля
			setAddNewsModal({ open: false, title: '', text: '', imgFile: null, imgPreview: null });
		} catch (e) {
			console.error(e);
			showMessage('Ошибка при добавлении новости', 'error');
		} finally {
			setRequestInProgress(false) // Конец запроса
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
