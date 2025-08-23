import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Modal from '../components/Modal.jsx'
import Spinner from '../components/Spinner.jsx'
import LoadingSpinner from '../components/LoadingSpinner'; // путь к вашему файлу
import { NewsAPI } from '../lib/api.js'

export default function PostDetail() {
	const { id } = useParams()
	const navigate = useNavigate()
	const [post, setPost] = useState(null)
	const [loading, setLoading] = useState(true)
	const [title, setTitle] = useState('')
	const [text, setText] = useState('')
	const [confirm, setConfirm] = useState({ open: false, type: null })
	const [promptModal, setPromptModal] = useState({ open: false, type: null, label: '' })
	const [fileOpen, setFileOpen] = useState(false)
	const [file, setFile] = useState(null)
	const [toasts, setToasts] = useState([])

	// Независимые состояния загрузки для каждой операции
	const [saving, setSaving] = useState(false)
	const [publishing, setPublishing] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [regeneratingPost, setRegeneratingPost] = useState(false)
	const [regeneratingPhoto, setRegeneratingPhoto] = useState(false)
	const [uploadingPhoto, setUploadingPhoto] = useState(false)

	useEffect(() => {
		let canceled = false
		async function load() {
			try {
				setLoading(true)
				const data = await NewsAPI.getPost(id)
				if (!canceled) {
					setPost(data)
					setTitle(data?.title || '')
					setText(data?.text || '')
				}
			} catch (e) {
				console.error(e)
				showToast('Ошибка при загрузке новости', 'error')
			} finally {
				if (!canceled) setLoading(false)
			}
		}
		load()
		return () => {
			canceled = true
		}
	}, [id])

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

	async function handleSave() {
		setSaving(true)
		try {
			await NewsAPI.updatePost({ id, title, text })
			const data = await NewsAPI.getPost(id)
			setPost(data)
			// Обновляем поля title и text после сохранения
			setTitle(data?.title || '')
			setText(data?.text || '')
			showToast('Новость успешно сохранена!')
		} catch (e) {
			console.error(e)
			showToast('Ошибка при сохранении новости', 'error')
		} finally {
			setSaving(false)
		}
	}

	async function handleConfirm() {
		if (confirm.type === 'publish') {
			setPublishing(true)
		} else if (confirm.type === 'delete') {
			setDeleting(true)
		}

		try {
			if (confirm.type === 'publish') {
				await NewsAPI.publishPost(id)
				showToast('Новость успешно опубликована!')
			}
			if (confirm.type === 'delete') {
				await NewsAPI.deletePost(id)
				showToast('Новость успешно удалена!')
			}
			if (confirm.type === 'delete' || confirm.type === 'publish') navigate('/')
		} catch (e) {
			console.error(e)
			const errorMessage = confirm.type === 'publish'
				? 'Ошибка при публикации новости'
				: 'Ошибка при удалении новости'
			showToast(errorMessage, 'error')
		} finally {
			setConfirm({ open: false, type: null })
			setPublishing(false)
			setDeleting(false)
		}
	}

	async function handlePrompt(action, value) {
		if (action === 'regenPost') {
			setRegeneratingPost(true)
		} else if (action === 'regenPhoto') {
			setRegeneratingPhoto(true)
		}

		try {
			if (action === 'regenPost') {
				await NewsAPI.reGeneratePost({ id, prompt: value })
				showToast('Текст новости успешно перегенерирован!')
			}
			if (action === 'regenPhoto') {
				await NewsAPI.generatePhoto(id, value)
				showToast('Изображение успешно перегенерировано!')
			}
			// Получаем обновленные данные после перегенерации
			const data = await NewsAPI.getPost(id)
			setPost(data)
			// ОБНОВЛЯЕМ ПОЛЯ TITLE И TEXT С НОВЫМИ ДАННЫМИ
			setTitle(data?.title || '')
			setText(data?.text || '')
		} catch (e) {
			console.error(e)
			const errorMessage = action === 'regenPost'
				? 'Ошибка при перегенерации текста'
				: 'Ошибка при перегенерации изображения'
			showToast(errorMessage, 'error')
		} finally {
			setPromptModal({ open: false, type: null, label: '' })
			setRegeneratingPost(false)
			setRegeneratingPhoto(false)
		}
	}

	async function handleUpload() {
		setUploadingPhoto(true)
		try {
			await NewsAPI.uploadPhotoToPost({ id, img: file })
			const data = await NewsAPI.getPost(id)
			setPost(data)
			showToast('Изображение успешно загружено!')
		} catch (e) {
			console.error(e)
			showToast('Ошибка при загрузке изображения', 'error')
		} finally {
			setFileOpen(false)
			setFile(null)
			setUploadingPhoto(false)
		}
	}

	if (loading) return <Spinner />
	if (!post) return <div>Пост не найден</div>

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

			<div className="rounded-xl p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
				{post.img_url && (
					<img src={post.img_url} alt={title} className="w-full max-h-[420px] object-cover rounded-lg" />
				)}
				<div className="mt-4 space-y-3">
					<textarea
						className="w-full text-2xl sm:text-3xl font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 rounded-md p-2 outline-none resize-none"
						value={title}
						onChange={(e) => {
							setTitle(e.target.value);
							// Автоматическое изменение высоты
							e.target.style.height = 'auto';
							e.target.style.height = e.target.scrollHeight + 'px';
						}}
						onFocus={(e) => {
							// Инициализация высоты при фокусе
							e.target.style.height = 'auto';
							e.target.style.height = e.target.scrollHeight + 'px';
						}}
						style={{ minHeight: '60px', overflow: 'hidden' }}
						disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto}
					/>
					<textarea
						className="w-full min-h-[200px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 rounded-md p-3 outline-none"
						value={text}
						onChange={(e) => setText(e.target.value)}
						disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto}
					/>
					<div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
						<button
							className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={handleSave}
							disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto}
						>
							{saving ? (
								<>
									<LoadingSpinner />
									Сохранение...
								</>
							) : (
								'Сохранить'
							)}
						</button>
						<button
							className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={() => setConfirm({ open: true, type: 'publish' })}
							disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto}
						>
							Опубликовать
						</button>
						<button
							className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={() => setConfirm({ open: true, type: 'delete' })}
							disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto}
						>
							Удалить
						</button>
						<button
							className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={() => setPromptModal({ open: true, type: 'regenPost', label: 'Что вы хотите изменить?' })}
							disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto}
						>
							{regeneratingPost ? (
								<>
									<LoadingSpinner />
									Перегенерация...
								</>
							) : (
								'Перегенерировать'
							)}
						</button>
						<button
							className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={() => setPromptModal({ open: true, type: 'regenPhoto', label: 'Что должно быть изображено на картинке?' })}
							disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto}
						>
							{regeneratingPhoto ? (
								<>
									<LoadingSpinner />
									Перегенерация...
								</>
							) : (
								'Перегенерировать фото'
							)}
						</button>
						<button
							className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={() => setFileOpen(true)}
							disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto}
						>
							Использовать своё фото
						</button>


					</div>
					{post.link && (
						<div className="text-sm text-slate-500 dark:text-slate-400">
							<a href={post.link} className="underline underline-offset-4" target="_blank" rel="noreferrer">Источник</a>
						</div>
					)}
				</div>
			</div>

			<Modal open={confirm.open} title={confirm.type === 'publish' ? 'Опубликовать новость?' : 'Удалить новость?'} onClose={() => setConfirm({ open: false, type: null })}>
				<p className="mb-4">Вы уверены?</p>
				<div className="flex justify-end gap-2">
					<button
						className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={() => setConfirm({ open: false, type: null })}
						disabled={publishing || deleting}
					>
						Отмена
					</button>
					<button
						className="inline-flex items-center justify-center gap-2 rounded-md bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={handleConfirm}
						disabled={publishing || deleting}
					>
						{publishing || deleting ? (
							<>
								<LoadingSpinner />
								{publishing ? 'Публикация...' : 'Удаление...'}
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
				onSubmit={(val) => handlePrompt(promptModal.type, val)}
				onClose={() => setPromptModal({ open: false, type: null, label: '' })}
				requestInProgress={regeneratingPost || regeneratingPhoto}
			/>

			<Modal open={fileOpen} title="Загрузить своё фото" onClose={() => setFileOpen(false)}>
				<div className="space-y-3">
					<input
						type="file"
						accept="image/*"
						onChange={(e) => setFile(e.target.files?.[0] || null)}
						disabled={uploadingPhoto}
					/>
					<div className="flex justify-end gap-2">
						<button
							className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={() => setFileOpen(false)}
							disabled={uploadingPhoto}
						>
							Отмена
						</button>
						<button
							className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 disabled:bg-blue-600/60 text-white px-4 py-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={!file || uploadingPhoto}
							onClick={handleUpload}
						>
							{uploadingPhoto ? (
								<>
									<LoadingSpinner />
									Загрузка...
								</>
							) : (
								'Загрузить'
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