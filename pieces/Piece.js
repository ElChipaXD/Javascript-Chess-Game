class Piece {
	constructor(x, y, rank, name) {
		this.x = x;
		this.y = y;
		this.rank = rank;
		this.name = name;
		this.color = this.name.substring(0, 5);
	}

	hasRank(rank) {
		return this.rank === rank;
	}

	changePosition(x, y) {
		this.x = x;
		this.y = y;
	}

	getAllowedMoves() {
		return [];
	}

	getMovesTop() {
		const moves = [];
		for (let y = this.y + 1; y <= 8; y++) {
			moves.push({ x: this.x, y });
		}
		return moves;
	}

	getMovesBottom() {
		const moves = [];
		for (let y = this.y - 1; y >= 1; y--) {
			moves.push({ x: this.x, y });
		}
		return moves;
	}

	getMovesRight() {
		const moves = [];
		for (let x = this.x + 1; x <= 8; x++) {
			moves.push({ x, y: this.y });
		}
		return moves;
	}

	getMovesLeft() {
		const moves = [];
		for (let x = this.x - 1; x >= 1; x--) {
			moves.push({ x, y: this.y });
		}
		return moves;
	}

	getMovesTopRight() {
		const moves = [];
		let x = this.x + 1;
		let y = this.y + 1;
		while (x <= 8 && y <= 8) {
			moves.push({ x, y });
			x++;
			y++;
		}
		return moves;
	}

	getMovesTopLeft() {
		const moves = [];
		let x = this.x - 1;
		let y = this.y + 1;
		while (x >= 1 && y <= 8) {
			moves.push({ x, y });
			x--;
			y++;
		}
		return moves;
	}

	getMovesBottomRight() {
		const moves = [];
		let x = this.x + 1;
		let y = this.y - 1;
		while (x <= 8 && y >= 1) {
			moves.push({ x, y });
			x++;
			y--;
		}
		return moves;
	}

	getMovesBottomLeft() {
		const moves = [];
		let x = this.x - 1;
		let y = this.y - 1;
		while (x >= 1 && y >= 1) {
			moves.push({ x, y });
			x--;
			y--;
		}
		return moves;
	}
}