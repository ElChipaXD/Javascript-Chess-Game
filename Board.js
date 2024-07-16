const startBoard = (game) => {
    const board = document.getElementById('board');
    board.innerHTML = ''; // Limpiar el contenido existente

    // Inicializar el tablero con las piezas
    for (let y = 8; y >= 1; y--) {
        for (let x = 1; x <= 8; x++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.id = `${x}-${y}`;
            square.dataset.x = x;
            square.dataset.y = y;
            if ((x + y) % 2 === 0) {
                square.classList.add('even');
            } else {
                square.classList.add('odd');
            }
            board.appendChild(square);
        }
    }

    // Colocar las piezas en sus posiciones iniciales
    game.pieces.forEach(piece => {
        const square = document.getElementById(`${piece.x}-${piece.y}`);
        square.innerHTML = `<img class="piece ${piece.rank}" id="${piece.name}" src="img/${piece.color}-${piece.rank}.png">`;
    });

    const setAllowedSquares = (pieceImg) => {
        const clickedPieceName = pieceImg.id;
        const allowedMoves = game.getPieceAllowedMoves(clickedPieceName);
        if (allowedMoves.length > 0) {
            const clickedSquare = pieceImg.parentNode;
            clickedSquare.classList.add('clicked-square');

            allowedMoves.forEach(allowedMove => {
                const square = document.getElementById(`${allowedMove.x}-${allowedMove.y}`);
                if (square) {
                    square.classList.add('allowed');
                }
            });
        } else {
            clearSquares();
        }
    }

    const clearSquares = () => {
        const allowedSquares = board.querySelectorAll('.allowed');
        allowedSquares.forEach(allowedSquare => allowedSquare.classList.remove('allowed'));
        const clickedSquare = document.getElementsByClassName('clicked-square')[0];
        if (clickedSquare) {
            clickedSquare.classList.remove('clicked-square');
        }
    }

    const movePiece = (square) => {
        const x = parseInt(square.dataset.x);
        const y = parseInt(square.dataset.y);
        const position = { x, y };
        const existedPiece = game.getPieceByPos(x, y);

        if (existedPiece && existedPiece.color === game.turn) {
            const pieceImg = document.getElementById(existedPiece.name);
            clearSquares();
            return setAllowedSquares(pieceImg);
        }

        const clickedPieceName = document.querySelector('.clicked-square img').id;
        const successfulMove = game.movePiece(clickedPieceName, position);

        if (successfulMove) {
            const movedPiece = document.getElementById(clickedPieceName);
            if (movedPiece) {
                square.appendChild(movedPiece);
            }
        }
    }

    const squares = board.querySelectorAll('.square');
    squares.forEach(square => {
        square.addEventListener('click', function () {
            movePiece(this);
        });
        square.addEventListener('dragover', function (event) {
            event.preventDefault();
        });
        square.addEventListener('drop', function (event) {
            event.preventDefault();
            const pieceId = event.dataTransfer.getData('text');
            const pieceImg = document.getElementById(pieceId);
            const parentSquare = pieceImg.parentNode;
            const targetSquare = this;

            if (parentSquare !== targetSquare) {
                clearSquares();
                setAllowedSquares(pieceImg);
                movePiece(targetSquare);
            }
        });
    });

    document.querySelectorAll('img.piece').forEach(pieceImg => {
        pieceImg.addEventListener('dragstart', function (event) {
            event.stopPropagation();
            event.dataTransfer.setData('text', event.target.id);
            clearSquares();
            setAllowedSquares(event.target);
        });

        pieceImg.addEventListener('dragend', function (event) {
            const targetSquare = document.elementFromPoint(event.clientX, event.clientY);
            if (targetSquare && targetSquare.classList.contains('square')) {
                movePiece(targetSquare);
            }
        });
    });

    game.on('pieceMove', piece => {
        const square = document.getElementById(`${piece.x}-${piece.y}`);
        square.append(document.getElementById(piece.name));
        clearSquares();
    });

    game.on('turnChange', turn => {
        const turnSign = document.getElementById('turn');
        turnSign.innerHTML = turn === 'white' ? "White's Turn" : "Black's Turn";
        console.log(`Turn is now ${turn}`);
    });

    game.on('promotion', queen => {
        const square = document.getElementById(`${queen.x}-${queen.y}`);
        square.innerHTML = `<img class="piece queen" id="${queen.name}" src="img/${queen.color}-queen.png">`;
    });

    game.on('kill', piece => {
        const pieceImg = document.getElementById(piece.name);
        if (pieceImg) {
            pieceImg.parentNode.removeChild(pieceImg);
        }

        const sematary = piece.color === 'white' ? document.getElementById('whiteSematary') : document.getElementById('blackSematary');
        sematary.querySelector(`.${piece.rank}`).append(pieceImg);
    });

    game.on('checkMate', color => {
        const endScene = document.getElementById('endscene');
        endScene.getElementsByClassName('winning-sign')[0].innerHTML = color + ' Wins';
        endScene.classList.add('show');
    });

    game.on('enPassant', data => {
        const { piece, opponentPawnPos } = data;
        const opponentPawn = game.getPieceByPos(opponentPawnPos.x, opponentPawnPos.y);
        if (opponentPawn) {
            const opponentPawnImg = document.getElementById(opponentPawn.name);
            if (opponentPawnImg) {
                opponentPawnImg.parentNode.removeChild(opponentPawnImg);
            }
        }

        const square = document.getElementById(`${piece.x}-${piece.y}`);
        const movedPiece = document.getElementById(piece.name);
        if (movedPiece) {
            square.appendChild(movedPiece);
        }
    });

    game.on('enPassantCapture', data => {
        const { piece, opponentPawnPos } = data;
        const opponentPawn = game.getPieceByPos(opponentPawnPos.x, opponentPawnPos.y);
        if (opponentPawn) {
            const opponentPawnImg = document.getElementById(opponentPawn.name);
            if (opponentPawnImg) {
                opponentPawnImg.parentNode.removeChild(opponentPawnImg);
            }
        }
    });
};

