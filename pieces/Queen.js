class Queen extends Piece {
	constructor(x, y, name) {
		super(x, y, 'queen', name);
	}

	getAllowedMoves() {
		return [
			this.getMovesTop(),
			this.getMovesTopRight(),
			this.getMovesTopLeft(),
			this.getMovesBottom(),
			this.getMovesBottomRight(),
			this.getMovesBottomLeft(),
			this.getMovesRight(),
			this.getMovesLeft()
		];
	}
}