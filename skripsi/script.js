function even(x) {
    return x % 2 === 0;
}

const WINDOW_WIDTH = window.innerWidth / 2;
const WINDOW_HEIGHT = window.innerHeight;
const VISUALIZER_GRID_WIDTH = Math.floor(WINDOW_WIDTH / 20);
const VISUALIZER_GRID_HEIGHT = Math.floor(WINDOW_HEIGHT / 20) - 1;
const SOURCE_NODE = { x: 0, y: 0 };
const DESTINATION_NODE = {
    x: even(VISUALIZER_GRID_WIDTH - 1) ? VISUALIZER_GRID_WIDTH - 1 : VISUALIZER_GRID_WIDTH - 2,
    y: even(VISUALIZER_GRID_HEIGHT - 1) ? VISUALIZER_GRID_HEIGHT - 1 : VISUALIZER_GRID_HEIGHT - 2,
};

NODE_TYPE = {
    EMPTY_NODE: 0,
    VISITED_NODE: 1,
    WALL_NODE: 2,
    TARGET_NODE: 3,
    SOURCE_NODE: 4,
    PATH_NODE: 5,
};

ACTION = {
    NONE: 0,
    MAKING_WALL: 1,
    REMOVE_WALL: 2,
    MOVE_SOURCE: 3,
    MOVE_DESTINATION: 4,
}
const sleep = delay => new Promise(resolve => setTimeout(resolve, delay));
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

function getRandomBool() {
    return getRandomInt(0, 2) ? true : false;
}

function getEvenRandomInt(min, max) {
    let random = getRandomInt(min, max);
    if (random % 2 === 0) {
        return random;
    }
    else {
        if (random - 1 < min) {
            return random + 1;
        }
        else if (random + 1 >= max) {
            return random - 1;
        }
        return getRandomInt(0, 2) === 0 ? random + 1 : random - 1;
    }
}

function getOddRandomInt(min, max) {
    let random = getRandomInt(min, max);
    if (random % 2 === 1) {
        return random;
    }
    else {
        if (random - 1 < min) {
            return random + 1;
        }
        else if (random + 1 >= max) {
            return random - 1;
        }
        return getRandomInt(0, 2) === 0 ? random + 1 : random - 1;
    }
}

function validPos(x, y) {
    return x >= 0 && x < VISUALIZER_GRID_WIDTH && y >= 0 && y < VISUALIZER_GRID_HEIGHT;
}

// Shuffle array
function shuffle(arr) {
    for (let i = arr.length - 1; i > 1; i--) {
        let random = getRandomInt(0, i + 1);
        let temp = arr[random];
        arr[random] = arr[i];
        arr[i] = temp; 
    }
    return arr;
}

let currentAction = ACTION.NONE;
let mouseIsDown = false;
let visualizerGrid = [];
let boardState = {
    sourceNode: {
        x: SOURCE_NODE.x,
        y: SOURCE_NODE.y,
    },
    destinationNode: {
        x: DESTINATION_NODE.x,
        y: DESTINATION_NODE.y,
    },
    algorithm: 'none',
    mazeAlgorithm: 'none',
}

// NOTE(Vendryan): This for knowing the information on old node when moving SOURCE_NODE
// or DESTINATION_NODE
let oldNode = null;

function Queue() {
    this.items = [];
    this.size = 0;
}

Queue.prototype.enqueue = function(x) {
    this.items.push(x);
    this.size = this.size + 1;
}

Queue.prototype.dequeue = function() {
    this.size = this.size - 1;
    return this.items.shift();
}

//======= Start Union-Find Algorithm ====================//
// NOTE(Vendryan): this is for efficient Kruskal algorithm
function disjointSetFind(parent, x) {
    // Path compression optimization
    if (parent[x] === x) {
        return x;
    }
    else {
        let result = disjointSetFind(parent, parent[x]);
        parent[x] = result;

        return result;
    }
}

function disjointSetUnion(parent, rank, x, y) {
    let setX = disjointSetFind(parent, x);
    let setY = disjointSetFind(parent, y);

    if (setX === setY) {
        return false;
    }

    if (rank[setX] > rank[setY]) {
        // Move setY below setX
        parent[setY] = setX;
    }
    else if (rank[setX] < rank[setY]) {
        // Move setX below setY
        parent[setX] = setY;
    }
    else {
        // Move setY below setX and increment rank of setX
        parent[setY] = setX;
        rank[setX]++;
    }
    return true;
}
//======= End Union-Find Algorithm ====================//

// class Queue {
//     constructor() {
//         this.items = [];
//         this.size = 0;
//     }
    
//     enqueue(x) {
//         this.items.push(x);
//         this.size++;
//     }

//     dequeue() {
//         this.size--;
//         return this.items.shift();
//     }
// }

class Node {
    constructor(x, y, type, elem) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.elem = elem;
        this.id = null;

        this.parent_x = null;
        this.parent_y = null;
        this.g = 0;
        this.h = 0;
        this.f = 0;
    }

    resetState() {
        this.elem.classList.remove(
            'visualizer-grid__node--wall',
            'visualizer-grid__node--source',
            'visualizer-grid__node--destination',
            'visualizer-grid__node--visited',
            'visualizer-grid__node--path',
        );
    }

    changeType(type) {
        this.resetState();
        this.type = type;
        switch (type) {
            case NODE_TYPE.VISITED_NODE:
            {
                this.elem.classList.add('visualizer-grid__node--visited');
            } break;

            case NODE_TYPE.WALL_NODE:
            {
                this.elem.classList.add('visualizer-grid__node--wall');
            } break;

            case NODE_TYPE.SOURCE_NODE:
            {
                this.elem.classList.add('visualizer-grid__node--source');
            } break;

            case NODE_TYPE.DESTINATION_NODE:
            {
                this.elem.classList.add('visualizer-grid__node--destination');
            } break;
            case NODE_TYPE.PATH_NODE:
            {
                this.elem.classList.add('visualizer-grid__node--path');
            } break;
        }
    }

    addWall() {
        if (this.type === NODE_TYPE.EMPTY_NODE) {
            this.changeType(NODE_TYPE.WALL_NODE);
        }
    }

    deleteWall() {
        if (this.type === NODE_TYPE.WALL_NODE) {
            this.changeType(NODE_TYPE.EMPTY_NODE);
        }
    }

    validNode() {
        return this.type === NODE_TYPE.EMPTY_NODE || this.type === NODE_TYPE.DESTINATION_NODE;
    }
}

