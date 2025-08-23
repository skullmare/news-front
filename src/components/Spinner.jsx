export default function Spinner({ size = 24 }) {
	const dimension = typeof size === 'number' ? `${size}px` : size
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<svg className="animate-spin text-blue-600 dark:text-blue-400" style={{ width: dimension, height: dimension }} viewBox="0 0 24 24">
				<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
				<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
			</svg>
		</div>
	)
}