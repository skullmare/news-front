import { Link } from 'react-router-dom'
import { ArrowRepeat, Check, Trash } from 'react-bootstrap-icons'

export default function PostCard({ post, onPublish, onDelete, onRegen }) {
	const { id, title, text, img_url, pub_date, link, status } = post
	const pubDate = pub_date ? new Date(pub_date) : null
	return (
		<div className="rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
			{/* Top row: image + title */}
			<div className="flex items-start gap-4">
				{img_url ? (
					<img src={img_url} alt={title} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md" loading="lazy" />
				) : (
					<div className="w-20 h-20 sm:w-24 sm:h-24 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
				)}
				<Link to={`/post/${id}`} className="flex-1 min-w-0 block text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1">
					{title || 'Без заголовка'}
				</Link>
			</div>

			{/* Bottom block: text, meta, actions */}
			<div className="mt-3">
				<p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
					{text || ''}
				</p>
				<div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
					{pubDate && <span>{pubDate.toLocaleString()}</span>}
					{link && (
						<a href={link} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400">Источник</a>
					)}
					{status && <span className="px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">{status}</span>}
				</div>
				<div className="mt-3 grid grid-cols-3 gap-2 w-full">
					{/* Кнопка перегенерации - синяя */}
					<button
						onClick={() => onRegen(id)}
						className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center w-full"
						title="Перегенерировать"
					>
						<ArrowRepeat size={16} />
					</button>

					{/* Кнопка публикации */}
					<button
						onClick={() => onPublish(id)}
						className="p-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center w-full"
						title="Опубликовать"
					>
						<Check size={16} />
					</button>

					{/* Кнопка удаления */}
					<button
						onClick={() => onDelete(id)}
						className="p-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center w-full"
						title="Удалить"
					>
						<Trash size={16} />
					</button>
				</div>
			</div>
		</div>
	)
}