async function DFS(startX, startY, visualizerGrid) {
    let stack = [];
    let visited = [];
    for (let i = 0; i < VISUALIZER_GRID_HEIGHT; i++) {
        visited[i] = new Array(VISUALIZER_GRID_WIDTH).fill(0);
    }
    let currentNode = visualizerGrid[startY][startX];
    currentNode.parent_x = null;
    currentNode.parent_y = null;
    stack.push(currentNode);

    while (stack.length) {
        currentNode = stack.pop();
        let x = currentNode.x;
        let y = currentNode.y;

        // If already visited, skip the current node
        if (visited[y][x]) {
            continue;
        }

        if (currentNode.type === NODE_TYPE.EMPTY_NODE) {
            currentNode.changeType(NODE_TYPE.VISITED_NODE);
            visited[y][x] = 1;
            await sleep(25);
        }
        else if (currentNode.type === NODE_TYPE.DESTINATION_NODE) {
            break;
        }

        
        // Visit left
        if (x - 1 >= 0 && !visited[y][x - 1] && visualizerGrid[y][x - 1].validNode()) {
            stack.push(visualizerGrid[y][x - 1]);
            visualizerGrid[y][x - 1].parent_x = x;
            visualizerGrid[y][x - 1].parent_y = y;
        }

        // Visit down
        if (y + 1 < VISUALIZER_GRID_HEIGHT && !visited[y + 1][x] && visualizerGrid[y + 1][x].validNode()) {
            stack.push(visualizerGrid[y + 1][x]);
            visualizerGrid[y + 1][x].parent_x = x;
            visualizerGrid[y + 1][x].parent_y = y;
        }

        // Visit right
        if (x + 1 < VISUALIZER_GRID_WIDTH && !visited[y][x + 1] && visualizerGrid[y][x + 1].validNode()) {
            stack.push(visualizerGrid[y][x + 1]);
            visualizerGrid[y][x + 1].parent_x = x;
            visualizerGrid[y][x + 1].parent_y = y;
        }

        // Visit top
        if (y - 1 >= 0 && !visited[y - 1][x] && visualizerGrid[y - 1][x].validNode()) {
            stack.push(visualizerGrid[y - 1][x]);
            visualizerGrid[y - 1][x].parent_x = x;
            visualizerGrid[y - 1][x].parent_y = y;
        }
    }

    if (currentNode.type === NODE_TYPE.DESTINATION_NODE) {
        // let jalanKeluar = [currentNode];
        while (currentNode.parent_x !== null && currentNode.parent_y !== null) {
            currentNode = visualizerGrid[currentNode.parent_y][currentNode.parent_x];
            if (currentNode.type !== NODE_TYPE.SOURCE_NODE) {
                currentNode.changeType(NODE_TYPE.PATH_NODE);
                await sleep(25);
            }
        }
    }
}

async function BFS(startX, startY, visualizerGrid) {
    let queue = new Queue();

    // NOTE(Vendryan): Keep track of visited node
    let visited = [];

    // Fill the visited array with 0
    for (let i = 0; i < VISUALIZER_GRID_HEIGHT; i++) {
        visited[i] = new Array(VISUALIZER_GRID_WIDTH).fill(0);
    }

    let currentNode = visualizerGrid[startY][startX];
    currentNode.parent_x = null;
    currentNode.parent_y = null;
    queue.enqueue(currentNode);

    while (queue.size > 0) {
        currentNode = queue.dequeue();
        let x = currentNode.x;
        let y = currentNode.y;

        if (visited[y][x]) {
            continue;
        }

        if (currentNode.type === NODE_TYPE.EMPTY_NODE) {
            currentNode.changeType(NODE_TYPE.VISITED_NODE);
            visited[y][x] = 1;
            await sleep(25);
        }
        else if (currentNode.type === NODE_TYPE.DESTINATION_NODE) {
            break;
        }

        
        // Visit left
        if (x - 1 >= 0 && !visited[y][x - 1] && visualizerGrid[y][x - 1].validNode()) {
            queue.enqueue(visualizerGrid[y][x - 1]);
            visualizerGrid[y][x - 1].parent_x = x;
            visualizerGrid[y][x - 1].parent_y = y;
        }

        // Visit down
        if (y + 1 < VISUALIZER_GRID_HEIGHT && !visited[y + 1][x] && visualizerGrid[y + 1][x].validNode()) {
            queue.enqueue(visualizerGrid[y + 1][x]);
            visualizerGrid[y + 1][x].parent_x = x;
            visualizerGrid[y + 1][x].parent_y = y;
        }

        // Visit right
        if (x + 1 < VISUALIZER_GRID_WIDTH && !visited[y][x + 1] && visualizerGrid[y][x + 1].validNode()) {
            queue.enqueue(visualizerGrid[y][x + 1]);
            visualizerGrid[y][x + 1].parent_x = x;
            visualizerGrid[y][x + 1].parent_y = y;
        }

        // Visit top
        if (y - 1 >= 0 && !visited[y - 1][x] && visualizerGrid[y - 1][x].validNode()) {
            queue.enqueue(visualizerGrid[y - 1][x]);
            visualizerGrid[y - 1][x].parent_x = x;
            visualizerGrid[y - 1][x].parent_y = y;
        }
    }

    if (currentNode.type === NODE_TYPE.DESTINATION_NODE) {
        // let jalanKeluar = [currentNode];
        while (currentNode.parent_x !== null && currentNode.parent_y !== null) {
            currentNode = visualizerGrid[currentNode.parent_y][currentNode.parent_x];
            if (currentNode.type !== NODE_TYPE.SOURCE_NODE) {
                currentNode.changeType(NODE_TYPE.PATH_NODE);
                await sleep(25);
            }
        }
    }
}

