import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal.jsx'
import Spinner from '../components/Spinner.jsx'
import LoadingSpinner from '../components/LoadingSpinner'
import { NewsAPI } from '../lib/api.js'
import { Openai, Trash, Plus } from 'react-bootstrap-icons'

export default function PostAdd() {
    const navigate = useNavigate()
    const [newsData, setNewsData] = useState({
        title: '',
        text: '',
        link: '',
        image: null
    })
    const [loading, setLoading] = useState(false)
    const [fileOpen, setFileOpen] = useState(false)
    const [file, setFile] = useState(null)
    const [message, setMessage] = useState(null)
    const [imagePreviewOpen, setImagePreviewOpen] = useState(false)

    // Состояния загрузки для операций
    const [saving, setSaving] = useState(false)
    const [generatingTitle, setGeneratingTitle] = useState(false)
    const [generatingText, setGeneratingText] = useState(false)
    const [generatingPhoto, setGeneratingPhoto] = useState(false)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)

    // Функция для показа сообщений
    const showMessage = (text, type = 'success') => {
        // Сбрасываем предыдущее сообщение
        setMessage(null);
        
        // Даем время на рендер перед показом нового сообщения
        setTimeout(() => {
            setMessage({ text, type });
            
            // Автоматическое скрытие через 3 секунды
            setTimeout(() => {
                setMessage(null);
            }, 3000);
        }, 10);
    }

    // Автоматическая установка высоты textarea
    useEffect(() => {
        const titleTextarea = document.getElementById('title-textarea')
        const textTextarea = document.getElementById('text-textarea')

        if (titleTextarea) {
            titleTextarea.style.height = 'auto'
            titleTextarea.style.height = titleTextarea.scrollHeight + 'px'
        }

        if (textTextarea) {
            textTextarea.style.height = 'auto'
            textTextarea.style.height = textTextarea.scrollHeight + 'px'
        }
    }, [newsData.title, newsData.text])

    const handleChange = (field, value) => {
        setNewsData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    async function handleSave() {
        if (!newsData.title.trim() || !newsData.text.trim()) {
            showMessage('Заполните заголовок и текст новости', 'error')
            return
        }

        setSaving(true)
        try {
            // Сначала создаем пост
            const postData = await NewsAPI.addPost(newsData.title, newsData.text, newsData.link)

            // Если есть изображение - загружаем его
            if (file) {
                await NewsAPI.uploadPhotoToPost({
                    id: postData.id,
                    img: file
                })
            }

            showMessage('Новость успешно сохранена!')
            setTimeout(() => navigate('/'), 1000) // Возвращаемся на главную с небольшой задержкой
        } catch (e) {
            console.error(e)
            showMessage('Ошибка при сохранении новости', 'error')
        } finally {
            setSaving(false)
        }
    }

    async function handleGenerateTitle() {
        // Если заголовок пустой, используем текст с префиксом
        const sourceText = newsData.title.trim() 
            ? newsData.title 
            : `Сгенерируй заголовок на основе этого текста: ${newsData.text.trim()}`;
        
        if (!sourceText.trim()) {
            showMessage('Введите текст для генерации заголовка', 'error')
            return
        }

        setGeneratingTitle(true)
        try {
            const generatedTitle = await NewsAPI.generatePostTitle(sourceText)

            // Обрабатываем ответ от сервера
            if (generatedTitle) {
                handleChange('title', generatedTitle[0].output.title)
                showMessage('Заголовок успешно сгенерирован!')
            } else {
                showMessage('Неверный формат ответа от сервера', 'error')
            }
        } catch (e) {
            console.error(e)
            showMessage('Ошибка при генерации заголовка', 'error')
        } finally {
            setGeneratingTitle(false)
        }
    }

    async function handleGenerateText() {
        const sourceText = newsData.text.trim() || newsData.title.trim()
        if (!sourceText) {
            showMessage('Введите заголовок или текст для генерации текста', 'error')
            return
        }

        setGeneratingText(true)
        try {
            const generatedText = await NewsAPI.generatePostText(sourceText)

            // Обрабатываем ответ от сервера
            if (generatedText) {
                handleChange('text', generatedText[0].output.text)
                showMessage('Текст успешно сгенерирован!')
            } else {
                showMessage('Неверный формат ответа от сервера', 'error')
            }
        } catch (e) {
            console.error(e)
            showMessage('Ошибка при генерации текста', 'error')
        } finally {
            setGeneratingText(false)
        }
    }

    async function handleGeneratePhoto() {
        if (!newsData.title.trim() && !newsData.text.trim()) {
            showMessage('Введите заголовок или текст для генерации изображения', 'error')
            return
        }

        setGeneratingPhoto(true)
        try {
            // Генерируем промпт на основе заголовка и текста
            const prompt = `${newsData.title} ${newsData.text}`.substring(0, 200)
            const photoData = await NewsAPI.generatePhoto(prompt)
            console.log(photoData)
            if (photoData.image_base64) {
                // Если сервер возвращает base64
                showMessage('Изображение успешно сгенерировано!')

                // Конвертируем base64 в File
                const base64Response = await fetch(`data:image/jpeg;base64,${photoData.image_base64}`)
                const blob = await base64Response.blob()
                const generatedFile = new File([blob], 'generated-image.jpg', { type: 'image/jpeg' })

                setFile(generatedFile)
                setNewsData(prev => ({ ...prev, image: generatedFile }))

            } else {
                showMessage('Неверный формат ответа для изображения', 'error')
            }
        } catch (e) {
            console.error(e)
            showMessage('Ошибка при генерации изображения', 'error')
        } finally {
            setGeneratingPhoto(false)
        }
    }

    async function handleUpload() {
        if (!file) return

        setUploadingPhoto(true)
        try {
            // Для нового поста загрузка произойдет при сохранении
            setNewsData(prev => ({ ...prev, image: file }))
            showMessage('Изображение готово к загрузке')
            setFileOpen(false)
        } catch (e) {
            console.error(e)
            showMessage('Ошибка при загрузке изображения', 'error')
        } finally {
            setUploadingPhoto(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Центральное сообщение */}
            {message && (
                <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className={`px-6 py-4 rounded-md shadow-lg transform transition-all duration-300 ease-in-out pointer-events-auto 
                        ${message.type === 'error'
                            ? 'bg-red-500 text-white'
                            : 'bg-green-500 text-white'
                        }`}
                    >
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
                            onClick={() => (file ? setImagePreviewOpen(true) : setFileOpen(true))}
                        >
                            {file ? (
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt="Предварительный просмотр"
                                    className="w-full object-cover rounded-lg border border-slate-200 dark:border-slate-600 hover:opacity-90 transition-opacity cursor-zoom-in"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-400 dark:text-slate-500 hover:border-blue-400 hover:text-blue-400 transition-colors">
                                    + добавить
                                </div>
                            )}
                        </div>
                        <div className="w-1/4 flex flex-col gap-2">
                            {/* Новая кнопка добавления изображения справа */}
                            <button
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                onClick={() => setFileOpen(true)}
                                disabled={saving || generatingTitle || generatingText || generatingPhoto || uploadingPhoto}
                                title="Добавить изображение"
                            >
                                <Plus size={20} />
                            </button>

                            {/* Кнопка генерации изображения */}
                            <button
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                onClick={handleGeneratePhoto}
                                disabled={saving || generatingTitle || generatingText || generatingPhoto || uploadingPhoto}
                                title="Сгенерировать изображение"
                            >
                                {generatingPhoto ? (
                                    <LoadingSpinner />
                                ) : (
                                    <Openai size={20} />
                                )}
                            </button>

                            {/* Кнопка удаления изображения - теперь внизу */}
                            <button
                                className="inline-flex bg-red-600 h-10 items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm text-white"
                                onClick={() => {
                                    setFile(null)
                                    setNewsData(prev => ({ ...prev, image: null }))
                                }}
                                disabled={!file || saving || generatingTitle || generatingText || generatingPhoto || uploadingPhoto}
                                title={!file ? "Нет изображения для удаления" : "Удалить изображение"}
                            >
                                <Trash size={16} />
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
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 rounded-md p-3 outline-none resize-none"
                        value={newsData.title}
                        onChange={(e) => {
                            handleChange('title', e.target.value)
                            e.target.style.height = 'auto'
                            e.target.style.height = e.target.scrollHeight + 'px'
                        }}
                        placeholder="Введите заголовок новости"
                        style={{ overflow: 'hidden' }}
                        disabled={saving || generatingTitle || generatingText || generatingPhoto || uploadingPhoto}
                    />
                    <div className="flex justify-end">
                        <button
                            className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs w-1/2 min-h-[32px]"
                            onClick={handleGenerateTitle}
                            disabled={saving || generatingTitle || generatingText || generatingPhoto || uploadingPhoto}
                            title="Сгенерировать заголовок"
                        >
                            {generatingTitle ? (
                                <>
                                    <LoadingSpinner size={12} />
                                    Генерация...
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
                        value={newsData.text}
                        onChange={(e) => {
                            handleChange('text', e.target.value)
                            e.target.style.height = 'auto'
                            e.target.style.height = e.target.scrollHeight + 'px'
                        }}
                        placeholder="Введите текст новости"
                        style={{ overflow: 'hidden' }}
                        disabled={saving || generatingTitle || generatingText || generatingPhoto || uploadingPhoto}
                    />
                    <div className="flex justify-end">
                        <button
                            className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs w-1/2 min-h-[32px]"
                            onClick={handleGenerateText}
                            disabled={saving || generatingTitle || generatingText || generatingPhoto || uploadingPhoto}
                            title="Сгенерировать текст"
                        >
                            {generatingText ? (
                                <>
                                    <LoadingSpinner size={12} />
                                    Генерация...
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ссылка на источник</label>
                    <input
                        type="url"
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 rounded-md p-3 outline-none"
                        value={newsData.link}
                        onChange={(e) => handleChange('link', e.target.value)}
                        placeholder="https://example.com"
                        disabled={saving || generatingTitle || generatingText || generatingPhoto || uploadingPhoto}
                    />
                </div>

                {/* Кнопка сохранения */}
                <div className="flex justify-center pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        className="w-full max-w-xs inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 text-white px-4 py-3 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        onClick={handleSave}
                        disabled={saving || generatingTitle || generatingText || generatingPhoto || uploadingPhoto}
                    >
                        {saving ? (
                            <>
                                <LoadingSpinner />
                                <span className="truncate">Сохранение...</span>
                            </>
                        ) : (
                            'Сохранить новость'
                        )}
                    </button>
                </div>
            </div>

            {/* Модальное окно загрузки файла */}
            <Modal open={fileOpen} title="Загрузить изображение" onClose={() => setFileOpen(false)}>
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
                    {file && (
                        <img
                            src={URL.createObjectURL(file)}
                            alt="Просмотр изображения"
                            className="w-full"
                        />
                    )}
                </div>
            </Modal>
        </div>
    )
}