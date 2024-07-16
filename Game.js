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
				if (myBlockedPositions.some(p => p.x === move.x && p.y === move.y)) continue;
				unblockedPositions.push(move);
			}
		} else if (piece.hasRank('king')) {
			// El rey no puede moverse a una casilla atacada por una pieza enemiga
			for (const move of allowedPositions[0]) {
				if (checking && this.myKingChecked(move)) continue;
				if (myBlockedPositions.some(p => p.x === move.x && p.y === move.y)) continue;
				unblockedPositions.push(move);
			}
			// Verificamos que las posiciones de enroque no se eliminen
			if (allowedPositions[1]) {
				for (const move of allowedPositions[1]) {
					debugLog(`Checking castling move for king: ${JSON.stringify(move)}`);
					unblockedPositions.push(move);
				}
			}
		} else if (piece.hasRank('pawn')) {
			// Movimientos de captura del peón
			if (allowedPositions[0]) {
				for (const move of allowedPositions[0]) {
					if (checking && this.myKingChecked(move)) continue;
					if (otherBlockedPositions.some(p => p.x === move.x && p.y === move.y)) {
						unblockedPositions.push(move);
					}
				}
			}
			// Movimientos normales del peón
			const blockedPositions = [...myBlockedPositions, ...otherBlockedPositions];
			if (allowedPositions[1]) {
				for (const move of allowedPositions[1]) {
					if (blockedPositions.some(p => p.x === move.x && p.y === move.y)) {
						break;
					} else if (checking && this.myKingChecked(move, false)) continue;
					unblockedPositions.push(move);
				}
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
				if (pieceAllowedMoves[1]) {
					pieceAllowedMoves[1] = pieceAllowedMoves[1].concat(enPassantMoves);
				}
			}

			const unblockedPositions = this.unblockedPositions(piece, pieceAllowedMoves, true);
			console.log(`Allowed moves for ${piece.name}:`, unblockedPositions);
			return unblockedPositions;
		} else {
			return [];
		}
	}

	getCastlingSquares(king, allowedMoves) {
		if (!king.ableToCastle || this.king_checked(this.turn)) {
			debugLog(`King cannot castle: ableToCastle=${king.ableToCastle}, king_checked=${this.king_checked(this.turn)}`);
			return allowedMoves;
		}

		const rook1 = this.getPieceByName(this.turn + 'Rook1'); // Enroque largo
		const rook2 = this.getPieceByName(this.turn + 'Rook2'); // Enroque corto
		if (!allowedMoves[0]) allowedMoves[0] = [];
		if (!allowedMoves[1]) allowedMoves[1] = [];

		// Enroque corto (rey lado rey)
		if (rook2 && rook2.ableToCastle) {
			const castlingPosition = { x: king.x + 2, y: king.y };
			const between1 = { x: king.x + 1, y: king.y };
			const between2 = { x: king.x + 2, y: king.y };

			debugLog(`Checking short castling conditions: positionHasExistingPiece between1=${this.positionHasExistingPiece(between1)}, between2=${this.positionHasExistingPiece(between2)}, myKingChecked between1=${this.myKingChecked(between1, false)}, between2=${this.myKingChecked(between2, false)}`);

			if (
				!this.positionHasExistingPiece(between1) &&
				!this.positionHasExistingPiece(between2) &&
				!this.myKingChecked(between1, false) &&
				!this.myKingChecked(between2, false)
			) {
				allowedMoves[0].push(castlingPosition);
				debugLog(`Short castling is allowed`);
			} else {
				debugLog(`Cannot castle short: positionHasExistingPiece between1=${this.positionHasExistingPiece(between1)}, between2=${this.positionHasExistingPiece(between2)}, myKingChecked between1=${this.myKingChecked(between1, false)}, between2=${this.myKingChecked(between2, false)}`);
			}
		} else {
			debugLog(`Rook2 cannot castle: rook2=${rook2}, ableToCastle=${rook2?.ableToCastle}`);
		}

		// Enroque largo (rey lado dama)
		if (rook1 && rook1.ableToCastle) {
			const castlingPosition = { x: king.x - 2, y: king.y };
			const between1 = { x: king.x - 1, y: king.y };
			const between2 = { x: king.x - 2, y: king.y };

			debugLog(`Checking long castling conditions: positionHasExistingPiece between1=${this.positionHasExistingPiece(between1)}, between2=${this.positionHasExistingPiece(between2)}, myKingChecked between1=${this.myKingChecked(between1, false)}, between2=${this.myKingChecked(between2, false)}`);

			if (
				!this.positionHasExistingPiece(between1) &&
				!this.positionHasExistingPiece(between2) &&
				!this.myKingChecked(between1, false) &&
				!this.myKingChecked(between2, false)
			) {
				allowedMoves[1].push(castlingPosition);
				debugLog(`Long castling is allowed: added ${JSON.stringify(castlingPosition)}`);
			} else {
				debugLog(`Cannot castle long: positionHasExistingPiece between1=${this.positionHasExistingPiece(between1)}, between2=${this.positionHasExistingPiece(between2)}, myKingChecked between1=${this.myKingChecked(between1, false)}, between2=${this.myKingChecked(between2, false)}`);
			}
		} else {
			debugLog(`Rook1 cannot castle: rook1=${rook1}, ableToCastle=${rook1?.ableToCastle}`);
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
		const exists = this.getPieceByPos(position.x, position.y) !== undefined;
		debugLog(`Checking positionHasExistingPiece for position: ${JSON.stringify(position)}, exists: ${exists}`);
		return exists;
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
		debugLog(`Checking myKingChecked for pos: ${JSON.stringify(pos)}, originalPosition: ${JSON.stringify(originalPosition)}, should_kill_other_piece: ${should_kill_other_piece}`);
		piece.changePosition(pos.x, pos.y);
		if (should_kill_other_piece) this.pieces = this.pieces.filter(p => p !== otherPiece);
		const kingChecked = this.king_checked(piece.color);
		piece.changePosition(originalPosition.x, originalPosition.y);
		if (should_kill_other_piece) this.pieces.push(otherPiece);
		debugLog(`myKingChecked result: ${kingChecked}`);
		return kingChecked;
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

const isDebugMode = false;

function debugLog(message) {
	if (isDebugMode) {
		console.log(message);
	}
}