async function AStar(startX, startY, visualizerGrid) {
    let openList = [];
    
    // NOTE(Vendryan): Keep track of visited close list and open list
    let visitedClosedNode = [];
    let visitedOpenNode = [];
    // Fill the visited array with 0
    for (let i = 0; i < VISUALIZER_GRID_HEIGHT; i++) {
        visitedClosedNode[i] = new Array(VISUALIZER_GRID_WIDTH).fill(0);
        visitedOpenNode[i] = new Array(VISUALIZER_GRID_WIDTH).fill(0);
    }

    let currentNode = visualizerGrid[startY][startX];
    currentNode.parent_x = null;
    currentNode.parent_y = null;
    openList.push(currentNode);
    while (openList.length > 0) {
        currentNode = openList[0];
        let pos = 0;
        for (let i = 1; i < openList.length; i++) {
            let checkNode = openList[i];
            // In case of tie, get the node with the farthest travelling distance
            if (checkNode.f < currentNode.f || (checkNode.f === currentNode.f && checkNode.g > currentNode.g)) {
                currentNode = checkNode;
                pos = i;
            }
        }

        let x = currentNode.x;
        let y = currentNode.y;
        // Add into closed list / visited node
        visitedClosedNode[y][x] = 1;
        // Delete the current node from open list
        openList.splice(pos, 1);

        if (currentNode.type === NODE_TYPE.EMPTY_NODE) {
            currentNode.changeType(NODE_TYPE.VISITED_NODE);
            await sleep(25);
        }
        else if (currentNode.type === NODE_TYPE.DESTINATION_NODE) {
            break;
        }

        // Visit left
        if (x - 1 >= 0 && !visitedClosedNode[y][x - 1] && !visitedOpenNode[y][x - 1] && visualizerGrid[y][x - 1].validNode()) {
            visitedOpenNode[y][x - 1] = 1;

            let node = visualizerGrid[y][x - 1];
            node.parent_x = x;
            node.parent_y = y;

            openList.push(node);
            node.g = currentNode.g + 1;
            node.h = Math.abs(boardState.destinationNode.x - node.x) + Math.abs(boardState.destinationNode.y - node.y);
            node.f = node.g + node.h;
        }

        // Visit down
        if (y + 1 < VISUALIZER_GRID_HEIGHT && !visitedClosedNode[y + 1][x] && !visitedOpenNode[y + 1][x] && visualizerGrid[y + 1][x].validNode()) {
            visitedOpenNode[y + 1][x] = 1;

            let node = visualizerGrid[y + 1][x];
            node.parent_x = x;
            node.parent_y = y;

            openList.push(node);
            node.g = currentNode.g + 1;
            node.h = Math.abs(boardState.destinationNode.x - node.x) + Math.abs(boardState.destinationNode.y - node.y);
            node.f = node.g + node.h;
        }

        // Visit right
        if (x + 1 < VISUALIZER_GRID_WIDTH && !visitedClosedNode[y][x + 1] && !visitedClosedNode[y][x + 1] && visualizerGrid[y][x + 1].validNode()) {
            visitedOpenNode[y][x + 1] = 1;

            let node = visualizerGrid[y][x + 1];
            node.parent_x = x;
            node.parent_y = y;

            openList.push(node);
            node.g = currentNode.g + 1;
            node.h = Math.abs(boardState.destinationNode.x - node.x) + Math.abs(boardState.destinationNode.y - node.y);
            node.f = node.g + node.h;
        }

        // Visit top
        if (y - 1 >= 0 && !visitedClosedNode[y - 1][x] && !visitedOpenNode[y - 1][x] && visualizerGrid[y - 1][x].validNode()) {
            visitedOpenNode[y - 1][x] = 1;

            let node = visualizerGrid[y - 1][x];
            node.parent_x = x;
            node.parent_y = y;

            openList.push(node);
            node.g = currentNode.g + 1;
            node.h = Math.abs(boardState.destinationNode.x - node.x) + Math.abs(boardState.destinationNode.y - node.y);
            node.f = node.g + node.h;
        }
    }

    if (currentNode.type === NODE_TYPE.DESTINATION_NODE) {
        // let jalanKeluar = [currentNode];
        while (currentNode.parent_x !== null && currentNode.parent_y !== null) {
            currentNode = visualizerGrid[currentNode.parent_y][currentNode.parent_x];
            if (currentNode.type !== NODE_TYPE.SOURCE_NODE) {
                currentNode.changeType(NODE_TYPE.PATH_NODE);
                await sleep(25);
            }
        }
    }
}

async function recursiveDivisionMaze(startX, endX, startY, endY, visualizerGrid) {
    // Only add the wall to odd numbered position and path will automatically
    // appear at even numbered position
    let horizontalLength = endX - startX + 1;
    let verticalLength = endY - startY + 1;

    if (horizontalLength > verticalLength && endX - startX >= 2) {
        // Divide vertically
        let wall = getOddRandomInt(startX, endX + 1);
        let path = getEvenRandomInt(startY, endY + 1);
        for (let y = startY; y <= endY; y++) {
            let node = visualizerGrid[y][wall];
            if (y !== path && node.type === NODE_TYPE.EMPTY_NODE) {
                node.changeType(NODE_TYPE.WALL_NODE);
                await sleep(10);
            }
        }

        await recursiveDivisionMaze(startX, wall - 1, startY, endY, visualizerGrid);
        await recursiveDivisionMaze(wall + 1, endX, startY, endY, visualizerGrid);
    }
    else if (horizontalLength <= verticalLength && endY - startY >= 2) {
        // Divide horizontally
        let wall = getOddRandomInt(startY, endY + 1);
        let path = getEvenRandomInt(startX, endX + 1);
        for (let x = startX; x <= endX; x++) {
            let node = visualizerGrid[wall][x];
            if (x !== path && node.type === NODE_TYPE.EMPTY_NODE) {
                node.changeType(NODE_TYPE.WALL_NODE);
                await sleep(10);
            }
        }

        await recursiveDivisionMaze(startX, endX, startY, wall - 1, visualizerGrid);
        await recursiveDivisionMaze(startX, endX, wall + 1, endY, visualizerGrid);
    }
}

