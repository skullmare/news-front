import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChannelsAPI, SettingsAPI } from '../lib/api.js'
import { ParsingAPI } from '../lib/api.js'
import Modal from '../components/Modal.jsx'
import LoadingSpinner from '../components/LoadingSpinner'
import AutoParsingToggle from '../components/AutoParsingToggle';
import {
  ArrowClockwise,
  Trash,
  Plus,
  Check,
  BrowserChrome,
  Telegram,
  X
} from 'react-bootstrap-icons'

// Кастомный хук для автоматического изменения высоты textarea
const useAutoResizeTextarea = (value) => {
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      // Сброс высоты для получения правильного scrollHeight
      textareaRef.current.style.height = 'auto'
      // Установка высоты based on scrollHeight
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  return textareaRef
}

export default function Settings() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [promptTitle, setPromptTitle] = useState('')
  const [promptText, setPromptText] = useState('')
  const [promptImg, setPromptImg] = useState('')
  const [countNews, setCountNews] = useState('0')
  const [countNewsParsing, setCountNewsParsing] = useState('0')
  const [channels, setChannels] = useState([])
  const [newChannel, setNewChannel] = useState('')
  const [confirmChannel, setConfirmChannel] = useState({ open: false, id: null, url: '' })
  const [message, setMessage] = useState(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Рефы для автоматического изменения высоты textarea
  const promptRef = useAutoResizeTextarea(prompt)
  const promptTitleRef = useAutoResizeTextarea(promptTitle)
  const promptTextRef = useAutoResizeTextarea(promptText)
  const promptImgRef = useAutoResizeTextarea(promptImg)

  // Состояние загрузки для сохранения всех настроек
  const [savingSettings, setSavingSettings] = useState(false)
  const [addingChannel, setAddingChannel] = useState(false)
  const [removingChannel, setRemovingChannel] = useState(false)

  useEffect(() => {
    let canceled = false
    async function load() {
      try {
        const s = await SettingsAPI.getSettings()
        if (!canceled) {
          setPrompt(s?.prompt || '')
          setPromptTitle(s?.prompt_title || '')
          setPromptText(s?.prompt_text || '')
          setPromptImg(s?.prompt_img || '')
          setCountNews(Number(s?.count_news || '0'))
          setCountNewsParsing(Number(s?.count_news_parsing || '0'))
        }
        const ch = await ChannelsAPI.list()
        if (!canceled) setChannels(ch || [])
        if (!canceled) setLoadingSettings(false)
      } catch (e) {
        console.error(e)
        showMessage('Ошибка при загрузке настроек', 'error')
        if (!canceled) setLoadingSettings(false)
      }
    }
    load()
    return () => {
      canceled = true
    }
  }, [])

  // Функция для показа сообщений по центру экрана
  const showMessage = (text, type = 'success') => {
    setMessage(null)
    setTimeout(() => {
      setMessage({ text, type })
      setTimeout(() => setMessage(null), 3000)
    }, 10)
  }

  async function saveAllSettings() {
    setSavingSettings(true)
    try {
      await Promise.all([
        SettingsAPI.setPrompt(prompt),
        SettingsAPI.setPromptTitle(promptTitle),
        SettingsAPI.setPromptText(promptText),
        SettingsAPI.setPromptImg(promptImg),
        SettingsAPI.setCountNews(countNews),
        SettingsAPI.setCountNewsParsing(countNewsParsing)
      ])
      showMessage('Все настройки успешно сохранены!')
      setTimeout(() => navigate('/'), 800)
    } catch (e) {
      console.error(e)
      showMessage('Ошибка при сохранении настроек', 'error')
    } finally {
      setSavingSettings(false)
    }
  }

  async function addChannel() {
    setAddingChannel(true)
    try {
      await ChannelsAPI.add({ url: newChannel })
      setNewChannel('')
      const ch = await ChannelsAPI.list()
      setChannels(ch || [])
      showMessage('Канал успешно добавлен!')
    } catch (e) {
      console.error(e)
      showMessage('Ошибка при добавлении канала', 'error')
    } finally {
      setAddingChannel(false)
    }
  }

  async function removeChannel(id) {
    setRemovingChannel(true)
    try {
      await ChannelsAPI.remove(id)
      const ch = await ChannelsAPI.list()
      setChannels(ch || [])
      showMessage('Канал успешно удален!')
    } catch (e) {
      console.error(e)
      showMessage('Ошибка при удалении канала', 'error')
    } finally {
      setRemovingChannel(false)
    }
  }

  async function handleConfirmRemoveChannel() {
    const { id } = confirmChannel
    await removeChannel(id)
    setConfirmChannel({ open: false, id: null, url: '' })
  }

  return (
    <div className="space-y-6">
      {/* Панель управления парсингом */}
      <div className="rounded-xl p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2 w-full">
          <button
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loadingSettings || savingSettings}
            onClick={async () => {
              try {
                const res = await ParsingAPI.startSiteParsing()
                if (res?.status === 'close') {
                  showMessage('Парсинг уже запущен', 'error')
                } else if (res?.status === 'ok') {
                  showMessage('Парсинг завершился')
                } else {
                  showMessage('Неожиданный ответ сервера', 'error')
                }
              } catch (e) {
                console.error(e)
                showMessage('Ошибка запуска парсинга сайтов', 'error')
              }
            }}
          >
            <BrowserChrome size={35} /> Парсинг сайтов
          </button>
          <button
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loadingSettings || savingSettings}
            onClick={async () => {
              try {
                const res = await ParsingAPI.startTgParsing()
                if (res?.status === 'close') {
                  showMessage('Парсинг уже запущен', 'error')
                } else if (res?.status === 'ok') {
                  showMessage('Парсинг завершился')
                } else {
                  showMessage('Неожиданный ответ сервера', 'error')
                }
              } catch (e) {
                console.error(e)
                showMessage('Ошибка запуска парсинга Telegram', 'error')
              }
            }}
          >
            <Telegram size={35} /> Парсинг Telegram
          </button>
          
        </div>
        <div className="flex">
          {/* Переключатель автопарсинга */}
          <AutoParsingToggle loadingSettings={loadingSettings} />
        </div>
      </div>
      {/* Центральное сообщение */}
      {message && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className={`px-6 py-4 rounded-md shadow-lg transform transition-all duration-300 ease-in-out pointer-events-auto ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
            {message.text}
          </div>
        </div>
      )}

      <div className="rounded-xl p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-semibold mb-4">Настройки промптов</h3>
        <div className="grid gap-6">
          <label className="grid gap-2">
            <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {loadingSettings && <LoadingSpinner />}
              Системный промпт
            </span>
            <textarea
              ref={promptRef}
              className="w-full min-h-[80px] rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-3 outline-none resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={savingSettings || loadingSettings}
              rows={3}
            />
          </label>

          <label className="grid gap-2">
            <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {loadingSettings && <LoadingSpinner />}
              Промпт для заголовка
            </span>
            <textarea
              ref={promptTitleRef}
              className="w-full min-h-[80px] rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-3 outline-none resize-none"
              value={promptTitle}
              onChange={(e) => setPromptTitle(e.target.value)}
              disabled={savingSettings || loadingSettings}
              rows={3}
            />
          </label>

          <label className="grid gap-2">
            <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {loadingSettings && <LoadingSpinner />}
              Промпт для текста
            </span>
            <textarea
              ref={promptTextRef}
              className="w-full min-h-[80px] rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-3 outline-none resize-none"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              disabled={savingSettings || loadingSettings}
              rows={3}
            />
          </label>

          <label className="grid gap-2">
            <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {loadingSettings && <LoadingSpinner />}
              Промпт для изображения
            </span>
            <textarea
              ref={promptImgRef}
              className="w-full min-h-[80px] rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-3 outline-none resize-none"
              value={promptImg}
              onChange={(e) => setPromptImg(e.target.value)}
              disabled={savingSettings || loadingSettings}
              rows={3}
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-semibold mb-4">Настройки количества новостей</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {loadingSettings && <LoadingSpinner />}
              Количество новостей на главной странице:
            </span>
            <input
              type="number"
              min={1}
              className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-2 outline-none"
              value={countNews}
              onChange={(e) => setCountNews(Number(e.target.value))}
              disabled={savingSettings || loadingSettings}
            />
          </label>

          <label className="grid gap-2">
            <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {loadingSettings && <LoadingSpinner />}
              Количество собираемых новостей:
            </span>
            <input
              type="number"
              min={1}
              className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-2 outline-none"
              value={countNewsParsing}
              onChange={(e) => setCountNewsParsing(Number(e.target.value))}
              disabled={savingSettings || loadingSettings}
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-semibold mb-4">
          Телеграм-каналы для парсинга
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <label className="grid gap-2 flex-1">
            <span className="text-sm text-slate-500 dark:text-slate-400">Ссылка на канал</span>
            <input
              className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 p-2 outline-none"
              placeholder="https://t.me/..."
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              disabled={addingChannel || loadingSettings}
            />
          </label>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={addChannel}
            disabled={!newChannel || addingChannel || loadingSettings}
          >
            {addingChannel ? (
              <>
                <LoadingSpinner />
                Добавление...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Добавить
              </>
            )}
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {channels.map((c) => {
            const channelUrl = c?.url ?? c?.link ?? ''
            return (
              <li key={c.id} className="flex items-center justify-between gap-2">
                <a href={channelUrl} target="_blank" rel="noreferrer" className="flex-1 min-w-0 underline underline-offset-4 truncate">{channelUrl}</a>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 text-white px-3 py-1.5 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setConfirmChannel({ open: true, id: c.id, url: channelUrl })}
                  disabled={removingChannel}
                >
                  <Trash className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Единая кнопка сохранения всех настроек */}
      {!loadingSettings && (
        <div className="sticky bottom-6 z-10 flex justify-center">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 text-white px-6 py-3 transition disabled:bg-blue-800 disabled:cursor-not-allowed shadow-lg"
            disabled={savingSettings}
            onClick={saveAllSettings}
          >
            {savingSettings ? (
              <>
                <LoadingSpinner />
                Сохранение всех настроек...
              </>
            ) : (
              'Сохранить все настройки'
            )}
          </button>
        </div>
      )}

      <Modal open={confirmChannel.open} title="Удалить канал?" onClose={() => setConfirmChannel({ open: false, id: null, url: '' })}>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Вы уверены, что хотите удалить канал: <span className="font-medium">{confirmChannel.url}</span>?</p>
        <div className="flex justify-end gap-2">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setConfirmChannel({ open: false, id: null, url: '' })}
            disabled={removingChannel}
          >
            <X className="h-4 w-4" />
            Отмена
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConfirmRemoveChannel}
            disabled={removingChannel}
          >
            {removingChannel ? (
              <>
                <LoadingSpinner />
                Удаление...
              </>
            ) : (
              <>
                <Trash className="h-4 w-4" />
                Удалить
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  )
}