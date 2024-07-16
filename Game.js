class Game {
	constructor(pieces) {
		this.pieces = pieces;
		this.turn = 'white';
		this.clickedPiece = null;
		this.lastMove = null;
		this._events = {
			pieceMove: [],
			kill: [],
			check: [],
			promotion: [],
			checkMate: [],
			turnChange: [],
			enPassant: [],
			castling: []
		};
	}

	clearEvents() {
		this._events = {};
	}

	on(eventName, callback) {
		if (this._events[eventName] && typeof callback === 'function') {
			this._events[eventName].push(callback);
		}
	}

	changeTurn() {
		this.turn = this.turn === 'white' ? 'black' : 'white';
		this.triggerEvent('turnChange', this.turn);
		debugLog(`Turn changed to ${this.turn}`);
	}

	getPiecesByColor(color) {
		return this.pieces.filter(obj => obj.color === color);
	}

	getPlayerPositions(color) {
		const pieces = this.getPiecesByColor(color);
		return pieces.map(a => ({ x: a.x, y: a.y }));
	}

	filterPositions(positions) {
		return positions.filter(pos => pos.x >= 1 && pos.x <= 8 && pos.y >= 1 && pos.y <= 8);
	}

	unblockedPositions(piece, allowedPositions, checking = true) {
		const unblockedPositions = [];

		let myBlockedPositions;
		let otherBlockedPositions;
		if (piece.color === 'white') {
			myBlockedPositions = this.getPlayerPositions('white');
			otherBlockedPositions = this.getPlayerPositions('black');
		} else {
			myBlockedPositions = this.getPlayerPositions('black');
			otherBlockedPositions = this.getPlayerPositions('white');
		}

		if (piece.hasRank('knight')) {
			// El caballo no es bloqueado por otras piezas
			for (const move of allowedPositions[0]) {
				if (checking && this.myKingChecked(move)) continue;
				unblockedPositions.push(move);
			}
		} else if (piece.hasRank('king')) {
			// El rey no puede moverse a una casilla atacada por una pieza enemiga
			for (const move of allowedPositions[0]) {
				if (checking && this.myKingChecked(move)) continue;
				if (otherBlockedPositions.some(p => p.x === move.x && p.y === move.y)) continue;
				unblockedPositions.push(move);
			}
		} else if (piece.hasRank('pawn')) {
			// Movimientos de captura del peón
			for (const move of allowedPositions[0]) {
				if (checking && this.myKingChecked(move)) continue;
				if (otherBlockedPositions.some(p => p.x === move.x && p.y === move.y)) {
					unblockedPositions.push(move);
				}
			}
			// Movimientos normales del peón
			const blockedPositions = [...myBlockedPositions, ...otherBlockedPositions];
			for (const move of allowedPositions[1]) {
				if (blockedPositions.some(p => p.x === move.x && p.y === move.y)) {
					break;
				} else if (checking && this.myKingChecked(move, false)) continue;
				unblockedPositions.push(move);
			}
			// Agregar movimientos de captura al paso
			const enPassantMoves = piece.getEnPassantMoves(this.lastMove);
			for (const move of enPassantMoves) {
				unblockedPositions.push(move);
			}
		} else {
			allowedPositions.forEach((allowedPositionsGroup) => {
				for (const move of allowedPositionsGroup) {
					if (myBlockedPositions.some(p => p.x === move.x && p.y === move.y)) {
						break;
					} else if (checking && this.myKingChecked(move)) {
						if (otherBlockedPositions.some(p => p.x === move.x && p.y === move.y)) {
							break;
						}
						continue;
					}
					unblockedPositions.push(move);
					if (otherBlockedPositions.some(p => p.x === move.x && p.y === move.y)) {
						break;
					}
				}
			});
		}

		return this.filterPositions(unblockedPositions);
	}

	getPieceAllowedMoves(pieceName) {
		const piece = this.getPieceByName(pieceName);
		if (!piece) {
			console.error(`Piece with name ${pieceName} not found`);
			return [];
		}
		if (this.turn === piece.color) {
			this.setClickedPiece(piece);

			let pieceAllowedMoves = piece.getAllowedMoves();
			if (piece.rank === 'king') {
				pieceAllowedMoves = this.getCastlingSquares(piece, pieceAllowedMoves);
			}

			if (piece.rank === 'pawn') {
				const enPassantMoves = piece.getEnPassantMoves(this.lastMove);
				pieceAllowedMoves[1] = pieceAllowedMoves[1].concat(enPassantMoves);
			}

			const unblockedPositions = this.unblockedPositions(piece, pieceAllowedMoves, true);
			console.log(`Allowed moves for ${piece.name}:`, unblockedPositions);
			return unblockedPositions;
		} else {
			return [];
		}
	}

	getCastlingSquares(king, allowedMoves) {
		if (!king.ableToCastle || this.king_checked(this.turn)) return allowedMoves;
		const rook1 = this.getPieceByName(this.turn + 'Rook1');
		const rook2 = this.getPieceByName(this.turn + 'Rook2');
		if (rook1 && rook1.ableToCastle) {
			const castlingPosition = { x: rook1.x - 2, y: rook1.y };
			if (
				!this.positionHasExistingPiece({ x: castlingPosition.x + 1, y: castlingPosition.y }) &&
				!this.positionHasExistingPiece({ x: castlingPosition.x, y: castlingPosition.y }) &&
				!this.myKingChecked({ x: castlingPosition.x, y: castlingPosition.y }) &&
				!this.positionHasExistingPiece({ x: castlingPosition.x - 1, y: castlingPosition.y }) &&
				!this.myKingChecked({ x: castlingPosition.x - 1, y: castlingPosition.y })
			) allowedMoves[1].push(castlingPosition);
		}
		if (rook2 && rook2.ableToCastle) {
			const castlingPosition = { x: rook2.x + 1, y: rook2.y };
			if (
				!this.positionHasExistingPiece({ x: castlingPosition.x - 1, y: castlingPosition.y }) &&
				!this.myKingChecked({ x: castlingPosition.x - 1, y: castlingPosition.y }) &&
				!this.positionHasExistingPiece({ x: castlingPosition.x, y: castlingPosition.y }) &&
				!this.myKingChecked({ x: castlingPosition.x, y: castlingPosition.y })
			) allowedMoves[0].push(castlingPosition);
		}
		return allowedMoves;
	}

	getPieceByName(piecename) {
		return this.pieces.find(obj => obj.name === piecename);
	}

	getPieceByPos(x, y) {
		return this.pieces.find(obj => obj.x === x && obj.y === y);
	}

	positionHasExistingPiece(position) {
		return this.getPieceByPos(position.x, position.y) !== undefined;
	}

	setClickedPiece(piece) {
		this.clickedPiece = piece;
	}

	triggerEvent(eventName, params) {
		if (this._events[eventName]) {
			for (const cb of this._events[eventName]) {
				cb(params);
			}
		}
	}

	movePiece(pieceName, position) {
		const piece = this.getPieceByName(pieceName);
		const prevPosition = { x: piece.x, y: piece.y };
		const newPosition = position;

		if (piece && this.getPieceAllowedMoves(piece.name).some(pos => pos.x === newPosition.x && pos.y === newPosition.y)) {
			const existedPiece = this.getPieceByPos(newPosition.x, newPosition.y);

			let enPassantCapture = false;
			let opponentPawnPos = null;
			if (piece.rank === 'pawn' && !existedPiece) {
				const enPassantMoves = piece.getEnPassantMoves(this.lastMove);
				if (enPassantMoves.some(pos => pos.x === newPosition.x && pos.y === newPosition.y)) {
					opponentPawnPos = this.lastMove.to;
					const opponentPawn = this.getPieceByPos(opponentPawnPos.x, opponentPawnPos.y);
					this.kill(opponentPawn);
					enPassantCapture = true;
					this.triggerEvent('enPassant', { piece, opponentPawnPos });
				}
			}

			if (existedPiece) {
				this.kill(existedPiece);
			}

			if (!existedPiece && piece.hasRank('king') && piece.ableToCastle === true) {
				if (newPosition.x - prevPosition.x === 2) {
					this.castleRook(piece.color + 'Rook2');
				} else if (newPosition.x - prevPosition.x === -2) {
					this.castleRook(piece.color + 'Rook1');
				}
				piece.changePosition(newPosition.x, newPosition.y, true);
				this.triggerEvent('castling', { king: piece, rook: this.getPieceByName(piece.color + 'Rook' + (newPosition.x - prevPosition.x === 2 ? 2 : 1)) });
			} else {
				piece.changePosition(newPosition.x, newPosition.y);
				if (piece.hasRank('king')) {
					piece.ableToCastle = false;
				}
			}

			if (piece.rank === 'pawn' && Math.abs(newPosition.y - prevPosition.y) === 2) {
				this.lastMove = { piece: piece, from: prevPosition, to: newPosition };
			} else {
				this.lastMove = { piece: piece, from: prevPosition, to: newPosition };
			}

			this.triggerEvent('pieceMove', piece);

			if (piece.rank === 'pawn' && (newPosition.y === 1 || newPosition.y === 8)) {
				this.promote(piece);
			}

			this.changeTurn();

			if (this.king_checked(this.turn)) {
				this.triggerEvent('check', this.turn);

				if (this.king_dead(this.turn)) {
					this.checkmate(piece.color);
				}
			}

			if (enPassantCapture && opponentPawnPos) {
				this.triggerEvent('enPassantCapture', { piece, opponentPawnPos });
			}

			return true;
		} else {
			return false;
		}
	}

	kill(piece) {
		this.pieces = this.pieces.filter(p => p !== piece);
		this.triggerEvent('kill', piece);
	}

	castleRook(rookName) {
		const rook = this.getPieceByName(rookName);
		const newPosition = rookName.includes('Rook2') ? { x: rook.x - 2, y: rook.y } : { x: rook.x + 3, y: rook.y };

		this.setClickedPiece(rook);

		rook.changePosition(newPosition.x, newPosition.y);
		this.triggerEvent('pieceMove', rook);
	}

	promote(pawn) {
		const queenName = pawn.name.replace('Pawn', 'Queen');
		this.pieces = this.pieces.filter(p => p !== pawn);
		const queen = new Queen(pawn.x, pawn.y, queenName);
		this.pieces.push(queen);
		this.triggerEvent('promotion', queen);

		const square = document.getElementById(`${queen.x}-${queen.y}`);
		square.innerHTML = `<img class="piece queen" id="${queen.name}" src="img/${queen.color}-queen.png">`;
	}

	myKingChecked(pos, kill = true) {
		const piece = this.clickedPiece;
		const originalPosition = { x: piece.x, y: piece.y };
		const otherPiece = this.getPieceByPos(pos.x, pos.y);
		const should_kill_other_piece = kill && otherPiece && otherPiece.rank !== 'king';
		piece.changePosition(pos.x, pos.y);
		if (should_kill_other_piece) this.pieces = this.pieces.filter(p => p !== otherPiece);
		if (this.king_checked(piece.color)) {
			piece.changePosition(originalPosition.x, originalPosition.y);
			if (should_kill_other_piece) {
				this.pieces.push(otherPiece);
			}
			return 1;
		} else {
			piece.changePosition(originalPosition.x, originalPosition.y);
			if (should_kill_other_piece) this.pieces.push(otherPiece);
			return 0;
		}
	}

	king_dead(color) {
		const pieces = this.getPiecesByColor(color);
		for (const piece of pieces) {
			this.setClickedPiece(piece);
			const allowedMoves = this.unblockedPositions(piece, piece.getAllowedMoves(), true);
			if (allowedMoves.length) {
				this.setClickedPiece(null);
				return 0;
			}
		}
		this.setClickedPiece(null);
		return 1;
	}

	king_checked(color) {
		const piece = this.clickedPiece;
		const king = this.getPieceByName(color + 'King');
		const enemyColor = color === 'white' ? 'black' : 'white';
		const enemyPieces = this.getPiecesByColor(enemyColor);
		for (const enemyPiece of enemyPieces) {
			this.setClickedPiece(enemyPiece);
			const allowedMoves = this.unblockedPositions(enemyPiece, enemyPiece.getAllowedMoves(), false);
			if (allowedMoves.some(pos => pos.x === king.x && pos.y === king.y)) {
				this.setClickedPiece(piece);
				return 1;
			}
		}
		this.setClickedPiece(piece);
		return 0;
	}

	checkmate(color) {
		this.triggerEvent('checkMate', color);
		this.clearEvents();
	}
}

const isDebugMode = true;

function debugLog(message) {
	if (isDebugMode) {
		console.log(message);
	}
}