async function recursiveBacktrackingMaze(startX, startY, visited, visualizerGrid) {
    let direction = shuffle([
        [-2, 0, 'left'], // left
        [2, 0, 'right'],  // right
        [0, 2, 'down'], // down
        [0, -2, 'up'], // up
    ]);

    for (let i = 0; i < 4; i++) {
        let nx = startX + direction[i][0];
        let ny = startY + direction[i][1];
        let dir = direction[i][2];

        if (nx >= 0 && nx < VISUALIZER_GRID_WIDTH && ny >= 0 && ny < VISUALIZER_GRID_HEIGHT && !visited[ny][nx]) {
            // Carve wall
            switch (dir) {
                case 'left':
                {
                    if (visualizerGrid[ny][nx + 1].type === NODE_TYPE.WALL_NODE) {
                        visualizerGrid[ny][nx + 1].changeType(NODE_TYPE.EMPTY_NODE);
                    }
                } break;
                case 'right':
                {
                    if (visualizerGrid[ny][nx - 1].type === NODE_TYPE.WALL_NODE) {
                        visualizerGrid[ny][nx - 1].changeType(NODE_TYPE.EMPTY_NODE);
                    }
                } break;
                case 'up':
                {
                    if (visualizerGrid[ny + 1][nx].type === NODE_TYPE.WALL_NODE) {
                        visualizerGrid[ny + 1][nx].changeType(NODE_TYPE.EMPTY_NODE);
                    }
                } break;
                case 'down':
                {
                    if (visualizerGrid[ny - 1][nx].type === NODE_TYPE.WALL_NODE) {
                        visualizerGrid[ny - 1][nx].changeType(NODE_TYPE.EMPTY_NODE);
                    }
                } break;
            }
            await sleep(10);
            // Record that the node is visited
            visited[ny][nx] = 1;
            await recursiveBacktrackingMaze(nx, ny, visited, visualizerGrid);
        }
    }
}

async function ellerAlgorithmMaze(width, height, visualizerGrid) {
    let unusedSetNum = [];
    // Mapping of the given a `set number` indicating which position
    // is the member of `set number`
    let set = {};
    for (let i = 0; i * 2 < width; i++) {
        unusedSetNum[i] = i;
        set[i] = [];
    }

    // Now currentLine not belonging to any set indicate it by -1
    let currentLine = [];
    for (let i = 0; i * 2 < width; i++) {
        currentLine[i] = -1;
    }

    let wall;
    for (let y = 0; y < height; y += 2) {
        wall = [];
        // Not final line
        // 1. Assign each set to the line
        for (let i = 0; i * 2 < width; i++) {
            if (currentLine[i] === -1) {
                let elem = unusedSetNum.pop();
                currentLine[i] = elem;
                set[elem].push(i);
            }
        }

        // 2. Randomly join the set of current line (if belong to same set, always add the wall)
        //    and create the right wall
        for (let i = 0; i + 1 < currentLine.length; i++) {
            let addWall = getRandomBool();
            if (currentLine[i] !== currentLine[i + 1] && !addWall) {
                // Don't add wall
                let mergedSetNum = currentLine[i];
                let removeSetNum = currentLine[i + 1];
                unusedSetNum.push(removeSetNum);
                // Merge the set
                for (let j = 0; j < set[removeSetNum].length; j++) {
                    currentLine[set[removeSetNum][j]] = mergedSetNum;
                    set[mergedSetNum].push(set[removeSetNum][j]);
                }
                set[removeSetNum] = [];
            }
            else {
                // Add wall
                let node = visualizerGrid[y][i * 2 + 1];
                wall.push(i);
                if (node.type === NODE_TYPE.EMPTY_NODE) {
                    visualizerGrid[y][i * 2 + 1].changeType(NODE_TYPE.WALL_NODE);
                }
            }
            await sleep(10);
        }

        // 3. Randomly decide to add bottom wall or not on current but each set at least
        //    must be able to go down (free path)
        // 4. Remove the cell with bottom wall from their set
        if (y + 2 < height) {
            // Not a final line
            let keyValMap = Object.entries(set);
            for (let i = 0; i < keyValMap.length; i++) {
                if (keyValMap[i][1].length > 1) {
                    let setNum = Number(keyValMap[i][0]);
                    let maxWall = keyValMap[i][1].length - 1;
                    let addedWall = 0;
                    let pos = keyValMap[i][1];
                    
                    let positionToRemove = [];
                    for (let j = 0; j < pos.length && addedWall < maxWall; j++) {
                        let letsAddWall = getRandomBool();
                        if (letsAddWall) {
                            addedWall++;
                            if (visualizerGrid[y + 1][pos[j] * 2].type === NODE_TYPE.EMPTY_NODE) {
                                visualizerGrid[y + 1][pos[j] * 2].changeType(NODE_TYPE.WALL_NODE);
                            }
                            // Remove the cell with bottom wall from their set
                            currentLine[pos[j]] = -1;
                            positionToRemove.push(j);
                        }
                    }

                    for (let j = positionToRemove.length - 1; j >= 0; j--) {
                        set[setNum].splice(positionToRemove[j], 1);
                    }
                }
                await sleep(10);
            }
        }
        else {
            // Final line
            // 5. For each adjacent element that is not of the same set, remove the wall.
            //    Add wall to the bottom of all element
            for (let i = 0; i < wall.length; i++) {
                if (currentLine[wall[i]] !== currentLine[wall[i] + 1]) {
                    if (visualizerGrid[y][wall[i] * 2 + 1].type === NODE_TYPE.WALL_NODE) {
                        visualizerGrid[y][wall[i] * 2 + 1].changeType(NODE_TYPE.EMPTY_NODE);
                    }
                }
            }

            for (let i = 0; i < width; i += 2) {
                if (visualizerGrid[y + 1][i].type === NODE_TYPE.EMPTY_NODE) { 
                    visualizerGrid[y + 1][i].changeType(NODE_TYPE.WALL_NODE);
                }
            }
        }
    }
}

