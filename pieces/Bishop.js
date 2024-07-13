class Bishop extends Piece {
	constructor(x, y, name) {
		super(x, y, 'bishop', name);
	}

	getAllowedMoves() {
		return [
			this.getMovesTopRight(),
			this.getMovesTopLeft(),
			this.getMovesBottomRight(),
			this.getMovesBottomLeft()
		];
	}
}