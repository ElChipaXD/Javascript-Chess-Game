class King extends Piece {
	constructor(x, y, name) {
		super(x, y, 'king', name);
		this.ableToCastle = true;
	}

	getAllowedMoves() {
		const moves = [];
		const potentialMoves = [
			{ x: this.x + 1, y: this.y },
			{ x: this.x - 1, y: this.y },
			{ x: this.x, y: this.y + 1 },
			{ x: this.x, y: this.y - 1 },
			{ x: this.x + 1, y: this.y + 1 },
			{ x: this.x - 1, y: this.y - 1 },
			{ x: this.x + 1, y: this.y - 1 },
			{ x: this.x - 1, y: this.y + 1 }
		];
		for (const move of potentialMoves) {
			if (move.x >= 0 && move.x < 8 && move.y >= 0 && move.y < 8) {
				moves.push(move);
			}
		}
		return [moves];
	}

	changePosition(x, y, castle = false) {
		this.x = x;
		this.y = y;
		if (castle) {
			this.ableToCastle = false;
		}
	}
}