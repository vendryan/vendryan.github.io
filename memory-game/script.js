const memoryCard = document.querySelectorAll('.memory-card > div');
const body = document.querySelector('body');
// If two is selected set this to true and click will be disabled
// (Solution from stackoverflow)
// Why i can't think the solution for myself??!
let disabled = false;
let score = 0;
let selected = [];
let eventList = []

// Run the game
runGame();

function runGame() {
  const memoryCardColor = generateShuffledColor();

  for (let i = 0; i < memoryCard.length; i++) {
    let showColor = function() {
      if (disabled === false) {
        this.style.backgroundColor = memoryCardColor[i];
      }
    };

    // Store the event for removal
    eventList.push(showColor);
    
    memoryCard[i].addEventListener('click', showColor);
    memoryCard[i].addEventListener('click', check);
  }
}

// Generate 8 random color list each have two element and already shuffled
function generateShuffledColor() {
  let colorList = ['green', 'blue', 'red', 'aliceblue', 'crimson', 'grey', 'black', 'brown'];
  let colorDouble = [];
  for (let i = 0; i < colorList.length; i++) {
    colorDouble.push(colorList[i]);
    colorDouble.push(colorList[i]);
  }
  shuffle(colorDouble);
  return colorDouble;
}

// Generate random number from minNum to (maxNum - 1)
// input : minNum, maxNum
// output : integer (random number)
function random(minNum, maxNum) {
  return Math.floor(Math.random() * maxNum) + minNum;
}

// Shuffling array algorithm
function shuffle(array) {
  let length = array.length;
  for (let i = length - 1; i >= 0; i--) {
    swapIndex = random(0, i)
    temp = array[swapIndex];
    array[swapIndex] = array[i];
    array[i] = temp;
  }
  console.log(array);
}

// Check if selected is oe or two
// Check if the chosen is correct and apply the logic
function check() {
  if (disabled === false) {
    selected.push(this);
    this.removeEventListener('click', check);

    if (selected.length >= 2) {
      const firstCard = selected.pop();
      const secondCard = selected.pop();

      if (firstCard.style.backgroundColor === secondCard.style.backgroundColor) {
        score += 1;
        setTimeout(checkWin, 500); // Check if winning or not
      } else {
        disabled = true;
        setTimeout(function() {
          firstCard.style.backgroundColor = 'rebeccapurple';
          secondCard.style.backgroundColor = 'rebeccapurple';
          firstCard.addEventListener('click', check);
          secondCard.addEventListener('click', check);
          disabled = false;
        }, 1000);
      }
    }
  }
}

function checkWin() {
  if (score === 8) {
    displayWinPopup();
  }
}

function resetGame() {
  // Remove all the event in the memory card
  for (let i = 0; i < memoryCard.length; i++) {
    memoryCard[i].style.backgroundColor = 'rebeccapurple';
    memoryCard[i].removeEventListener('click', eventList.shift());
  }

  runGame();
}

function displayWinPopup() {
  const popup = document.createElement('div');
  const headerTwo = document.createElement('h2');
  const button = document.createElement('button');

  headerTwo.textContent = 'You Win!!';
  button.textContent = 'Play again';

  button.addEventListener('click', function() {
    this.parentNode.parentNode.removeChild(popup);
    resetGame();
  });

  popup.appendChild(headerTwo);
  popup.appendChild(button);
  popup.setAttribute('class', 'popup');

  body.appendChild(popup);
}