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
	const [toasts, setToasts] = useState([])
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
					showToast('Ошибка при загрузке новостей', 'error')
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
				showToast('Новость успешно опубликована!')
			}
			if (type === 'delete') {
				await NewsAPI.deletePost(id)
				showToast('Новость успешно удалена!')
			}
			const data = await NewsAPI.listNews()
			setPosts(data || [])
		} catch (e) {
			console.error(e)
			const errorMessage = type === 'publish' 
				? 'Ошибка при публикации новости' 
				: 'Ошибка при удалении новости'
			showToast(errorMessage, 'error')
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
				showToast('Новость успешно перегенерирована!')
			}
			const data = await NewsAPI.listNews()
			setPosts(data || [])
		} catch (e) {
			console.error(e)
			showToast('Ошибка при перегенерации новости', 'error')
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
			showToast('Новость успешно сгенерирована!')
		} catch (e) {
			console.error(e)
			showToast('Ошибка при генерации новости', 'error')
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
			
			showToast('Новость успешно добавлена!');
			
			// Закрываем модальное окно и сбрасываем поля
			setAddNewsModal({ open: false, title: '', text: '', imgFile: null, imgPreview: null });
		} catch (e) {
			console.error(e);
			showToast('Ошибка при добавлении новости', 'error');
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

			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2 p-1">
					<button 
						className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition" 
						onClick={() => setAddNewsModal({ open: true, title: '', text: '', imgFile: null, imgPreview: null })}
					>
						<Plus size={20}/> Новость
					</button>
				</div>
				<div className="flex items-center gap-2 p-1">
					<button className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition" onClick={() => setGenOpen(true)}><Openai size={16} />Ai</button>
				</div>
			</div>
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
						className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-white transition bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed" 
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

			<PromptModal 
				open={promptModal.open} 
				title={promptModal.label} 
				onSubmit={handlePromptModal} 
				onClose={() => setPromptModal({ open: false, id: null, label: '', action: null })}
				requestInProgress={requestInProgress}
			/>

			<Modal open={genOpen} title="Сгенерировать новость" onClose={() => setGenOpen(false)}>
				<div className="space-y-3">
					<textarea className="w-full min-h-[100px] rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-3 outline-none" placeholder="Опишите, какую новость сгенерировать" value={genPrompt} onChange={(e) => setGenPrompt(e.target.value)} />
					<div className="flex justify-end gap-2">
						<button 
							className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed" 
							onClick={() => setGenOpen(false)}
							disabled={requestInProgress}
						>
							Отмена
						</button>
						<button 
							className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed" 
							onClick={handleGenerateNew}
							disabled={requestInProgress || !genPrompt.trim()}
						>
							{requestInProgress ? (
								<>
									<LoadingSpinner />
									Генерация...
								</>
							) : (
								'Сгенерировать'
							)}
						</button>
					</div>
				</div>
			</Modal>

			{/* Модальное окно для добавления новости */}
			<Modal open={addNewsModal.open} title="Добавить новость" onClose={() => setAddNewsModal({ open: false, title: '', text: '', imgFile: null, imgPreview: null })}>
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1">Заголовок</label>
						<input 
							type="text" 
							className="w-full rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-2 outline-none"
							placeholder="Введите заголовок новости"
							value={addNewsModal.title}
							onChange={(e) => setAddNewsModal({...addNewsModal, title: e.target.value})}
							disabled={requestInProgress}
						/>
					</div>
					
					<div>
						<label className="block text-sm font-medium mb-1">Текст новости</label>
						<textarea 
							className="w-full min-h-[100px] rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-2 outline-none"
							placeholder="Введите текст новости"
							value={addNewsModal.text}
							onChange={(e) => setAddNewsModal({...addNewsModal, text: e.target.value})}
							disabled={requestInProgress}
						/>
					</div>
					
					<div>
						<label className="block text-sm font-medium mb-1">Изображение</label>
						<input 
							type="file" 
							accept="image/*"
							className="w-full rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-2 outline-none"
							onChange={handleImageChange}
							disabled={requestInProgress}
						/>
						{addNewsModal.imgPreview && (
							<div className="mt-2 relative">
								<img 
									src={addNewsModal.imgPreview} 
									alt="Preview" 
									className="w-full h-32 object-cover rounded-md"
								/>
								<button 
									type="button"
									className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
									onClick={removeImage}
									disabled={requestInProgress}
								>
									✕
								</button>
							</div>
						)}
					</div>
					
					<div className="flex justify-end gap-2">
						<button 
							className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed" 
							onClick={() => setAddNewsModal({ open: false, title: '', text: '', imgFile: null, imgPreview: null })}
							disabled={requestInProgress}
						>
							Отмена
						</button>
						<button 
							className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed" 
							onClick={handleAddNew}
							disabled={requestInProgress || !addNewsModal.title.trim() || !addNewsModal.text.trim()}
						>
							{requestInProgress ? (
								<>
									<LoadingSpinner />
									Добавление...
								</>
							) : (
								'Добавить'
							)}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}

function PromptModal({ open, title, onSubmit, onClose, requestInProgress }) {
	const [value, setValue] = useState('')
	return (
		<Modal open={open} title={title} onClose={onClose}>
			<div className="space-y-3">
				<textarea 
					className="w-full min-h-[100px] rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-3 outline-none" 
					placeholder="Опишите..." 
					value={value} 
					onChange={(e) => setValue(e.target.value)}
					disabled={requestInProgress}
				/>
				<div className="flex justify-end gap-2">
					<button 
						className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed" 
						onClick={onClose}
						disabled={requestInProgress}
					>
						Отмена
					</button>
					<button 
						className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed" 
						onClick={() => onSubmit(value)}
						disabled={requestInProgress || !value.trim()}
					>
						{requestInProgress ? (
							<>
								<LoadingSpinner />
								Загрузка...
							</>
						) : (
							'Продолжить'
						)}
					</button>
				</div>
			</div>
		</Modal>
	)
}