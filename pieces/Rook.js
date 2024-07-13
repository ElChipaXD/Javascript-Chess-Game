class Rook extends Piece {
	constructor(x, y, name) {
		super(x, y, 'rook', name);
		this.ableToCastle = true;
	}

	changePosition(x, y) {
		this.x = x;
		this.y = y;
		this.ableToCastle = false;
	}

	getAllowedMoves() {
		return [
			this.getMovesTop(),
			this.getMovesBottom(),
			this.getMovesRight(),
			this.getMovesLeft()
		];
	}
}