// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const grid = document.querySelector('.grid');
  const miniGrid = document.querySelector('.mini-grid');
  const scoreDisplay = document.getElementById('score');
  const startButton = document.getElementById('start-button');
  const leftBtn = document.getElementById('left-btn');
  const rightBtn = document.getElementById('right-btn');
  const downBtn = document.getElementById('down-btn');
  const rotateBtn = document.getElementById('rotate-btn');

  // Game constants
  const WIDTH = 10; // Width of the game grid
  const HEIGHT = 20; // Height of the game grid
  const MINI_GRID_SIZE = 4; // Size of the mini grid for next piece preview

  // Game variables
  let squares = []; // Array to hold all grid squares
  let miniSquares = []; // Array to hold mini grid squares
  let currentPosition = 4; // Starting position of new pieces
  let currentRotation = 0; // Current rotation state of the piece
  let currentShape; // Current tetromino shape
  let currentShapeIndex; // Index of the current shape in the SHAPES array
  let nextShapeIndex; // Index of the next shape to appear
  let timerId = null; // Timer for game loop
  let score = 0; // Player's score
  let isGameOver = false; // Game over flag
  let speed = 1000; // Initial speed in milliseconds
  let level = 1; // Current game level
  let totalLinesCleared = 0; // Total number of lines cleared

  // Audio element for background music
  const audio = new Audio('audio.mp3');
  audio.loop = true;

  // Tetrominoes: Each subarray represents a different rotation state
  const SHAPES = [
    [[1, WIDTH + 1, WIDTH * 2 + 1, 2], [WIDTH, WIDTH + 1, WIDTH + 2, WIDTH * 2 + 2], [1, WIDTH + 1, WIDTH * 2 + 1, WIDTH * 2], [WIDTH, WIDTH * 2, WIDTH * 2 + 1, WIDTH * 2 + 2]], // L
    [[0, WIDTH, WIDTH + 1, WIDTH * 2 + 1], [WIDTH + 1, WIDTH + 2, WIDTH * 2, WIDTH * 2 + 1], [0, WIDTH, WIDTH + 1, WIDTH * 2 + 1], [WIDTH + 1, WIDTH + 2, WIDTH * 2, WIDTH * 2 + 1]], // Z
    [[1, WIDTH, WIDTH + 1, WIDTH + 2], [1, WIDTH + 1, WIDTH + 2, WIDTH * 2 + 1], [WIDTH, WIDTH + 1, WIDTH + 2, WIDTH * 2 + 1], [1, WIDTH, WIDTH + 1, WIDTH * 2 + 1]], // T
    [[0, 1, WIDTH, WIDTH + 1], [0, 1, WIDTH, WIDTH + 1], [0, 1, WIDTH, WIDTH + 1], [0, 1, WIDTH, WIDTH + 1]], // O
    [[1, WIDTH + 1, WIDTH * 2 + 1, WIDTH * 3 + 1], [WIDTH, WIDTH + 1, WIDTH + 2, WIDTH + 3], [1, WIDTH + 1, WIDTH * 2 + 1, WIDTH * 3 + 1], [WIDTH, WIDTH + 1, WIDTH + 2, WIDTH + 3]] // I
  ];
  const COLORS = ['orange', 'red', 'purple', 'yellow', 'cyan']; // Colors for each tetromino

  // Mini grid offsets for each shape in the next piece preview
  const MINI_OFFSETS = [
    [1, MINI_GRID_SIZE + 1, MINI_GRID_SIZE * 2 + 1, 2], // L
    [0, MINI_GRID_SIZE, MINI_GRID_SIZE + 1, MINI_GRID_SIZE * 2 + 1], // Z
    [1, MINI_GRID_SIZE, MINI_GRID_SIZE + 1, MINI_GRID_SIZE + 2], // T
    [MINI_GRID_SIZE + 1, MINI_GRID_SIZE + 2, MINI_GRID_SIZE * 2 + 1, MINI_GRID_SIZE * 2 + 2], // O
    [1, MINI_GRID_SIZE + 1, MINI_GRID_SIZE * 2 + 1, MINI_GRID_SIZE * 3 + 1] // I
  ];

  // Helper function for logging
  function log(message) {
    console.log(`[Tetris] ${message}`);
  }

  // Create the main game grid
  function createGrid() {
    log('Creating game grid');
    for (let i = 0; i < WIDTH * HEIGHT; i++) {
      const square = document.createElement('div');
      grid.appendChild(square);
      squares.push(square);
    }
    log('Game grid created');
  }

  // Create the mini grid for next shape preview
  function createMiniGrid() {
    log('Creating mini grid');
    for (let i = 0; i < MINI_GRID_SIZE * MINI_GRID_SIZE; i++) {
      const square = document.createElement('div');
      miniGrid.appendChild(square);
      miniSquares.push(square);
    }
    log('Mini grid created');
  }

  // Initialize the game
  function init() {
    log('Initializing game');
    createGrid();
    createMiniGrid();
    nextShapeIndex = Math.floor(Math.random() * SHAPES.length);
    log('Game initialized');
  }

  // Draw the current tetromino on the grid
  function draw() {
    log(`Drawing shape at position ${currentPosition}`);
    currentShape.forEach(index => {
      if (squares[currentPosition + index]) {
        squares[currentPosition + index].classList.add('tetromino');
        squares[currentPosition + index].style.backgroundColor = COLORS[currentShapeIndex];
      } else {
        log(`Error: Tried to draw outside the grid at index ${currentPosition + index}`);
      }
    });
  }

  // Remove the current tetromino from the grid
  function undraw() {
    log(`Undrawing shape at position ${currentPosition}`);
    currentShape.forEach(index => {
      if (squares[currentPosition + index]) {
        squares[currentPosition + index].classList.remove('tetromino');
        squares[currentPosition + index].style.backgroundColor = '';
      } else {
        log(`Error: Tried to undraw outside the grid at index ${currentPosition + index}`);
      }
    });
  }

  // Move the current tetromino down
  function moveDown() {
    if (isAtBottom() || isOnTopOfTaken()) {
      freeze();
      return;
    }
    undraw();
    currentPosition += WIDTH;
    draw();
  }

  // Check if the current tetromino is at the bottom of the grid
  function isAtBottom() {
    return currentShape.some(index => currentPosition + index + WIDTH >= WIDTH * HEIGHT);
  }

  // Check if the current tetromino is on top of a taken square
  function isOnTopOfTaken() {
    return currentShape.some(index => 
      squares[currentPosition + index + WIDTH] && 
      squares[currentPosition + index + WIDTH].classList.contains('taken')
    );
  }

  // Freeze the current tetromino in place
  function freeze() {
    log('Freezing shape');
    currentShape.forEach(index => {
      if (squares[currentPosition + index]) {
        squares[currentPosition + index].classList.add('taken');
      }
    });
    checkForLines();
    spawnNewShape();
    gameOver();
  }

  // Spawn a new tetromino
  function spawnNewShape() {
    log('Spawning new shape');
    currentShapeIndex = nextShapeIndex;
    currentShape = SHAPES[currentShapeIndex][currentRotation];
    nextShapeIndex = Math.floor(Math.random() * SHAPES.length);
    currentPosition = 4;
    currentRotation = 0;
    draw();
    displayNextShape();
  }

  // Display the next shape in the mini grid
  function displayNextShape() {
    log('Displaying next shape');
    miniSquares.forEach(square => {
      square.classList.remove('tetromino');
      square.style.backgroundColor = '';
    });
    MINI_OFFSETS[nextShapeIndex].forEach(index => {
      miniSquares[index].classList.add('tetromino');
      miniSquares[index].style.backgroundColor = COLORS[nextShapeIndex];
    });
  }

  // Move the current tetromino left
  function moveLeft() {
    undraw();
    const isAtLeftEdge = currentShape.some(index => (currentPosition + index) % WIDTH === 0);
    if (!isAtLeftEdge) currentPosition -= 1;
    if (currentShape.some(index => squares[currentPosition + index] && squares[currentPosition + index].classList.contains('taken'))) {
      currentPosition += 1;
    }
    draw();
  }

  // Move the current tetromino right
  function moveRight() {
    undraw();
    const isAtRightEdge = currentShape.some(index => (currentPosition + index) % WIDTH === WIDTH - 1);
    if (!isAtRightEdge) currentPosition += 1;
    if (currentShape.some(index => squares[currentPosition + index] && squares[currentPosition + index].classList.contains('taken'))) {
      currentPosition -= 1;
    }
    draw();
  }

  // Rotate the current tetromino
  function rotate() {
    undraw();
    currentRotation = (currentRotation + 1) % 4;
    let nextShape = SHAPES[currentShapeIndex][currentRotation];
    const isAtRightEdge = nextShape.some(index => (currentPosition + index) % WIDTH === WIDTH - 1);
    const isAtLeftEdge = nextShape.some(index => (currentPosition + index) % WIDTH === 0);
    if (isAtRightEdge) currentPosition -= 1;
    if (isAtLeftEdge) currentPosition += 1;
    if (nextShape.some(index => squares[currentPosition + index] && squares[currentPosition + index].classList.contains('taken'))) {
      currentRotation = (currentRotation - 1 + 4) % 4;
    } else {
      currentShape = nextShape;
    }
    draw();
  }

  // Check for completed lines and update the score
  function checkForLines() {
    let linesCleared = 0;
    for (let i = 0; i < HEIGHT * WIDTH; i += WIDTH) {
      const row = Array.from({length: WIDTH}, (_, j) => i + j);
      if (row.every(index => squares[index].classList.contains('taken'))) {
        linesCleared++;
        row.forEach(index => {
          squares[index].classList.remove('taken', 'tetromino');
          squares[index].style.backgroundColor = '';
        });
        const squaresRemoved = squares.splice(i, WIDTH);
        squares = squaresRemoved.concat(squares);
        squares.forEach(cell => grid.appendChild(cell));
      }
    }
    
    if (linesCleared > 0) {
      // Scoring system: 40 points for 1 line, 100 for 2, 300 for 3, 1200 for 4
      const points = [0, 40, 100, 300, 1200];
      score += points[linesCleared] * level;
      totalLinesCleared += linesCleared;
      scoreDisplay.innerHTML = score;
      log(`Lines cleared: ${linesCleared}, Total lines: ${totalLinesCleared}, Score: ${score}`);
      
      // Level up every 10 lines
      level = Math.floor(totalLinesCleared / 10) + 1;
      speed = Math.max(100, 1000 - (level - 1) * 100);
      if (timerId) {
        clearInterval(timerId);
        timerId = setInterval(moveDown, speed);
      }
      log(`Level: ${level}, Speed: ${speed}`);
    }
  }

  // Check for game over condition
  function gameOver() {
    if (currentShape.some(index => squares[currentPosition + index] && squares[currentPosition + index].classList.contains('taken'))) {
      log('Game over');
      scoreDisplay.innerHTML = 'GAME OVER';
      clearInterval(timerId);
      isGameOver = true;
      startButton.innerHTML = 'Play Again';
      audio.pause();
      audio.currentTime = 0;
    }
  }

  // Handle keyboard controls
  function control(e) {
    if (isGameOver) return;
    if (e.keyCode === 37) {
      moveLeft();
    } else if (e.keyCode === 38) {
      rotate();
    } else if (e.keyCode === 39) {
      moveRight();
    } else if (e.keyCode === 40) {
      moveDown();
    }
  }

  // Start or pause the game
  function startPause() {
    if (isGameOver) {
      log('Restarting game');
      resetGame();
      startButton.innerHTML = 'Start';
    } else if (timerId) {
      log('Pausing game');
      clearInterval(timerId);
      timerId = null;
      startButton.innerHTML = 'Resume';
      audio.pause();
    } else {
      log('Starting/Resuming game');
      if (!currentShape) {
        spawnNewShape();
      }
      timerId = setInterval(moveDown, speed);
      startButton.innerHTML = 'Pause';
      audio.play();
    }
  }

  // Reset the game to initial state
  function resetGame() {
    log('Resetting game');
    clearInterval(timerId);
    isGameOver = false;
    score = 0;
    level = 1;
    totalLinesCleared = 0;
    speed = 1000;
    scoreDisplay.innerHTML = score;
    squares.forEach(square => {
      square.classList.remove('tetromino', 'taken');
      square.style.backgroundColor = '';
    });
    currentShape = null;
    nextShapeIndex = Math.floor(Math.random() * SHAPES.length);
    currentPosition = 4;
    currentRotation = 0;
    timerId = null;
  }

  // Event listeners for keyboard controls
  document.addEventListener('keydown', control);
  startButton.addEventListener('click', startPause);

  // Function to handle both touch and click events for mobile controls
  function addControlListener(element, action) {
    element.addEventListener('touchstart', (e) => {
      e.preventDefault();
      action();
    });
    element.addEventListener('click', (e) => {
      e.preventDefault();
      action();
    });
  }

  // Add control listeners for both touch and click events
  addControlListener(leftBtn, moveLeft);
  addControlListener(rightBtn, moveRight);
  addControlListener(downBtn, moveDown);
  addControlListener(rotateBtn, rotate);

  // Prevent default touch behavior to avoid scrolling and zooming while playing on mobile
  document.addEventListener('touchmove', function(e) {
    if (e.target.closest('.controls') || e.target.closest('.grid')) {
      e.preventDefault();
    }
  }, { passive: false });

  // Prevent double-tap zooming on mobile devices
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(e) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

// Update viewport meta tag to prevent zooming on mobile devices
const viewportMeta = document.querySelector('meta[name="viewport"]');
if (viewportMeta) {
  viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
}

// Initialize game
init();
});