async function kruskalAlgorithmMaze(parent, rank, edges, visualizerGrid) {
    for (let i = 0; i < edges.length; i++) {
        let x = edges[i][0];
        let y = edges[i][1];
        let dir = edges[i][2];
        switch (dir) {
            case 'left':
            {
                let nodeA = visualizerGrid[y][x].id;
                let nodeB = visualizerGrid[y][x - 2].id;
                if (disjointSetUnion(parent, rank, nodeA, nodeB)) {
                    visualizerGrid[y][x - 1].deleteWall();
                    await sleep(10);
                }
            } break;
            case 'up':
            {
                let nodeA = visualizerGrid[y][x].id;
                let nodeB = visualizerGrid[y - 2][x].id;
                if (disjointSetUnion(parent, rank, nodeA, nodeB)) {
                    visualizerGrid[y - 1][x].deleteWall();
                    await sleep(10);
                }
            } break;
        }
    }
}

async function primAlgorithmMaze(x, y, visitedAndFrontier, visualizerGrid) {
    const VISITED = 0x01;
    const FRONTIER = 0x02;
    function addFrontier(x, y, visitedAndFrontier, frontiers) {
        // left
        if (x - 2 >= 0) {
            if ((visitedAndFrontier[y][x - 2] & FRONTIER) === 0 && (visitedAndFrontier[y][x - 2] & VISITED) === 0) {
                visitedAndFrontier[y][x - 2] |= FRONTIER;
                frontiers.push([x - 2, y]);
                console.log(visualizerGrid[y][x - 2].elem);
            }
        }
        // up
        if (y - 2 >= 0) {
            if ((visitedAndFrontier[y - 2][x] & FRONTIER) === 0 && (visitedAndFrontier[y - 2][x] & VISITED) === 0) {
                visitedAndFrontier[y - 2][x] |= FRONTIER;
                frontiers.push([x, y - 2]);
                console.log(visualizerGrid[y - 2][x].elem);
            }
        }
        // right
        if (x + 2 < VISUALIZER_GRID_WIDTH) {
            if ((visitedAndFrontier[y][x + 2] & FRONTIER) === 0 && (visitedAndFrontier[y][x + 1] & VISITED) === 0) {
                visitedAndFrontier[y][x + 2] |= FRONTIER;
                frontiers.push([x + 2, y]);
                console.log(visualizerGrid[y][x + 2].elem);
            }
        }
        // bottom
        if (y + 2 < VISUALIZER_GRID_HEIGHT) {
            if ((visitedAndFrontier[y + 2][x] & FRONTIER) === 0 && (visitedAndFrontier[y + 2][x] & VISITED) === 0) {
                visitedAndFrontier[y + 2][x] |= FRONTIER;
                frontiers.push([x, y + 2]);
                console.log(visualizerGrid[y + 2][x].elem);
            }
        }
    }

    visitedAndFrontier[y][x] |= VISITED | FRONTIER;

    let frontiers = [];
    addFrontier(x, y, visitedAndFrontier, frontiers)
    while (frontiers.length > 0) {
        let random = getRandomInt(0, frontiers.length);
        let nx = frontiers[random][0];
        let ny = frontiers[random][1];
        frontiers.splice(random, 1);

        let choice = [];
        if (validPos(nx - 2, ny) && (visitedAndFrontier[ny][nx - 2] & VISITED) !== 0) {
            choice.push('left');
        }
        if (validPos(nx, ny - 2) && (visitedAndFrontier[ny - 2][nx] & VISITED) !== 0) {
            choice.push('up');
        }
        if (validPos(nx + 2, ny) && (visitedAndFrontier[ny][nx + 2] & VISITED) !== 0) {
            choice.push('right');
        }
        if (validPos(nx, ny + 2) && (visitedAndFrontier[ny + 2][nx] & VISITED) !== 0) {
            choice.push('down');
        }

        // Carve wall
        if (choice.length > 0) {
            let dir = choice[getRandomInt(0, choice.length)];
            switch (dir) {
                case 'left':
                {
                    visualizerGrid[ny][nx - 1].deleteWall();
                } break;
                case 'up':
                {
                    visualizerGrid[ny - 1][nx].deleteWall();
                } break;
                case 'right':
                {
                    visualizerGrid[ny][nx + 1].deleteWall();
                } break;
                case 'down':
                {
                    visualizerGrid[ny + 1][nx].deleteWall();
                } break;
            }
        }
        visitedAndFrontier[ny][nx] |= VISITED;
        addFrontier(nx, ny, visitedAndFrontier, frontiers);
        await sleep(10);
    }
}