const pieces = [
    new Rook(1, 1, 'whiteRook1'),
    new Knight(2, 1, 'whiteKnight1'),
    new Bishop(3, 1, 'whiteBishop1'),
    new Queen(4, 1, 'whiteQueen'),
    new King(5, 1, 'whiteKing'),
    new Bishop(6, 1, 'whiteBishop2'),
    new Knight(7, 1, 'whiteKnight2'),
    new Rook(8, 1, 'whiteRook2'),
    new Pawn(1, 2, 'whitePawn1'),
    new Pawn(2, 2, 'whitePawn2'),
    new Pawn(3, 2, 'whitePawn3'),
    new Pawn(4, 2, 'whitePawn4'),
    new Pawn(5, 2, 'whitePawn5'),
    new Pawn(6, 2, 'whitePawn6'),
    new Pawn(7, 2, 'whitePawn7'),
    new Pawn(8, 2, 'whitePawn8'),

    new Pawn(1, 7, 'blackPawn1'),
    new Pawn(2, 7, 'blackPawn2'),
    new Pawn(3, 7, 'blackPawn3'),
    new Pawn(4, 7, 'blackPawn4'),
    new Pawn(5, 7, 'blackPawn5'),
    new Pawn(6, 7, 'blackPawn6'),
    new Pawn(7, 7, 'blackPawn7'),
    new Pawn(8, 7, 'blackPawn8'),
    new Rook(1, 8, 'blackRook1'),
    new Knight(2, 8, 'blackKnight1'),
    new Bishop(3, 8, 'blackBishop1'),
    new Queen(4, 8, 'blackQueen'),
    new King(5, 8, 'blackKing'),
    new Bishop(6, 8, 'blackBishop2'),
    new Knight(7, 8, 'blackKnight2'),
    new Rook(8, 8, 'blackRook2')
];

const game = new Game(pieces);

startBoard(game);