import { createPortal } from 'react-dom'

export default function Modal({ open, title, children, onClose }) {
	if (!open) return null
	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
			<div className="relative w-[90%] max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 sm:p-6 text-slate-900 dark:text-slate-100">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{title}</h3>
					<button onClick={onClose} className="p-2 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Закрыть">
						✕
					</button>
				</div>
				<div>
					{children}
				</div>
			</div>
		</div>,
		document.body,
	)
} 