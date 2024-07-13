const startBoard = (game) => {
    const board = document.getElementById('board');
    board.innerHTML = ''; // Limpiar el contenido existente

    // Inicializar el tablero con las piezas
    for (let y = 7; y >= 0; y--) {
        for (let x = 0; x < 8; x++) {
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
        square.innerHTML = `<img class="piece ${piece.rank}" id="${piece.name}" src="img/${piece.color}-${piece.rank}.png" draggable="true">`;
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

    const movePiece = (square, draggedPieceName = null) => {
        const x = parseInt(square.dataset.x);
        const y = parseInt(square.dataset.y);
        const position = { x, y };
        const existedPiece = game.getPieceByPos(x, y);

        const clickedPieceName = draggedPieceName || document.querySelector('.clicked-square img').id;

        if (existedPiece && existedPiece.color === game.turn && !draggedPieceName) {
            const pieceImg = document.getElementById(existedPiece.name);
            clearSquares();
            return setAllowedSquares(pieceImg);
        }

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
            const draggedPieceName = event.dataTransfer.getData('text');
            movePiece(this, draggedPieceName);
        });
    });

    document.querySelectorAll('img.piece').forEach(pieceImg => {
        pieceImg.addEventListener('dragstart', function (event) {
            event.stopPropagation();
            event.dataTransfer.setData('text', event.target.id);
            clearSquares();
            setAllowedSquares(event.target);
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
    new Rook(0, 0, 'whiteRook1'),
    new Knight(1, 0, 'whiteKnight1'),
    new Bishop(2, 0, 'whiteBishop1'),
    new Queen(3, 0, 'whiteQueen'),
    new King(4, 0, 'whiteKing'),
    new Bishop(5, 0, 'whiteBishop2'),
    new Knight(6, 0, 'whiteKnight2'),
    new Rook(7, 0, 'whiteRook2'),
    new Pawn(0, 1, 'whitePawn1'),
    new Pawn(1, 1, 'whitePawn2'),
    new Pawn(2, 1, 'whitePawn3'),
    new Pawn(3, 1, 'whitePawn4'),
    new Pawn(4, 1, 'whitePawn5'),
    new Pawn(5, 1, 'whitePawn6'),
    new Pawn(6, 1, 'whitePawn7'),
    new Pawn(7, 1, 'whitePawn8'),

    new Pawn(0, 6, 'blackPawn1'),
    new Pawn(1, 6, 'blackPawn2'),
    new Pawn(2, 6, 'blackPawn3'),
    new Pawn(3, 6, 'blackPawn4'),
    new Pawn(4, 6, 'blackPawn5'),
    new Pawn(5, 6, 'blackPawn6'),
    new Pawn(6, 6, 'blackPawn7'),
    new Pawn(7, 6, 'blackPawn8'),
    new Rook(0, 7, 'blackRook1'),
    new Knight(1, 7, 'blackKnight1'),
    new Bishop(2, 7, 'blackBishop1'),
    new Queen(3, 7, 'blackQueen'),
    new King(4, 7, 'blackKing'),
    new Bishop(5, 7, 'blackBishop2'),
    new Knight(6, 7, 'blackKnight2'),
    new Rook(7, 7, 'blackRook2')
];

const game = new Game(pieces);

startBoard(game);