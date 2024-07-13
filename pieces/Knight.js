class Knight extends Piece {
	constructor(x, y, name) {
		super(x, y, 'knight', name);
	}

	getAllowedMoves() {
		const moves = [];
		const potentialMoves = [
			{ x: this.x + 2, y: this.y + 1 },
			{ x: this.x + 2, y: this.y - 1 },
			{ x: this.x - 2, y: this.y + 1 },
			{ x: this.x - 2, y: this.y - 1 },
			{ x: this.x + 1, y: this.y + 2 },
			{ x: this.x + 1, y: this.y - 2 },
			{ x: this.x - 1, y: this.y + 2 },
			{ x: this.x - 1, y: this.y - 2 }
		];

		for (const move of potentialMoves) {
			if (move.x >= 1 && move.x <= 8 && move.y >= 1 && move.y <= 8) {
				moves.push(move);
			}
		}

		return [moves];
	}
}