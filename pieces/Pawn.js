class Pawn extends Piece {
	constructor(x, y, name) {
		super(x, y, 'pawn', name);
	}

	getAllowedMoves() {
		let allowedMoves = [[], []]; // [attacking moves, moving moves]

		const direction = this.color === 'white' ? 1 : -1;
		const startRow = this.color === 'white' ? 1 : 6;

		// Movimientos de ataque
		allowedMoves[0].push({ x: this.x + 1, y: this.y + direction });
		allowedMoves[0].push({ x: this.x - 1, y: this.y + direction });

		// Movimientos normales
		allowedMoves[1].push({ x: this.x, y: this.y + direction });
		if (this.y === startRow) {
			allowedMoves[1].push({ x: this.x, y: this.y + 2 * direction });
		}

		return allowedMoves;
	}

	getEnPassantMoves(lastMove) {
		let enPassantMoves = [];

		if (!lastMove || lastMove.piece.rank !== 'pawn') return enPassantMoves;

		const direction = this.color === 'white' ? 1 : -1;
		const startRow = this.color === 'white' ? 4 : 3;
		const opponentColor = this.color === 'white' ? 'black' : 'white';

		if (this.y === startRow && lastMove.piece.color === opponentColor &&
			Math.abs(lastMove.to.y - lastMove.from.y) === 2 &&
			Math.abs(this.x - lastMove.to.x) === 1) {
			enPassantMoves.push({ x: lastMove.to.x, y: this.y + direction });
		}

		return enPassantMoves;
	}
}