async function sidewinderAlgorithmMaze(visualizerGrid) {
    for (let y = 0; y < VISUALIZER_GRID_HEIGHT; y += 2) {
        let runList = [];
        for (let x = 0; x < VISUALIZER_GRID_WIDTH; x += 2) {
            runList.push([x, y]);
            if (y - 2 >= 0 && x + 2 < VISUALIZER_GRID_WIDTH) {
                // choose to carve east or north
                let letsCarveEast = getRandomBool();
                if (letsCarveEast) {
                    visualizerGrid[y][x + 1].deleteWall();
                }
                else {
                    // Randomly carve north from current run set and empty it
                    let random = getRandomInt(0, runList.length);
                    let nx = runList[random][0];
                    let ny = runList[random][1];
                    visualizerGrid[ny - 1][nx].deleteWall();
                    runList = [];
                }
            }
            else if (y - 2 >= 0) {
                // Randomly carve north from current run set and empty it
                let random = getRandomInt(0, runList.length);
                let nx = runList[random][0];
                let ny = runList[random][1];
                visualizerGrid[ny - 1][nx].deleteWall();
                runList = [];
            }
            else if (x + 2 < VISUALIZER_GRID_WIDTH) {
                // carve east only
                visualizerGrid[y][x + 1].deleteWall();
            }
            await sleep(10);
        }
    }
}

async function binaryTreeMaze(width, height, visualizerGrid) {
    for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
            // NOTE(Vendryan): North, west bias
            if (x - 2 >= 0 && y - 2 >= 0) {
                let random = getRandomInt(0, 2);
                if (random === 0) {
                    // Delete north wall
                    visualizerGrid[y - 1][x].deleteWall();
                }
                else {
                    // Delete west wall
                    visualizerGrid[y][x - 1].deleteWall();
                }
            }
            else if (x - 2 >= 0) {
                visualizerGrid[y][x - 1].deleteWall();
            }
            else if (y - 2 >= 0) {
                visualizerGrid[y - 1][x].deleteWall();
            }

            await sleep(10);
        }
    }
}

function clearMaze() {
    for (let y = 0; y < VISUALIZER_GRID_HEIGHT; ++y) {
        for (let x = 0; x < VISUALIZER_GRID_WIDTH; ++x) {
            let node = visualizerGrid[y][x];
            if (node.type === NODE_TYPE.WALL_NODE || node.type === NODE_TYPE.VISITED_NODE || node.type === NODE_TYPE.PATH_NODE) {
                node.type = NODE_TYPE.EMPTY_NODE;
                node.elem.classList.remove('visualizer-grid__node--wall', 'visualizer-grid__node--visited', 'visualizer-grid__node--path');
            }
        }
    }
}

function clearVisitedNode() {
    for (let y = 0; y < VISUALIZER_GRID_HEIGHT; ++y) {
        for (let x = 0; x < VISUALIZER_GRID_WIDTH; ++x) {
            let node = visualizerGrid[y][x];
            if (node.type === NODE_TYPE.VISITED_NODE || node.type === NODE_TYPE.PATH_NODE) {
                node.changeType(NODE_TYPE.EMPTY_NODE);
            }
        }
    }
}

function toggleVisualizationButtonState() {
    document.getElementById('clear-maze').toggleAttribute("disabled");
    document.getElementById('start-visualize').toggleAttribute("disabled");
    document.getElementById('generate-maze').toggleAttribute("disabled");
}

