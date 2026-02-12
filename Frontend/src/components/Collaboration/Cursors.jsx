const CursorTag = ({ cursor }) => {
	const { x, y, color, username } = cursor;
	const safeName = username || 'User';

	return (
		<div
			className="absolute pointer-events-none"
			style={{
				left: `${x * 100}%`,
				top: `${y * 100}%`,
				transform: 'translate(6px, 6px)'
			}}
		>
			<div className="flex items-center gap-2">
				<div
					className="h-2.5 w-2.5 rounded-full"
					style={{ backgroundColor: color }}
				></div>
				<div
					className="rounded-md px-2 py-1 text-[10px] font-semibold text-slate-900 shadow-lg"
					style={{ backgroundColor: color }}
				>
					{safeName}
				</div>
			</div>
		</div>
	);
};

function Cursors({ cursors = [] }) {
	if (!cursors.length) return null;

	return (
		<div className="absolute inset-0 pointer-events-none">
			{cursors.map((cursor) => (
				<CursorTag key={cursor.userId} cursor={cursor} />
			))}
		</div>
	);
}

export default Cursors;
