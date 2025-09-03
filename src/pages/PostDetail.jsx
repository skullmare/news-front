import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Modal from '../components/Modal.jsx'
import Spinner from '../components/Spinner.jsx'
import LoadingSpinner from '../components/LoadingSpinner';
import { NewsAPI } from '../lib/api.js'
import { Openai, Trash, Plus } from 'react-bootstrap-icons';

export default function PostDetail() {
	const { id } = useParams()
	const navigate = useNavigate()
	const [post, setPost] = useState(null)
	const [loading, setLoading] = useState(true)
	const [title, setTitle] = useState('')
	const [text, setText] = useState('')
	const [link, setLink] = useState('') // Добавлено состояние для ссылки
	const [confirm, setConfirm] = useState({ open: false, type: null })
	const [fileOpen, setFileOpen] = useState(false)
	const [file, setFile] = useState(null)
	const [message, setMessage] = useState(null)
	const [imagePreviewOpen, setImagePreviewOpen] = useState(false)

	// Независимые состояния загрузки для каждой операции
	const [saving, setSaving] = useState(false)
	const [publishing, setPublishing] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [regeneratingPost, setRegeneratingPost] = useState(false)
	const [regeneratingPhoto, setRegeneratingPhoto] = useState(false)
	const [uploadingPhoto, setUploadingPhoto] = useState(false)
	const [deletingPhoto, setDeletingPhoto] = useState(false)
	// Новые состояния для отдельных перегенераций
	const [regeneratingTitle, setRegeneratingTitle] = useState(false)
	const [regeneratingText, setRegeneratingText] = useState(false)

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
					setLink(data?.link || '') // Устанавливаем ссылку из данных
				}
			} catch (e) {
				console.error(e)
				showMessage('Ошибка при загрузке новости', 'error')
			} finally {
				if (!canceled) setLoading(false)
			}
		}
		load()
		return () => {
			canceled = true
		}
	}, [id])

	// Автоматическая установка высоты textarea после загрузки данных
	useEffect(() => {
		if (!loading && post) {
			// Устанавливаем высоту для заголовка
			const titleTextarea = document.getElementById('title-textarea');
			if (titleTextarea) {
				titleTextarea.style.height = 'auto';
				titleTextarea.style.height = titleTextarea.scrollHeight + 'px';
			}

			// Устанавливаем высоту для текста
			const textTextarea = document.getElementById('text-textarea');
			if (textTextarea) {
				textTextarea.style.height = 'auto';
				textTextarea.style.height = textTextarea.scrollHeight + 'px';
			}
		}
	}, [loading, post, title, text]);

	// Функция для показа сообщений по центру экрана
	const showMessage = (text, type = 'success') => {
		setMessage(null)
		setTimeout(() => {
			setMessage({ text, type })
			setTimeout(() => setMessage(null), 3000)
		}, 10)
	}

	async function handleSave() {
		setSaving(true)
		try {
			// Передаем ссылку вместе с другими данными
			await NewsAPI.updatePost({ id, title, text, link })
			const data = await NewsAPI.getPost(id)
			setPost(data)
			setTitle(data?.title || '')
			setText(data?.text || '')
			setLink(data?.link || '')
			showMessage('Новость успешно сохранена!')
		} catch (e) {
			console.error(e)
			showMessage('Ошибка при сохранении новости', 'error')
		} finally {
			setSaving(false)
		}
	}

	async function handlePublish() {
		setPublishing(true)
		try {
			const response = await NewsAPI.publishPost(id)
			if (response.error == 'not_publish') {
				showMessage('Ошибка публикации! Содержание новости слишком длинное.', 'error')
			} else {
				showMessage('Новость успешно опубликована!')
				navigate('/')
			}
			
		} catch (e) {
			console.error(e)
			showMessage('Ошибка при публикации новости', 'error')
		} finally {
			setPublishing(false)
		}
	}

	async function handleDelete() {
		setDeleting(true)
		try {
			await NewsAPI.deletePost(id)
			showMessage('Новость успешно удалена!')
			navigate('/')
		} catch (e) {
			console.error(e)
			showMessage('Ошибка при удалении новости', 'error')
		} finally {
			setDeleting(false)
		}
	}

	// Новая функция для перегенерации только заголовка
	async function handleRegenerateTitle() {
		setRegeneratingTitle(true)
		try {
			await NewsAPI.reGeneratePostTitle({
				id,
				title
			})
			const data = await NewsAPI.getPost(id)
			setPost(data)
			setTitle(data?.title || '')
			showMessage('Заголовок успешно перегенерирован!')
		} catch (e) {
			console.error(e)
			showMessage('Ошибка при перегенерации заголовка', 'error')
		} finally {
			setRegeneratingTitle(false)
		}
	}

	// Новая функция для перегенерации только текста
	async function handleRegenerateText() {
		setRegeneratingText(true)
		try {
			await NewsAPI.reGeneratePostText({
				id,
				text
			})
			const data = await NewsAPI.getPost(id)
			setPost(data)
			setText(data?.text || '')
			showMessage('Текст успешно перегенерирован!')
		} catch (e) {
			console.error(e)
			showMessage('Ошибка при перегенерации текста', 'error')
		} finally {
			setRegeneratingText(false)
		}
	}

	async function handleRegeneratePhoto() {
		setRegeneratingPhoto(true)
		try {
			const prompt = title + '. ' + text;
			// Получаем полный ответ, чтобы иметь доступ к данным
			const response = await NewsAPI.reGeneratePhoto(id, prompt)

			// Проверяем тело ответа на наличие ошибки
			if (response.error === "not_img") {
				showMessage('Произошла ошибка при генерации изображения, попробуйте еще раз', 'error')
				return
			}
			else {
				showMessage('Изображение успешно перегенерировано!')
			}

			const data = await NewsAPI.getPost(id)
			setPost(data)

		} catch (e) {
			console.error(e)
			showMessage('Ошибка при перегенерации изображения', 'error')
		} finally {
			setRegeneratingPhoto(false)
		}
	}

	async function handleUpload() {
		setUploadingPhoto(true)
		try {
			await NewsAPI.uploadPhotoToPost({ id, img: file })
			const data = await NewsAPI.getPost(id)
			setPost(data)
			showMessage('Изображение успешно загружено!')
		} catch (e) {
			console.error(e)
			showMessage('Ошибка при загрузке изображения', 'error')
		} finally {
			setFileOpen(false)
			setFile(null)
			setUploadingPhoto(false)
		}
	}

	async function handleDeleteImage() {
		setDeletingPhoto(true)
		try {
			await NewsAPI.deletePostImage(id)
			const data = await NewsAPI.getPost(id)
			setPost(data)
			showMessage('Изображение успешно удалено!')
		} catch (e) {
			console.error(e)
			showMessage('Ошибка при удалении изображения', 'error')
		} finally {
			setDeletingPhoto(false)
		}
	}

	if (loading) return <Spinner />
	if (!post) return <div>Пост не найден</div>

	return (
		<div className="max-w-4xl mx-auto">
			{/* Центральное сообщение */}
			{message && (
				<div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
					<div className={`px-6 py-4 rounded-md shadow-lg transform transition-all duration-300 ease-in-out pointer-events-auto ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
						{message.text}
					</div>
				</div>
			)}

			<div className="rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-6">

				{/* Секция изображения */}
				<div className="space-y-2">
					<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Изображение</label>
					<div className="flex flex-row gap-4 items-start">
						<div
							className="w-3/4 cursor-pointer"
							onClick={() => post.img_url ? setImagePreviewOpen(true) : setFileOpen(true)}
						>
							{post.img_url ? (
								<img
									src={post.img_url}
									alt={title}
									className="w-full object-cover rounded-lg border border-slate-200 dark:border-slate-600 hover:opacity-90 transition-opacity cursor-zoom-in"
								/>
							) : (
								<div className="flex items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-400 dark:text-slate-500 hover:border-blue-400 hover:text-blue-400 transition-colors">
									+ добавить
								</div>
							)}
						</div>
						<div className="w-1/4 flex flex-col gap-2">
							{/* Новая кнопка добавления изображения */}
							<button
								className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
								onClick={() => setFileOpen(true)}
								disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto || deletingPhoto || regeneratingTitle || regeneratingText}
								title="Добавить изображение"
							>
								<Plus size={20} />
							</button>

							{/* Кнопка перегенерации изображения */}
							<button
								className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
								onClick={handleRegeneratePhoto}
								disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto || deletingPhoto || regeneratingTitle || regeneratingText}
								title="Перегенерировать изображение"
							>
								{regeneratingPhoto ? (
									<LoadingSpinner />
								) : (
									<Openai size={20} />
								)}
							</button>

							{/* Кнопка удаления изображения */}
							<button
								className="inline-flex bg-red-600 h-10 items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm text-white"
								onClick={handleDeleteImage}
								disabled={!post.img_url || saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto || deletingPhoto || regeneratingTitle || regeneratingText}
								title={!post.img_url ? "Нет изображения для удаления" : "Удалить изображение"}
							>
								{deletingPhoto ? (
									<LoadingSpinner />
								) : (
									<Trash size={16} />
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Секция заголовка */}
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Заголовок</label>
					</div>
					<textarea
						id="title-textarea"
						className="w-full text-xl font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 rounded-md p-3 outline-none resize-none"
						value={title}
						onChange={(e) => {
							setTitle(e.target.value);
							e.target.style.height = 'auto';
							e.target.style.height = e.target.scrollHeight + 'px';
						}}
						style={{ overflow: 'hidden' }}
						disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto || deletingPhoto || regeneratingTitle || regeneratingText}
					/>
					<div className="flex justify-end">
						<button
							className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs w-1/2 min-h-[32px]"
							onClick={handleRegenerateTitle}
							disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto || deletingPhoto || regeneratingTitle || regeneratingText}
							title="Перегенерировать заголовок"
						>
							{regeneratingTitle ? (
								<>
									<LoadingSpinner size={12} />
									Перегенерация...
								</>
							) : (
								<>
									<Openai size={25} />
								</>
							)}
						</button>
					</div>
				</div>

				{/* Секция текста */}
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Текст</label>
					</div>
					<textarea
						id="text-textarea"
						className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 rounded-md p-3 outline-none resize-none"
						value={text}
						onChange={(e) => {
							setText(e.target.value);
							e.target.style.height = 'auto';
							e.target.style.height = e.target.scrollHeight + 'px';
						}}
						style={{ overflow: 'hidden' }}
						disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto || deletingPhoto || regeneratingTitle || regeneratingText}
					/>
					<div className="flex justify-end">
						<button
							className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs w-1/2 min-h-[32px]"
							onClick={handleRegenerateText}
							disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto || deletingPhoto || regeneratingTitle || regeneratingText}
							title="Перегенерировать текст"
						>
							{regeneratingText ? (
								<>
									<LoadingSpinner size={12} />
									Перегенерация...
								</>
							) : (
								<>
									<Openai size={25} />
								</>
							)}
						</button>
					</div>
				</div>

				{/* Секция ссылки на источник */}
				<div className="space-y-2">
					<div className="space-y-2">
						<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ссылка на источник</label>
						<input
							type="url"
							className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 rounded-md p-3 outline-none"
							value={link}
							onChange={(e) => setLink(e.target.value)}
							placeholder="https://example.com"
							disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto || deletingPhoto || regeneratingTitle || regeneratingText}
						/>
					</div>
				</div>

				{/* Кнопки действий */}
				<div className="flex flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
					<button
						className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 text-white px-4 py-3 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
						onClick={handleSave}
						disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto || deletingPhoto || regeneratingTitle || regeneratingText}
					>
						{saving ? (
							<>
								<LoadingSpinner />
								<span className="truncate">Сохранение...</span>
							</>
						) : (
							'Сохранить'
						)}
					</button>
					<button
						className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-md bg-green-600 text-white px-4 py-3 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
						onClick={handlePublish}
						disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto || deletingPhoto || regeneratingTitle || regeneratingText}
					>
						{publishing ? (
							<>
								<LoadingSpinner />
								<span className="truncate">Публикация...</span>
							</>
						) : (
							'Опубликовать'
						)}
					</button>
					<button
						className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-md bg-red-600 text-white px-4 py-3 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
						onClick={() => setConfirm({ open: true, type: 'delete' })}
						disabled={saving || publishing || deleting || regeneratingPost || regeneratingPhoto || uploadingPhoto || deletingPhoto || regeneratingTitle || regeneratingText}
					>
						Удалить
					</button>
				</div>
			</div>

			{/* Модальные окна (только для удаления) */}
			<Modal open={confirm.open} title="Удалить новость?" onClose={() => setConfirm({ open: false, type: null })}>
				<p className="mb-4">Вы уверены?</p>
				<div className="flex justify-end gap-2">
					<button
						className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={() => setConfirm({ open: false, type: null })}
						disabled={deleting}
					>
						Отмена
					</button>
					<button
						className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={handleDelete}
						disabled={deleting}
					>
						{deleting ? (
							<>
								<LoadingSpinner />
								Удаление...
							</>
						) : (
							'Удалить'
						)}
					</button>
				</div>
			</Modal>

			<Modal open={fileOpen} title="Загрузить своё фото" onClose={() => setFileOpen(false)}>
				<div className="space-y-3">
					<input
						type="file"
						accept="image/*"
						onChange={(e) => setFile(e.target.files?.[0] || null)}
						disabled={uploadingPhoto}
						className="w-full p-2 border border-slate-300 rounded-md"
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

			{/* Модальное окно просмотра изображения */}
			<Modal open={imagePreviewOpen} title="Просмотр изображения" onClose={() => setImagePreviewOpen(false)}>
				<div className="flex justify-center">
					{post.img_url && (
						<img
							src={post.img_url}
							alt={title}
							className="w-full"
						/>
					)}
				</div>
			</Modal>
		</div>
	)
}