document.addEventListener('DOMContentLoaded', function(evt) {
    let visualizerGridElem = document.querySelector('.visualizer-grid');

    for (let y = 0; y < VISUALIZER_GRID_HEIGHT; ++y) {
        let row = [];
        let rowElem = document.createElement('div');
        rowElem.classList.add('visualizer-grid__row');
        rowElem.style.gridTemplateColumns = `repeat(${VISUALIZER_GRID_WIDTH}, 1fr)`;

        for (let x = 0; x < VISUALIZER_GRID_WIDTH; ++x) {
            let node = document.createElement('div');
            let text = document.createElement('div');
            // text.textContent = '1';
            // text.classList.add('visualizer-grid__text');
            // node.appendChild(text);

            node.classList.add(`${x}-${y}`, 'visualizer-grid__node', 'visualizer-grid__node--border-rb');
            node.dataset.x = x;
            node.dataset.y = y ;

            rowElem.appendChild(node);

            if (x == SOURCE_NODE.x && y == SOURCE_NODE.y) {
                node.classList.add('visualizer-grid__node--source');
                row.push(new Node(x, y, NODE_TYPE.SOURCE_NODE, node));
            }
            else if (x == DESTINATION_NODE.x && y == DESTINATION_NODE.y) {
                node.classList.add('visualizer-grid__node--destination');
                row.push(new Node(x, y, NODE_TYPE.DESTINATION_NODE, node));
            }
            else {
                row.push(new Node(x, y, NODE_TYPE.EMPTY_NODE, node));
            }

            // Mouse Down Event
            node.addEventListener('pointerdown', function(event) {
                // NOTE(Vendryan): Avoid dragging behaviour
                event.preventDefault();
                event.stopPropagation();
                event.currentTarget.releasePointerCapture(event.pointerId);

                let x = event.currentTarget.dataset.x;
                let y = event.currentTarget.dataset.y;
                let currentNode = visualizerGrid[y][x];
                mouseIsDown = true;
                switch (currentNode.type) {
                    case NODE_TYPE.EMPTY_NODE:
                    {
                        action = ACTION.MAKING_WALL;
                        currentNode.type = NODE_TYPE.WALL_NODE;
                        event.currentTarget.classList.add('visualizer-grid__node--wall');
                    } break;

                    case NODE_TYPE.WALL_NODE:
                    {
                        action = ACTION.REMOVE_WALL;
                        currentNode.type = NODE_TYPE.EMPTY_NODE;
                        event.currentTarget.classList.remove('visualizer-grid__node--wall');
                    } break;

                    case NODE_TYPE.SOURCE_NODE:
                    {
                        action = ACTION.MOVE_SOURCE;

                        // Update the source node location
                        boardState.sourceNode.x = x;
                        boardState.sourceNode.y = y;

                        oldNode = {
                            type: NODE_TYPE.EMPTY_NODE,
                            x: x,
                            y: y,
                        };
                    } break;

                    case NODE_TYPE.DESTINATION_NODE:
                    {
                        action = ACTION.MOVE_DESTINATION;

                        // Update the destination node location
                        boardState.destinationNode.x = x;
                        boardState.destinationNode.y = y;

                        oldNode = {
                            type: NODE_TYPE.EMPTY_NODE,
                            x: x,
                            y: y,
                        };
                    } break;
                }
            });

            // Mouse enter event (Only do something when mouseIsDown)
            node.addEventListener('pointerenter', function(event) {
                // NOTE(Vendryan): Only colour / uncolour it if mouse is not down
                if (mouseIsDown) {
                    let x = event.currentTarget.dataset.x;
                    let y = event.currentTarget.dataset.y;
                    let currentNode = visualizerGrid[y][x];
                    
                    switch (action) {
                        case ACTION.MAKING_WALL:
                        {
                            if (currentNode.type === NODE_TYPE.EMPTY_NODE) {
                                currentNode.type = NODE_TYPE.WALL_NODE;
                                event.currentTarget.classList.add('visualizer-grid__node--wall');
                            }
                        } break;

                        case ACTION.REMOVE_WALL:
                        {
                            if (currentNode.type === NODE_TYPE.WALL_NODE) {
                                currentNode.type = NODE_TYPE.EMPTY_NODE;
                                event.currentTarget.classList.remove('visualizer-grid__node--wall');
                            }
                        } break;

                        case ACTION.MOVE_SOURCE:
                        {
                            // NOTE(Vendryan): Don't allow source node to move to destination node
                            if (currentNode.type !== NODE_TYPE.DESTINATION_NODE) {
                                visualizerGrid[oldNode.y][oldNode.x].changeType(oldNode.type);
                                oldNode = {
                                    type: currentNode.type,
                                    x: x,
                                    y: y,
                                };

                                // Update the source node location
                                boardState.sourceNode.x = x;
                                boardState.sourceNode.y = y;

                                visualizerGrid[y][x].changeType(NODE_TYPE.SOURCE_NODE);
                            }
                        } break;

                        case ACTION.MOVE_DESTINATION:
                        {
                            // NOTE(Vendryan): Don't allow destination node to move to source node
                            if (currentNode.type !== NODE_TYPE.SOURCE_NODE) {
                                visualizerGrid[oldNode.y][oldNode.x].changeType(oldNode.type);
                                oldNode = {
                                    type: currentNode.type,
                                    x: x,
                                    y: y,
                                }

                                // Update the destination node location
                                boardState.destinationNode.x = x;
                                boardState.destinationNode.y = y;

                                visualizerGrid[y][x].changeType(NODE_TYPE.DESTINATION_NODE);
                            }
                        } break;
                    }
                    
                }
            });

            // MouseUp, reset all
            node.addEventListener('pointerup', function(event) {
                event.stopPropagation();
                action = ACTION.NONE;
                mouseIsDown = false;
                oldNode = null;
            });
        }

        visualizerGridElem.appendChild(rowElem);
        visualizerGrid.push(row);
    }

    // MouseUp, reset all
    window.addEventListener('pointerup', function(event) {
        action = ACTION.NONE;
        mouseIsDown = false;
        oldNode = null;
    })

    // Choosing Algorithm Event
    document.getElementById('algorithm').addEventListener('change', function(event) {
        boardState.algorithm = event.currentTarget.value;
    });

    // Choosing maze event
    document.getElementById('maze').addEventListener('change', function(event) {
        boardState.mazeAlgorithm = event.currentTarget.value;
    });

    // Clear board onclick
    document.getElementById('clear-maze').addEventListener('click', function(event) {
        clearMaze();
    })

    // Generate maze
    document.getElementById('generate-maze').addEventListener('click', async function(event) {
        clearMaze();
        toggleVisualizationButtonState();
        switch (boardState.mazeAlgorithm) {
            case 'recursive-division':
            {
                await recursiveDivisionMaze(0, VISUALIZER_GRID_WIDTH - 1, 0, VISUALIZER_GRID_HEIGHT - 1, visualizerGrid);
            } break;
            case 'recursive-backtracking':
            {
                clearMaze();
                for (let y = 1; y < VISUALIZER_GRID_HEIGHT; y += 2) {
                    for (let x = 0; x < VISUALIZER_GRID_WIDTH; x++) {
                        if (visualizerGrid[y][x].type === NODE_TYPE.EMPTY_NODE) {
                            visualizerGrid[y][x].changeType(NODE_TYPE.WALL_NODE);
                        }
                    }
                }
                for (let x = 1; x < VISUALIZER_GRID_WIDTH; x += 2) {
                    for (let y = 0; y < VISUALIZER_GRID_HEIGHT; y++) {
                        if (visualizerGrid[y][x].type === NODE_TYPE.EMPTY_NODE) {
                            visualizerGrid[y][x].changeType(NODE_TYPE.WALL_NODE);
                        }
                    }
                }
                let visited = [];
                // Fill the visited array with 0
                for (let i = 0; i < VISUALIZER_GRID_HEIGHT; i++) {
                    visited[i] = new Array(VISUALIZER_GRID_WIDTH).fill(0);
                }
                let randomX = getEvenRandomInt(0, VISUALIZER_GRID_WIDTH);
                let randomY = getEvenRandomInt(0, VISUALIZER_GRID_HEIGHT);
                visited[randomY][randomX] = 1;
                await recursiveBacktrackingMaze(
                    randomX,
                    randomY,
                    visited,
                    visualizerGrid
                );
            } break;
            case 'eller-algorithm':
            {
                clearMaze();
                for (let y = 1; y < VISUALIZER_GRID_HEIGHT; y += 2) {
                    for (let x = 1; x < VISUALIZER_GRID_WIDTH; x += 2) {
                        if (visualizerGrid[y][x].type === NODE_TYPE.EMPTY_NODE) {
                            visualizerGrid[y][x].changeType(NODE_TYPE.WALL_NODE);
                        }
                    }
                }
                
                await ellerAlgorithmMaze(VISUALIZER_GRID_WIDTH, VISUALIZER_GRID_HEIGHT, visualizerGrid);
            } break;
            case 'kruskal-algorithm':
            {
                clearMaze();
                for (let y = 1; y < VISUALIZER_GRID_HEIGHT; y += 2) {
                    for (let x = 0; x < VISUALIZER_GRID_WIDTH; x++) {
                        if (visualizerGrid[y][x].type === NODE_TYPE.EMPTY_NODE) {
                            visualizerGrid[y][x].changeType(NODE_TYPE.WALL_NODE);
                        }
                    }
                }
                for (let x = 1; x < VISUALIZER_GRID_WIDTH; x += 2) {
                    for (let y = 0; y < VISUALIZER_GRID_HEIGHT; y++) {
                        if (visualizerGrid[y][x].type === NODE_TYPE.EMPTY_NODE) {
                            visualizerGrid[y][x].changeType(NODE_TYPE.WALL_NODE);
                        }
                    }
                }

                let counter = 0;
                let edges = [];
                for (let y = 0; y < VISUALIZER_GRID_HEIGHT; y += 2) {
                    for (let x = 0; x < VISUALIZER_GRID_WIDTH; x += 2) {
                        visualizerGrid[y][x].id = counter++;
                        if (x - 2 >= 0) {
                            edges.push([x, y, 'left']);
                        }
                        if (y - 2 >= 0) {
                            edges.push([x, y, 'up']);
                        }
                    }
                }
                shuffle(edges);

                // For Union Find Algorithm
                let parent = new Array(counter);
                let rank = new Array(counter).fill(0);
                for (let i = 0; i < parent.length; i++) {
                    parent[i] = i;
                }

                await kruskalAlgorithmMaze(parent, rank, edges, visualizerGrid);
            } break;
            case 'prim-algorithm':
            {
                clearMaze();
                for (let y = 1; y < VISUALIZER_GRID_HEIGHT; y += 2) {
                    for (let x = 0; x < VISUALIZER_GRID_WIDTH; x++) {
                        if (visualizerGrid[y][x].type === NODE_TYPE.EMPTY_NODE) {
                            visualizerGrid[y][x].changeType(NODE_TYPE.WALL_NODE);
                        }
                    }
                }
                for (let x = 1; x < VISUALIZER_GRID_WIDTH; x += 2) {
                    for (let y = 0; y < VISUALIZER_GRID_HEIGHT; y++) {
                        if (visualizerGrid[y][x].type === NODE_TYPE.EMPTY_NODE) {
                            visualizerGrid[y][x].changeType(NODE_TYPE.WALL_NODE);
                        }
                    }
                }

                // When bit 1 is set then its visited
                // When bit 2 is set then its already a frontier
                let visitedAndFrontier = [];
                // Fill the visited array with 0
                for (let i = 0; i < VISUALIZER_GRID_HEIGHT; i++) {
                    visitedAndFrontier[i] = new Array(VISUALIZER_GRID_WIDTH).fill(0);
                }
                let randomX = getEvenRandomInt(0, VISUALIZER_GRID_WIDTH);
                let randomY = getEvenRandomInt(0, VISUALIZER_GRID_HEIGHT);
                await primAlgorithmMaze(randomX, randomY, visitedAndFrontier, visualizerGrid);
            } break;
            case 'binary-tree':
            {
                clearMaze();
                for (let y = 1; y < VISUALIZER_GRID_HEIGHT; y += 2) {
                    for (let x = 0; x < VISUALIZER_GRID_WIDTH; x++) {
                        if (visualizerGrid[y][x].type === NODE_TYPE.EMPTY_NODE) {
                            visualizerGrid[y][x].changeType(NODE_TYPE.WALL_NODE);
                        }
                    }
                }
                for (let x = 1; x < VISUALIZER_GRID_WIDTH; x += 2) {
                    for (let y = 0; y < VISUALIZER_GRID_HEIGHT; y++) {
                        if (visualizerGrid[y][x].type === NODE_TYPE.EMPTY_NODE) {
                            visualizerGrid[y][x].changeType(NODE_TYPE.WALL_NODE);
                        }
                    }
                }
                await binaryTreeMaze(VISUALIZER_GRID_WIDTH, VISUALIZER_GRID_HEIGHT, visualizerGrid);
            } break;
            case 'sidewinder':
            {
                clearMaze();
                for (let y = 1; y < VISUALIZER_GRID_HEIGHT; y += 2) {
                    for (let x = 0; x < VISUALIZER_GRID_WIDTH; x++) {
                        if (visualizerGrid[y][x].type === NODE_TYPE.EMPTY_NODE) {
                            visualizerGrid[y][x].changeType(NODE_TYPE.WALL_NODE);
                        }
                    }
                }
                for (let x = 1; x < VISUALIZER_GRID_WIDTH; x += 2) {
                    for (let y = 0; y < VISUALIZER_GRID_HEIGHT; y++) {
                        if (visualizerGrid[y][x].type === NODE_TYPE.EMPTY_NODE) {
                            visualizerGrid[y][x].changeType(NODE_TYPE.WALL_NODE);
                        }
                    }
                }
                await sidewinderAlgorithmMaze(visualizerGrid);
            } break;
        }
        toggleVisualizationButtonState();
    });

    // Start Visualization
    document.getElementById('start-visualize').addEventListener('click', async function(event) {
        clearVisitedNode();
        toggleVisualizationButtonState();
        switch (boardState.algorithm) {
            case 'bfs':
            {
                await BFS(boardState.sourceNode.x, boardState.sourceNode.y, visualizerGrid);
            } break;
            case 'dfs':
            {
                await DFS(boardState.sourceNode.x, boardState.sourceNode.y, visualizerGrid);
            } break;
            case 'a*':
            {
                await AStar(boardState.sourceNode.x, boardState.sourceNode.y, visualizerGrid);
            } break;
        }
        toggleVisualizationButtonState();
    });
});
