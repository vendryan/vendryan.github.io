const STEPPER_VISUALIZER_WIDTH = 5;
const STEPPER_VISUALIZER_HEIGHT = 5;
const STEPPER = {
    INIT: 0,  // for pushing source node and other initialization stuff into stack/queue/open list
    GET_ELEM: 1,  // get current node of the stack/queue/open list
    CHECK_VISIT: 2,  // check if current node is visited, if yes skip it
    CHECK_NODE: 3, // Check if the current node is visited, if yes make the path
    CONSIDER_LEFT: 4,  // check left neighbour
    CONSIDER_DOWN: 5,  // check bottom neighbour
    CONSIDER_RIGHT: 6,  // check right neighbour
    CONSIDER_TOP: 7,  // check top neighbour
    CHECK_HAVE_PATH: 8,  // Check if able to reach destination node
    MAKE_PATH: 9,  // make the path
    END: 10,  // end
}

let stepper = null;
let stepperVisualizerGrid = [];

class DFSStepper {
    constructor(width, height, grid) {
        this.currentStep = STEPPER.INIT;
        this.visited = [];
        this.stack = [];
        this.currentNode = null;
        this.grid = grid;
        this.width = width;
        this.height = height;
        this.description = null;
        this.tooltip = null;
        this.stackElem = document.getElementById('stack').querySelector('.flex-container');
        this.visitedElem = document.getElementById('visited').querySelector('.flex-container');
        this.currentNodeElem = document.getElementById('current-node');

        for (let i = 0; i < height; i++) {
            this.visited[i] = new Array(width).fill(0);
        }

        this.cleanMaze();
        this.clearElement();
        ellerAlgorithmMaze(this.width, this.height, this.grid);
    }

    cleanMaze() {
        clearMaze(this.width, this.height, this.grid)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x].removeText();
                this.grid[y][x].tooltip.hide();
            }
        }
        for (let y = 1; y < this.height; y += 2) {
            for (let x = 1; x < this.width; x += 2) {
                if (this.grid[y][x].type === NODE_TYPE.EMPTY_NODE) {
                    this.grid[y][x].changeType(NODE_TYPE.WALL_NODE);
                }
            }
        }
    }

    step() {
        switch (this.currentStep) {
            case STEPPER.INIT:
            {
                this.stack.push(this.grid[0][0]);
                this.grid.parent_x = null;
                this.grid.parent_y = null;
                console.log(`Push Node(0, 0) into the stack`);
                this.addStackElement(0, 0);

                this.description = `Push Node(0, 0) into the stack`;
                this.tooltip = this.grid[0][0].tooltip;
                this.tooltip.toggle();

                this.currentStep = STEPPER.GET_ELEM;
            } break;
            case STEPPER.GET_ELEM:
            {
                if (this.stack.length > 0) {
                    this.currentNode = this.stack.pop();
                    let x = this.currentNode.x;
                    let y = this.currentNode.y;
                    console.log(`Pop Node(${x}, ${y}) from the stack`);
                    this.description = `Pop Node(${x},${y}) from the stack`;
                    this.removeNthElement(this.stack.length);
                    this.setCurrentNodeElement(x, y);

                    // If the node empty node, change the color to something different
                    this.currentNode.addColorIfEmptyNode(NODE_TYPE.HIGLIGHT_NODE);

                    if (this.tooltip !== this.currentNode.tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.currentNode.tooltip;
                        this.tooltip.toggle();
                    }
                    

                    this.currentStep = STEPPER.CHECK_VISIT;
                }
                else {
                    this.currentStep = STEPPER.MAKE_PATH;
                    this.step();
                }
            } break;
            case STEPPER.CHECK_VISIT:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;
                if (this.visited[y][x]) {
                    console.log(`Node(${x}, ${y}) is already visited!`);
                    this.description = `Node(${x}, ${y}) is already visited!`;
                    this.currentStep = STEPPER.GET_ELEM;
                }
                else {
                    this.currentStep = STEPPER.CHECK_NODE;
                    this.step();
                }
            } break;
            case STEPPER.CHECK_NODE:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;

                if (this.currentNode.type === NODE_TYPE.EMPTY_NODE || this.currentNode.type === NODE_TYPE.SOURCE_NODE) {
                    console.log(`Mark Node(${x},${y}) as visited`);
                    this.description = `Mark Node(${x},${y}) as visited`;

                    if (this.currentNode.type === NODE_TYPE.EMPTY_NODE) {
                        this.currentNode.changeType(NODE_TYPE.VISITED_NODE);
                    }
                    this.visited[y][x] = 1;
                    this.addVisitedElement(x, y);
                    this.currentStep = STEPPER.CONSIDER_LEFT;
                }
                else if (this.currentNode.type === NODE_TYPE.DESTINATION_NODE) {
                    console.log(`Found Node(${x},${y}) as destination`);
                    this.description = `Found Node(${x},${y}) as destination`;
                    this.currentStep = STEPPER.MAKE_PATH;
                }
                else {
                    // this happen when current node is source node
                    this.currentStep = STEPPER.CONSIDER_LEFT;
                    this.step();
                }
            } break;
            case STEPPER.CONSIDER_LEFT:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;

                if (x - 1 >= 0) {
                    if (this.tooltip !== this.grid[y][x - 1].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[y][x - 1].tooltip;
                        this.tooltip.toggle();
                    }
                }

                if (x - 1 >= 0 && this.grid[y][x - 1].validNode()) {
                    this.stack.push(this.grid[y][x - 1]);
                    // NOTE(Vendryan): Give color indicating as the node to be considered in the future
                    this.grid[y][x - 1].addColorIfEmptyNode(NODE_TYPE.FUTURE_NODE);
                    this.grid[y][x - 1].parent_x = x;
                    this.grid[y][x - 1].parent_y = y;
                    this.addStackElement(x - 1, y);

                    console.log(`Push Node(${x - 1},${y}) into the stack`);
                    console.log(`Make Node(${x},${y}) as the parent of Node(${x - 1},${y})`);
                    this.description = `Push Node(${x - 1},${y}) into the stack and ` +
                        `make Node(${x},${y}) as the parent of Node(${x - 1},${y})`;
                }
                else if (x - 1 < 0) {
                    console.log(`There is no left neighbour`);
                    this.description = `There is no left neighbor`;
                }
                else if (this.grid[y][x - 1].type === NODE_TYPE.WALL_NODE) {
                    console.log(`Node(${x - 1},${y}) is a wall node, don't add it into stack`);
                    this.description = `Node(${x - 1},${y}) is a wall node, don't add it into stack`;
                }
                else if (this.grid[y][x - 1].type === NODE_TYPE.SOURCE_NODE) {
                    console.log(`Node(${x - 1},${y}) is a source node, don't add it into stack`);
                    this.description = `Node(${x - 1},${y}) is a source node, don't add it into stack`;
                }
                else if (this.grid[y][x - 1].type === NODE_TYPE.VISITED_NODE) {
                    console.log(`Node(${x - 1},${y}) is already visited, don't add it into stack`);
                    this.description = `Node(${x - 1},${y}) is already visited, don't add it into stack`;
                }
                this.currentStep = STEPPER.CONSIDER_DOWN;
            } break;

            case STEPPER.CONSIDER_DOWN:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;

                if (y + 1 < this.height) {
                    if (this.tooltip !== this.grid[y + 1][x].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[y + 1][x].tooltip;
                        this.tooltip.toggle();
                    }
                }

                if (y + 1 < this.height && this.grid[y + 1][x].validNode()) {
                    this.stack.push(this.grid[y + 1][x]);
                    this.grid[y + 1][x].addColorIfEmptyNode(NODE_TYPE.FUTURE_NODE);
                    this.grid[y + 1][x].parent_x = x;
                    this.grid[y + 1][x].parent_y = y;
                    this.addStackElement(x, y + 1);

                    console.log(`Push Node(${x},${y + 1}) into the stack`);
                    console.log(`Make Node(${x},${y}) as the parent of Node(${x},${y + 1})`);
                    this.description = `Push Node(${x},${y + 1}) into the stack and ` +
                        `make Node(${x},${y}) as the parent of Node(${x},${y + 1})`;
                }
                else if (y + 1 >= this.height) {
                    console.log(`There is no bottom neighbor`);
                    this.description = `There is no bottom neighbor`;
                }
                else if (this.grid[y + 1][x].type === NODE_TYPE.WALL_NODE) {
                    console.log(`Node(${x},${y + 1}) is a wall node, don't add it into stack`);
                    this.description = `Node(${x},${y + 1}) is a wall node, don't add it into stack`;
                }
                else if (this.grid[y + 1][x].type === NODE_TYPE.SOURCE_NODE) {
                    console.log(`Node(${x},${y + 1}) is a source node, don't add it into stack`);
                    this.description = `Node(${x},${y + 1}) is a source node, don't add it into stack`;
                }
                else if (this.grid[y + 1][x].type === NODE_TYPE.VISITED_NODE) {
                    console.log(`Node(${x},${y + 1}) is already visited, don't add it into stack`);
                    this.description = `Node(${x},${y + 1}) is already visited, don't add it into stack`;
                }
                this.currentStep = STEPPER.CONSIDER_RIGHT;
            } break;

            case STEPPER.CONSIDER_RIGHT:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;

                if (x + 1 < this.width) {
                    if (this.tooltip !== this.grid[y][x + 1].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[y][x + 1].tooltip;
                        this.tooltip.toggle();
                    }
                }

                if (x + 1 < this.width && this.grid[y][x + 1].validNode()) {
                    this.stack.push(this.grid[y][x + 1]);
                    this.grid[y][x + 1].addColorIfEmptyNode(NODE_TYPE.FUTURE_NODE);
                    this.grid[y][x + 1].parent_x = x;
                    this.grid[y][x + 1].parent_y = y;
                    this.addStackElement(x + 1, y);

                    console.log(`Push Node(${x + 1},${y}) into the stack`);
                    console.log(`Make Node(${x},${y}) as the parent of Node(${x + 1},${y})`);
                    this.description = `Push Node(${x + 1},${y}) into the stack and ` +
                        `make Node(${x},${y}) as the parent of Node(${x + 1},${y})`;
                }
                else if (x + 1 >= this.width) {
                    console.log(`There is no right neighbor`);
                    this.description = `There is no right neighbor`;
                }
                else if (this.grid[y][x + 1].type === NODE_TYPE.WALL_NODE) {
                    console.log(`Node(${x + 1},${y}) is a wall node, don't add it into stack`);
                    this.description = `Node(${x + 1},${y}) is a wall node, don't add it into stack`;
                }
                else if (this.grid[y][x + 1].type === NODE_TYPE.SOURCE_NODE) {
                    console.log(`Node(${x + 1},${y}) is a source node, don't add it into stack`);
                    this.description = `Node(${x + 1},${y}) is a source node, don't add it into stack`;
                }
                else if (this.grid[y][x + 1].type === NODE_TYPE.VISITED_NODE) {
                    console.log(`Node(${x + 1},${y}) is already visited, don't add it into stack`);
                    this.description = `Node(${x + 1},${y}) is already visited, don't add it into stack`;
                }
                this.currentStep = STEPPER.CONSIDER_TOP;
            } break;

            case STEPPER.CONSIDER_TOP:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;

                if (y - 1 >= 0) {
                    if (this.tooltip !== this.grid[y - 1][x].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[y - 1][x].tooltip;
                        this.tooltip.toggle();
                    }
                }

                if (y - 1 >= 0 && this.grid[y - 1][x].validNode()) {
                    this.stack.push(this.grid[y - 1][x]);
                    this.grid[y - 1][x].addColorIfEmptyNode(NODE_TYPE.FUTURE_NODE);
                    this.grid[y - 1][x].parent_x = x;
                    this.grid[y - 1][x].parent_y = y;
                    this.addStackElement(x, y - 1);

                    console.log(`Push Node(${x},${y - 1}) into the stack`);
                    console.log(`Make Node(${x},${y}) as the parent of Node(${x},${y - 1})`);
                    this.description = `Push Node(${x},${y - 1}) into the stack and ` +
                        `make Node(${x},${y}) as the parent of Node(${x},${y - 1})`;
                }
                else if (y - 1 < 0) {
                    console.log(`There is no top neighbor`);
                    this.description = `There is no top neighbor`;
                }
                else if (this.grid[y - 1][x].type === NODE_TYPE.WALL_NODE) {
                    console.log(`Node(${x},${y - 1}) is a wall node, don't add it into stack`);
                    this.description = `Node(${x},${y - 1}) is a wall node, don't add it into stack`;
                }
                else if (this.grid[y - 1][x].type === NODE_TYPE.SOURCE_NODE) {
                    console.log(`Node(${x},${y - 1}) is a source node, don't add it into stack`);
                    this.description = `Node(${x},${y - 1}) is a source node, don't add it into stack`;
                }
                else if (this.grid[y - 1][x].type === NODE_TYPE.VISITED_NODE) {
                    console.log(`Node(${x},${y - 1}) is already visited, don't add it into stack`);
                    this.description = `Node(${x},${y - 1}) is already visited, don't add it into stack`;
                }
                this.currentStep = STEPPER.GET_ELEM;
            } break;
            case STEPPER.CHECK_HAVE_PATH:
            {
                if (this.currentNode.type === NODE_TYPE.DESTINATION_NODE) {
                    this.currentStep = STEPPER.MAKE_PATH;
                    this.step();
                }
                else {
                    console.log('There is no path');
                    this.tooltip.toggle();
                    this.description = 'There is no path';
                    this.currentStep = STEPPER.END;
                }
            } break;
            case STEPPER.MAKE_PATH:
            {
                let node = this.currentNode;
                if (node.parent_x !== null && node.parent_y !== null) {
                    if (this.tooltip !== this.grid[node.parent_y][node.parent_x].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[node.parent_y][node.parent_x].tooltip;
                        this.tooltip.toggle();
                    }

                    this.currentNode = this.grid[node.parent_y][node.parent_x];
                    this.setCurrentNodeElement(node.parent_x, node.parent_y);
                    console.log(
                        `The parent of Node(${node.x},${node.y}) is Node(${node.parent_x},${node.parent_y}), ` +
                        `mark Node(${node.parent_x},${node.parent_y}) as the path`
                    );
                    this.description = 
                        `The parent of Node(${node.x},${node.y}) is Node(${node.parent_x},${node.parent_y}), ` +
                        `mark Node(${node.parent_x},${node.parent_y}) as the path`;
                    
                    if (this.currentNode.type !== NODE_TYPE.SOURCE_NODE) {
                        this.currentNode.changeType(NODE_TYPE.PATH_NODE);
                    }
                }
                else {
                    console.log('Path is carved');
                    this.tooltip.toggle();
                    this.description = 'Path is carved';
                    this.currentStep = STEPPER.END;
                }
            } break;
            case STEPPER.END:
            {

            } break;
        }
    }

    removeNthElement(n) {
        this.stackElem.removeChild(this.stackElem.childNodes[n]);
    }

    addStackElement(x, y) {
        let div = document.createElement('div');
        div.textContent = `Node(${x}, ${y})`;
        this.stackElem.appendChild(div);
    }

    addVisitedElement(x, y) {
        let div = document.createElement('div');
        div.textContent = `Node(${x}, ${y})`;
        this.visitedElem.appendChild(div);
    }

    setCurrentNodeElement(x, y) {
        this.currentNodeElem.textContent = `Node(${x}, ${y})`;
    }

    clearElement() {
        while (this.stackElem.firstChild) {
            this.stackElem.removeChild(this.stackElem.lastChild);
        }
        while (this.visitedElem.firstChild) {
            this.visitedElem.removeChild(this.visitedElem.lastChild);
        }
        this.currentNodeElem.textContent = '';
        document.getElementById('description').textContent = '';
    }
}

class BFSStepper {
    constructor(width, height, grid) {
        this.currentStep = STEPPER.INIT;
        this.visited = [];
        this.addedIntoQueue = [];
        this.queue = new Queue();
        this.currentNode = null;
        this.grid = grid;
        this.width = width;
        this.height = height;
        this.description = null;
        this.tooltip = null;
        this.queueElem = document.getElementById('queue').querySelector('.flex-container');
        this.visitedElem = document.getElementById('visited').querySelector('.flex-container');
        this.currentNodeElem = document.getElementById('current-node');

        for (let i = 0; i < height; i++) {
            this.visited[i] = new Array(width).fill(0);
            this.addedIntoQueue[i] = new Array(width).fill(0);
        }

        this.cleanMaze();
        this.clearElement();
        ellerAlgorithmMaze(this.width, this.height, this.grid);
    }

    cleanMaze() {
        clearMaze(this.width, this.height, this.grid)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x].removeText();
                this.grid[y][x].tooltip.hide();
            }
        }
        for (let y = 1; y < this.height; y += 2) {
            for (let x = 1; x < this.width; x += 2) {
                if (this.grid[y][x].type === NODE_TYPE.EMPTY_NODE) {
                    this.grid[y][x].changeType(NODE_TYPE.WALL_NODE);
                }
            }
        }
    }

    step() {
        switch (this.currentStep) {
            case STEPPER.INIT:
            {
                this.queue.enqueue(this.grid[0][0]);
                this.grid[0][0].parent_x = null;
                this.grid[0][0].parent_y = null;
                console.log(`Add Node(0, 0) into the queue`);
                this.description = `Add Node(0, 0) into the queue`;
                this.addQueueElement(0, 0);
                this.tooltip = this.grid[0][0].tooltip;
                this.tooltip.toggle();

                this.currentStep = STEPPER.GET_ELEM;
            } break;
            case STEPPER.GET_ELEM:
            {
                if (this.queue.size > 0) {
                    this.currentNode = this.queue.dequeue();
                    let x = this.currentNode.x;
                    let y = this.currentNode.y;
                    console.log(`Dequeue Node(${x}, ${y}) from the queue`);
                    this.description = `Dequeue Node(${x}, ${y}) from the queue`;
                    this.removeNthElement(0);
                    this.setCurrentNodeElement(x, y);
                    // If the node empty node, change the color to something different
                    this.currentNode.addColorIfEmptyNode(NODE_TYPE.HIGLIGHT_NODE);

                    if (this.tooltip !== this.currentNode.tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.currentNode.tooltip;
                        this.tooltip.toggle();
                    }
                    

                    this.currentStep = STEPPER.CHECK_VISIT;
                }
                else {
                    this.currentStep = STEPPER.MAKE_PATH;
                    this.step();
                }
            } break;
            case STEPPER.CHECK_VISIT:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;
                if (this.visited[y][x]) {
                    console.log(`Node(${x}, ${y}) is already visited!`);
                    this.description = `Node(${x}, ${y}) is already visited!`;
                    this.currentStep = STEPPER.GET_ELEM;
                }
                else {
                    this.currentStep = STEPPER.CHECK_NODE;
                    this.step();
                }
            } break;
            case STEPPER.CHECK_NODE:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;

                if (this.currentNode.type === NODE_TYPE.EMPTY_NODE || this.currentNode.type === NODE_TYPE.SOURCE_NODE) {
                    console.log(`Mark Node(${x}, ${y}) as visited`);
                    this.description = `Mark Node(${x}, ${y}) as visited`;
                    this.addVisitedElement(x, y);

                    if (this.currentNode.type === NODE_TYPE.EMPTY_NODE) {
                        this.currentNode.changeType(NODE_TYPE.VISITED_NODE);
                    }
                    this.visited[y][x] = 1;
                    this.currentStep = STEPPER.CONSIDER_LEFT;
                }
                else if (this.currentNode.type === NODE_TYPE.DESTINATION_NODE) {
                    console.log(`Found Node(${x}, ${y}) as destination`);
                    this.description = `Found Node(${x}, ${y}) as destination`;
                    this.currentStep = STEPPER.MAKE_PATH;
                }
                else {
                    // this happen when current node is source node
                    this.currentStep = STEPPER.CONSIDER_LEFT;
                    this.step();
                }
            } break;
            case STEPPER.CONSIDER_LEFT:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;

                if (x - 1 >= 0) {
                    if (this.tooltip !== this.grid[y][x - 1].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[y][x - 1].tooltip;
                        this.tooltip.toggle();
                    }
                }

                if (x - 1 >= 0 && !this.visited[y][x - 1] && !this.addedIntoQueue[y][x - 1] && this.grid[y][x - 1].validNode()) {
                    this.queue.enqueue(this.grid[y][x - 1]);
                    this.addedIntoQueue[y][x - 1] = 1;
                    // NOTE(Vendryan): Give color indicating as the node to be considered in the future
                    this.grid[y][x - 1].addColorIfEmptyNode(NODE_TYPE.FUTURE_NODE);
                    this.grid[y][x - 1].parent_x = x;
                    this.grid[y][x - 1].parent_y = y;
                    this.addQueueElement(x - 1, y);

                    console.log(`Add Node(${x - 1}, ${y}) into the queue`);
                    console.log(`Make Node(${x}, ${y}) as the parent of Node(${x - 1}, ${y})`);
                    this.description = `Add Node(${x - 1}, ${y}) into the queue and ` +
                        `make Node(${x},${y}) as the parent of Node(${x - 1}, ${y})`;
                }
                else if (x - 1 < 0) {
                    console.log(`There is no left neighbour`);
                    this.description = `There is no left neighbor`;
                }
                else if (this.addedIntoQueue[y][x - 1]) {
                    console.log(`Node(${x - 1}, ${y}) already added into queue, don't add it again`);
                    this.description = `Node(${x - 1}, ${y}) already added into queue, don't add it again`;
                }
                else if (this.grid[y][x - 1].type === NODE_TYPE.WALL_NODE) {
                    console.log(`Node(${x - 1}, ${y}) is a wall node, don't add it into queue`);
                    this.description = `Node(${x - 1}, ${y}) is a wall node, don't add it into queue`;
                }
                else if (this.grid[y][x - 1].type === NODE_TYPE.SOURCE_NODE) {
                    console.log(`Node(${x - 1}, ${y}) is a source node, don't add it into queue`);
                    this.description = `Node(${x - 1}, ${y}) is a source node, don't add it into queue`;
                }
                else if (this.grid[y][x - 1].type === NODE_TYPE.VISITED_NODE) {
                    console.log(`Node(${x - 1}, ${y}) is already visited, don't add it into queue`);
                    this.description = `Node(${x - 1}, ${y}) is already visited, don't add it into queue`;
                }
                this.currentStep = STEPPER.CONSIDER_DOWN;
            } break;

            case STEPPER.CONSIDER_DOWN:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;

                if (y + 1 < this.height) {
                    if (this.tooltip !== this.grid[y + 1][x].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[y + 1][x].tooltip;
                        this.tooltip.toggle();
                    }
                }

                if (y + 1 < this.height && !this.visited[y + 1][x] && !this.addedIntoQueue[y + 1][x] && this.grid[y + 1][x].validNode()) {
                    this.queue.enqueue(this.grid[y + 1][x]);
                    this.addedIntoQueue[y + 1][x] = 1;
                    this.grid[y + 1][x].addColorIfEmptyNode(NODE_TYPE.FUTURE_NODE);
                    this.grid[y + 1][x].parent_x = x;
                    this.grid[y + 1][x].parent_y = y;
                    this.addQueueElement(x, y + 1);

                    console.log(`Add Node(${x}, ${y + 1}) into the queue`);
                    console.log(`Make Node(${x}, ${y}) as the parent of Node(${x},${y + 1})`);
                    this.description = `Add Node(${x}, ${y + 1}) into the queue and ` +
                        `make Node(${x}, ${y}) as the parent of Node(${x}, ${y + 1})`;
                }
                else if (y + 1 >= this.height) {
                    console.log(`There is no bottom neighbor`);
                    this.description = `There is no bottom neighbor`;
                }
                else if (this.addedIntoQueue[y + 1][x]) {
                    console.log(`Node(${x}, ${y + 1}) already added into queue, don't add it into queue`);
                    this.description = `Node(${x}, ${y + 1}) already added into queue, don't add it into queue`;
                }
                else if (this.grid[y + 1][x].type === NODE_TYPE.WALL_NODE) {
                    console.log(`Node(${x}, ${y + 1}) is a wall node, don't add it into queue`);
                    this.description = `Node(${x}, ${y + 1}) is a wall node, don't add it into queue`;
                }
                else if (this.grid[y + 1][x].type === NODE_TYPE.SOURCE_NODE) {
                    console.log(`Node(${x}, ${y + 1}) is a source node, don't add it into queue`);
                    this.description = `Node(${x}, ${y + 1}) is a source node, don't add it into queue`;
                }
                else if (this.grid[y + 1][x].type === NODE_TYPE.VISITED_NODE) {
                    console.log(`Node(${x}, ${y + 1}) is already visited, don't add it into queue`);
                    this.description = `Node(${x}, ${y + 1}) is already visited, don't add it into queue`;
                }
                this.currentStep = STEPPER.CONSIDER_RIGHT;
            } break;

            case STEPPER.CONSIDER_RIGHT:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;

                if (x + 1 < this.width) {
                    if (this.tooltip !== this.grid[y][x + 1].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[y][x + 1].tooltip;
                        this.tooltip.toggle();
                    }
                }

                if (x + 1 < this.width && !this.visited[y][x + 1] && !this.addedIntoQueue[y][x + 1] && this.grid[y][x + 1].validNode()) {
                    this.queue.enqueue(this.grid[y][x + 1]);
                    this.addedIntoQueue[y][x + 1] = 1;
                    this.grid[y][x + 1].addColorIfEmptyNode(NODE_TYPE.FUTURE_NODE);
                    this.grid[y][x + 1].parent_x = x;
                    this.grid[y][x + 1].parent_y = y;
                    this.addQueueElement(x + 1, y);

                    console.log(`Add Node(${x + 1}, ${y}) into the queue`);
                    console.log(`Make Node(${x}, ${y}) as the parent of Node(${x + 1},${y})`);
                    this.description = `Add Node(${x + 1}, ${y}) into the queue and ` +
                        `make Node(${x}, ${y}) as the parent of Node(${x + 1}, ${y})`;
                }
                else if (x + 1 >= this.width) {
                    console.log(`There is no right neighbor`);
                    this.description = `There is no right neighbor`;
                }
                else if (this.addedIntoQueue[y][x + 1]) {
                    console.log(`Node(${x + 1}, ${y}) already added into queue, don't add it into queue`);
                    this.description = `Node(${x + 1}, ${y}) already added into queue, don't add it into queue`;
                }
                else if (this.grid[y][x + 1].type === NODE_TYPE.WALL_NODE) {
                    console.log(`Node(${x + 1}, ${y}) is a wall node, don't add it into queue`);
                    this.description = `Node(${x + 1}, ${y}) is a wall node, don't add it into queue`;
                }
                else if (this.grid[y][x + 1].type === NODE_TYPE.SOURCE_NODE) {
                    console.log(`Node(${x + 1}, ${y}) is a source node, don't add it into queue`);
                    this.description = `Node(${x + 1}, ${y}) is a source node, don't add it into queue`;
                }
                else if (this.grid[y][x + 1].type === NODE_TYPE.VISITED_NODE) {
                    console.log(`Node(${x + 1}, ${y}) is already visited, don't add it into queue`);
                    this.description = `Node(${x + 1}, ${y}) is already visited, don't add it into queue`;
                }
                this.currentStep = STEPPER.CONSIDER_TOP;
            } break;

            case STEPPER.CONSIDER_TOP:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;

                if (y - 1 >= 0) {
                    if (this.tooltip !== this.grid[y - 1][x].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[y - 1][x].tooltip;
                        this.tooltip.toggle();
                    }
                }

                if (y - 1 >= 0 && !this.visited[y - 1][x] && !this.addedIntoQueue[y - 1][x] && this.grid[y - 1][x].validNode()) {
                    this.queue.enqueue(this.grid[y - 1][x]);
                    this.addedIntoQueue[y - 1][x] = 1;
                    this.grid[y - 1][x].addColorIfEmptyNode(NODE_TYPE.FUTURE_NODE);
                    this.grid[y - 1][x].parent_x = x;
                    this.grid[y - 1][x].parent_y = y;
                    this.addQueueElement(x, y - 1);

                    console.log(`Add Node(${x}, ${y - 1}) into the queue`);
                    console.log(`Make Node(${x}, ${y}) as the parent of Node(${x}, ${y - 1})`);
                    this.description = `Add Node(${x}, ${y - 1}) into the queue and ` +
                        `make Node(${x}, ${y}) as the parent of Node(${x}, ${y - 1})`;
                }
                else if (y - 1 < 0) {
                    console.log(`There is no top neighbor`);
                    this.description = `There is no top neighbor`;
                }
                else if (this.addedIntoQueue[y - 1][x]) {
                    console.log(`Node(${x}, ${y - 1}) already added into queue, don't add it into queue`);
                    this.description = `Node(${x}, ${y - 1}) already added into queue, don't add it into queue`;
                }
                else if (this.grid[y - 1][x].type === NODE_TYPE.WALL_NODE) {
                    console.log(`Node(${x}, ${y - 1}) is a wall node, don't add it into queue`);
                    this.description = `Node(${x}, ${y - 1}) is a wall node, don't add it into queue`;
                }
                else if (this.grid[y - 1][x].type === NODE_TYPE.SOURCE_NODE) {
                    console.log(`Node(${x}, ${y - 1}) is a source node, don't add it into queue`);
                    this.description = `Node(${x}, ${y - 1}) is a source node, don't add it into queue`;
                }
                else if (this.grid[y - 1][x].type === NODE_TYPE.VISITED_NODE) {
                    console.log(`Node(${x},${y - 1}) is already visited, don't add it into queue`);
                    this.description = `Node(${x}, ${y - 1}) is already visited, don't add it into queue`;
                }
                this.currentStep = STEPPER.GET_ELEM;
            } break;
            case STEPPER.CHECK_HAVE_PATH:
            {
                if (this.currentNode.type === NODE_TYPE.DESTINATION_NODE) {
                    this.currentStep = STEPPER.MAKE_PATH;
                    this.step();
                }
                else {
                    console.log('There is no path');
                    this.tooltip.toggle();
                    this.description = 'There is no path';
                    this.currentStep = STEPPER.END;
                }
            } break;
            case STEPPER.MAKE_PATH:
            {
                let node = this.currentNode;
                if (node.parent_x !== null && node.parent_y !== null) {
                    if (this.tooltip !== this.grid[node.parent_y][node.parent_x].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[node.parent_y][node.parent_x].tooltip;
                        this.tooltip.toggle();
                    }

                    this.currentNode = this.grid[node.parent_y][node.parent_x];
                    this.setCurrentNodeElement(node.parent_x, node.parent_y);
                    console.log(
                        `The parent of Node(${node.x}, ${node.y}) is Node(${node.parent_x}, ${node.parent_y}), ` +
                        `mark Node(${node.parent_x}, ${node.parent_y}) as the path`
                    );
                    this.description = 
                        `The parent of Node(${node.x}, ${node.y}) is Node(${node.parent_x}, ${node.parent_y}), ` +
                        `mark Node(${node.parent_x}, ${node.parent_y}) as the path`;
                    
                    if (this.currentNode.type !== NODE_TYPE.SOURCE_NODE) {
                        this.currentNode.changeType(NODE_TYPE.PATH_NODE);
                    }
                }
                else {
                    console.log('Path is carved');
                    this.tooltip.toggle();
                    this.description = 'Path is carved';
                    this.currentStep = STEPPER.END;
                }
            } break;
            case STEPPER.END:
            {

            } break;
        }
    }

    removeNthElement(n) {
        this.queueElem.removeChild(this.queueElem.childNodes[n]);
    }

    addQueueElement(x, y) {
        let div = document.createElement('div');
        div.textContent = `Node(${x}, ${y})`;
        this.queueElem.appendChild(div);
    }

    addVisitedElement(x, y) {
        let div = document.createElement('div');
        div.textContent = `Node(${x}, ${y})`;
        this.visitedElem.appendChild(div);
    }

    setCurrentNodeElement(x, y) {
        this.currentNodeElem.textContent = `Node(${x}, ${y})`;
    }

    clearElement() {
        while (this.queueElem.firstChild) {
            this.queueElem.removeChild(this.queueElem.lastChild);
        }
        while (this.visitedElem.firstChild) {
            this.visitedElem.removeChild(this.visitedElem.lastChild);
        }
        this.currentNodeElem.textContent = '';
        document.getElementById('description').textContent = '';
    }
}

class AStarStepper {
    constructor(width, height, grid) {
        this.currentStep = STEPPER.INIT;
        this.openList = [];
        this.closedList = [];
        this.visited = [];
        this.addedIntoOpenList = [];
        this.currentNode = null;
        this.grid = grid;
        this.width = width;
        this.height = height;
        this.description = null;
        this.tooltip = null;
        this.openListElem = document.getElementById('open-list').querySelector('.flex-container');
        this.closedListElem = document.getElementById('closed-list').querySelector('.flex-container');
        this.currentNodeElem = document.getElementById('current-node');

        for (let i = 0; i < height; i++) {
            this.visited[i] = new Array(width).fill(0);
            this.addedIntoOpenList[i] = new Array(width).fill(0);
        }

        this.cleanMaze();
        this.clearElement();
        ellerAlgorithmMaze(this.width, this.height, this.grid);
    }

    cleanMaze() {
        clearMaze(this.width, this.height, this.grid)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x].removeText();
                this.grid[y][x].tooltip.hide();
            }
        }
        for (let y = 1; y < this.height; y += 2) {
            for (let x = 1; x < this.width; x += 2) {
                if (this.grid[y][x].type === NODE_TYPE.EMPTY_NODE) {
                    this.grid[y][x].changeType(NODE_TYPE.WALL_NODE);
                }
            }
        }
    }

    step() {
        switch (this.currentStep) {
            case STEPPER.INIT:
            {
                this.openList.push(this.grid[0][0]);
                this.grid[0][0].parent_x = null;
                this.grid[0][0].parent_y = null;
                console.log(`Add Node(0, 0) into the open list`);
                this.addOpenListElement(0, 0);
                this.description = `Add Node(0, 0) into open list`;
                this.tooltip = this.grid[0][0].tooltip;
                this.tooltip.toggle();

                this.currentStep = STEPPER.GET_ELEM;
            } break;
            case STEPPER.GET_ELEM:
            {
                if (this.openList.length > 0) {
                    this.currentNode = this.openList[0];
                    let pos = 0;
                    for (let i = 1; i < this.openList.length; i++) {
                        let checkNode = this.openList[i];
                        // In case of tie, get the node with the farthest travelling distance
                        if (checkNode.f < this.currentNode.f || (checkNode.f === this.currentNode.f && checkNode.g > this.currentNode.g)) {
                            this.currentNode = checkNode;
                            pos = i;
                        }
                    }

                    let x = this.currentNode.x;
                    let y = this.currentNode.y;
                    this.openList.splice(pos, 1);
                    this.removeNthElement(pos);
                    this.setCurrentNodeElement(x, y);
                    console.log(`Get the cheapest f function from the open list that is Node(${x}, ${y}) and remove that node from open list`);
                    this.description = `Get the cheapest f function from the open list that is Node(${x}, ${y}) and remove that node from open list`;


                    // If the node empty node, change the color to something different
                    this.currentNode.addColorIfEmptyNode(NODE_TYPE.HIGLIGHT_NODE);

                    if (this.tooltip !== this.currentNode.tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.currentNode.tooltip;
                        this.tooltip.toggle();
                    }
                    

                    this.currentStep = STEPPER.CHECK_VISIT;
                }
                else {
                    this.currentStep = STEPPER.MAKE_PATH;
                    this.step();
                }
            } break;
            case STEPPER.CHECK_VISIT:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;
                if (this.visited[y][x]) {
                    console.log(`Node(${x}, ${y}) is already visited!`);
                    this.description = `Node(${x}, ${y}) is already visited!`;
                    this.currentStep = STEPPER.GET_ELEM;
                }
                else {
                    this.currentStep = STEPPER.CHECK_NODE;
                    this.step();
                }
            } break;
            case STEPPER.CHECK_NODE:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;
                this.closedList.push(this.currentNode);
                this.addClosedListElement(x, y);
                this.description = `Add current node to closed list that is Node(${x}, ${y})`;

                if (this.currentNode.type === NODE_TYPE.EMPTY_NODE) {
                    // console.log(`Mark Node(${x}, ${y}) as visited`);
                    // this.description += `Mark Node(${x}, ${y}) as visited`;
                    this.currentNode.changeType(NODE_TYPE.VISITED_NODE);
                    this.visited[y][x] = 1;
                    this.currentStep = STEPPER.CONSIDER_LEFT;
                }
                else if (this.currentNode.type === NODE_TYPE.DESTINATION_NODE) {
                    console.log(`Found Node(${x}, ${y}) as destination`);
                    this.description += ` and found Node(${x}, ${y}) as destination`;
                    this.currentStep = STEPPER.MAKE_PATH;
                }
                else {
                    // this happen when current node is source node
                    this.currentStep = STEPPER.CONSIDER_LEFT;
                    this.step();
                }
            } break;
            case STEPPER.CONSIDER_LEFT:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;

                if (x - 1 >= 0) {
                    if (this.tooltip !== this.grid[y][x - 1].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[y][x - 1].tooltip;
                        this.tooltip.toggle();
                    }
                }

                if (x - 1 >= 0 && !this.visited[y][x - 1] && !this.addedIntoOpenList[y][x - 1] && this.grid[y][x - 1].validNode()) {
                    this.openList.push(this.grid[y][x - 1]);
                    this.addedIntoOpenList[y][x - 1] = 1;
                    this.addOpenListElement(x - 1, y);
                    // NOTE(Vendryan): Give color indicating as the node to be considered in the future
                    this.grid[y][x - 1].addColorIfEmptyNode(NODE_TYPE.FUTURE_NODE);
                    this.grid[y][x - 1].parent_x = x;
                    this.grid[y][x - 1].parent_y = y;

                    let node = this.grid[y][x - 1];
                    node.g = this.currentNode.g + 1;
                    node.h = Math.abs(4 - node.x) + Math.abs(4 - node.y);
                    node.f = node.g + node.h;
                    node.addText(node.f.toString());

                    console.log(`Add Node(${x - 1}, ${y}) into the open list`);
                    console.log(`Make Node(${x}, ${y}) as the parent of Node(${x - 1}, ${y})`);
                    console.log(`Compute the f function for the Node(${x - 1}, ${y})`);
                    this.description = `Add Node(${x - 1}, ${y}) into the open list and ` +
                        `make Node(${x},${y}) as the parent of Node(${x - 1}, ${y}) and ` +
                        `compute the f function for the Node(${x - 1}, ${y})`;
                }
                else if (x - 1 < 0) {
                    console.log(`There is no left neighbour`);
                    this.description = `There is no left neighbor`;
                }
                else if (this.addedIntoOpenList[y][x - 1]) {
                    console.log(`Node(${x - 1}, ${y}) already added into open list, don't add it again`);
                    this.description = `Node(${x - 1}, ${y}) already added into open list, don't add it again`;
                }
                else if (this.grid[y][x - 1].type === NODE_TYPE.WALL_NODE) {
                    console.log(`Node(${x - 1}, ${y}) is a wall node, don't add it into open list`);
                    this.description = `Node(${x - 1}, ${y}) is a wall node, don't add it into open list`;
                }
                else if (this.grid[y][x - 1].type === NODE_TYPE.SOURCE_NODE) {
                    console.log(`Node(${x - 1}, ${y}) is a source node, don't add it into open list`);
                    this.description = `Node(${x - 1}, ${y}) is a source node, don't add it into open list`;
                }
                else if (this.grid[y][x - 1].type === NODE_TYPE.VISITED_NODE) {
                    console.log(`Node(${x - 1}, ${y}) is already visited, don't add it into open list`);
                    this.description = `Node(${x - 1}, ${y}) is already visited, don't add it into open list`;
                }
                this.currentStep = STEPPER.CONSIDER_DOWN;
            } break;

            case STEPPER.CONSIDER_DOWN:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;

                if (y + 1 < this.height) {
                    if (this.tooltip !== this.grid[y + 1][x].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[y + 1][x].tooltip;
                        this.tooltip.toggle();
                    }
                }

                if (y + 1 < this.height && !this.visited[y + 1][x] && !this.addedIntoOpenList[y + 1][x] && this.grid[y + 1][x].validNode()) {
                    this.openList.push(this.grid[y + 1][x]);
                    this.addedIntoOpenList[y + 1][x] = 1;
                    this.addOpenListElement(x, y + 1);

                    this.grid[y + 1][x].addColorIfEmptyNode(NODE_TYPE.FUTURE_NODE);
                    this.grid[y + 1][x].parent_x = x;
                    this.grid[y + 1][x].parent_y = y;

                    let node = this.grid[y + 1][x];
                    node.g = this.currentNode.g + 1;
                    node.h = Math.abs(4 - node.x) + Math.abs(4 - node.y);
                    node.f = node.g + node.h;
                    node.addText(node.f.toString());

                    console.log(`Add Node(${x}, ${y + 1}) into the queue`);
                    console.log(`Make Node(${x}, ${y}) as the parent of Node(${x},${y + 1})`);
                    console.log(`Compute the f function for the Node(${x}, ${y + 1})`);
                    this.description = `Add Node(${x}, ${y + 1}) into the open list and ` +
                        `make Node(${x}, ${y}) as the parent of Node(${x}, ${y + 1}) and ` +
                        `compute the f function for the Node(${x}, ${y + 1})`;
                }
                else if (y + 1 >= this.height) {
                    console.log(`There is no bottom neighbor`);
                    this.description = `There is no bottom neighbor`;
                }
                else if (this.addedIntoOpenList[y + 1][x]) {
                    console.log(`Node(${x}, ${y + 1}) already added into open list, don't add it again`);
                    this.description = `Node(${x}, ${y + 1}) already added into open list, don't add it again`;
                }
                else if (this.grid[y + 1][x].type === NODE_TYPE.WALL_NODE) {
                    console.log(`Node(${x}, ${y + 1}) is a wall node, don't add it into open list`);
                    this.description = `Node(${x}, ${y + 1}) is a wall node, don't add it into open list`;
                }
                else if (this.grid[y + 1][x].type === NODE_TYPE.SOURCE_NODE) {
                    console.log(`Node(${x}, ${y + 1}) is a source node, don't add it into open list`);
                    this.description = `Node(${x}, ${y + 1}) is a source node, don't add it into open list`;
                }
                else if (this.grid[y + 1][x].type === NODE_TYPE.VISITED_NODE) {
                    console.log(`Node(${x}, ${y + 1}) is already visited, don't add it into open list`);
                    this.description = `Node(${x}, ${y + 1}) is already visited, don't add it into open list`;
                }
                this.currentStep = STEPPER.CONSIDER_RIGHT;
            } break;

            case STEPPER.CONSIDER_RIGHT:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;

                if (x + 1 < this.width) {
                    if (this.tooltip !== this.grid[y][x + 1].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[y][x + 1].tooltip;
                        this.tooltip.toggle();
                    }
                }

                if (x + 1 < this.width && !this.visited[y][x + 1] && !this.addedIntoOpenList[y][x + 1] && this.grid[y][x + 1].validNode()) {
                    this.openList.push(this.grid[y][x + 1]);
                    this.addedIntoOpenList[y][x + 1] = 1;
                    this.addOpenListElement(x + 1, y);

                    this.grid[y][x + 1].addColorIfEmptyNode(NODE_TYPE.FUTURE_NODE);
                    this.grid[y][x + 1].parent_x = x;
                    this.grid[y][x + 1].parent_y = y;

                    let node = this.grid[y][x + 1];
                    node.g = this.currentNode.g + 1;
                    node.h = Math.abs(4 - node.x) + Math.abs(4 - node.y);
                    node.f = node.g + node.h;
                    node.addText(node.f.toString());

                    console.log(`Add Node(${x + 1}, ${y}) into the queue`);
                    console.log(`Make Node(${x}, ${y}) as the parent of Node(${x + 1},${y})`);
                    console.log(`Compute the f function for the Node(${x + 1}, ${y})`);
                    this.description = `Add Node(${x + 1}, ${y}) into the open list and ` +
                        `make Node(${x}, ${y}) as the parent of Node(${x + 1}, ${y}) and ` +
                        `compute the f function for the Node(${x + 1}, ${y})`;
                }
                else if (x + 1 >= this.width) {
                    console.log(`There is no right neighbor`);
                    this.description = `There is no right neighbor`;
                }
                else if (this.addedIntoOpenList[y][x + 1]) {
                    console.log(`Node(${x + 1}, ${y}) already added into open list, don't add it again`);
                    this.description = `Node(${x + 1}, ${y}) already added into open list, don't add it again`;
                }
                else if (this.grid[y][x + 1].type === NODE_TYPE.WALL_NODE) {
                    console.log(`Node(${x + 1}, ${y}) is a wall node, don't add it into open list`);
                    this.description = `Node(${x + 1}, ${y}) is a wall node, don't add it into open list`;
                }
                else if (this.grid[y][x + 1].type === NODE_TYPE.SOURCE_NODE) {
                    console.log(`Node(${x + 1}, ${y}) is a source node, don't add it into open list`);
                    this.description = `Node(${x + 1}, ${y}) is a source node, don't add it into open list`;
                }
                else if (this.grid[y][x + 1].type === NODE_TYPE.VISITED_NODE) {
                    console.log(`Node(${x + 1}, ${y}) is already visited, don't add it into open list`);
                    this.description = `Node(${x + 1}, ${y}) is already visited, don't add it into open list`;
                }
                this.currentStep = STEPPER.CONSIDER_TOP;
            } break;

            case STEPPER.CONSIDER_TOP:
            {
                let x = this.currentNode.x;
                let y = this.currentNode.y;

                if (y - 1 >= 0) {
                    if (this.tooltip !== this.grid[y - 1][x].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[y - 1][x].tooltip;
                        this.tooltip.toggle();
                    }
                }

                if (y - 1 >= 0 && !this.visited[y - 1][x] && !this.addedIntoOpenList[y - 1][x] && this.grid[y - 1][x].validNode()) {
                    this.openList.push(this.grid[y - 1][x]);
                    this.addedIntoOpenList[y - 1][x] = 1;
                    this.addOpenListElement(x, y - 1);

                    this.grid[y - 1][x].addColorIfEmptyNode(NODE_TYPE.FUTURE_NODE);
                    this.grid[y - 1][x].parent_x = x;
                    this.grid[y - 1][x].parent_y = y;

                    let node = this.grid[y - 1][x];
                    node.g = this.currentNode.g + 1;
                    node.h = Math.abs(4 - node.x) + Math.abs(4 - node.y);
                    node.f = node.g + node.h;
                    node.addText(node.f.toString());

                    console.log(`Add Node(${x}, ${y - 1}) into the queue`);
                    console.log(`Make Node(${x}, ${y}) as the parent of Node(${x}, ${y - 1})`);
                    console.log(`Compute the f function for the Node(${x}, ${y - 1})`);
                    this.description = `Add Node(${x}, ${y - 1}) into the open list and ` +
                        `make Node(${x}, ${y}) as the parent of Node(${x}, ${y - 1}) and ` + 
                        `compute the f function for the Node(${x}, ${y - 1})`;
                }
                else if (y - 1 < 0) {
                    console.log(`There is no top neighbor`);
                    this.description = `There is no top neighbor`;
                }
                else if (this.addedIntoOpenList[y - 1][x]) {
                    console.log(`Node(${x}, ${y - 1}) already added into open list, don't add it again`);
                    this.description = `Node(${x}, ${y - 1}) already added into open list, don't add it again`;
                }
                else if (this.grid[y - 1][x].type === NODE_TYPE.WALL_NODE) {
                    console.log(`Node(${x}, ${y - 1}) is a wall node, don't add it into open list`);
                    this.description = `Node(${x}, ${y - 1}) is a wall node, don't add it into open list`;
                }
                else if (this.grid[y - 1][x].type === NODE_TYPE.SOURCE_NODE) {
                    console.log(`Node(${x}, ${y - 1}) is a source node, don't add it into open list`);
                    this.description = `Node(${x}, ${y - 1}) is a source node, don't add it into open list`;
                }
                else if (this.grid[y - 1][x].type === NODE_TYPE.VISITED_NODE) {
                    console.log(`Node(${x},${y - 1}) is already visited, don't add it into open list`);
                    this.description = `Node(${x}, ${y - 1}) is already visited, don't add it into open list`;
                }
                this.currentStep = STEPPER.GET_ELEM;
            } break;
            case STEPPER.CHECK_HAVE_PATH:
            {
                if (this.currentNode.type === NODE_TYPE.DESTINATION_NODE) {
                    this.currentStep = STEPPER.MAKE_PATH;
                    this.step();
                }
                else {
                    console.log('There is no path');
                    this.tooltip.toggle();
                    this.description = 'There is no path';
                    this.currentStep = STEPPER.END;
                }
            } break;
            case STEPPER.MAKE_PATH:
            {
                let node = this.currentNode;
                if (node.parent_x !== null && node.parent_y !== null) {
                    if (this.tooltip !== this.grid[node.parent_y][node.parent_x].tooltip) {
                        this.tooltip.toggle();
                        this.tooltip = this.grid[node.parent_y][node.parent_x].tooltip;
                        this.tooltip.toggle();
                    }

                    this.currentNode = this.grid[node.parent_y][node.parent_x];
                    this.setCurrentNodeElement(node.parent_x, node.parent_y);
                    console.log(
                        `The parent of Node(${node.x}, ${node.y}) is Node(${node.parent_x}, ${node.parent_y}), ` +
                        `mark Node(${node.parent_x}, ${node.parent_y}) as the path`
                    );
                    this.description = 
                        `The parent of Node(${node.x}, ${node.y}) is Node(${node.parent_x}, ${node.parent_y}), ` +
                        `mark Node(${node.parent_x}, ${node.parent_y}) as the path`;
                    
                    if (this.currentNode.type !== NODE_TYPE.SOURCE_NODE) {
                        this.currentNode.changeType(NODE_TYPE.PATH_NODE);
                    }
                }
                else {
                    console.log('Path is carved');
                    this.tooltip.toggle();
                    this.description = 'Path is carved';
                    this.currentStep = STEPPER.END;
                }
            } break;
            case STEPPER.END:
            {

            } break;
        }
    }

    removeNthElement(n) {
        this.openListElem.removeChild(this.openListElem.childNodes[n]);
    }

    addOpenListElement(x, y) {
        let div = document.createElement('div');
        div.textContent = `Node(${x}, ${y})`;
        this.openListElem.appendChild(div);
    }

    addClosedListElement(x, y) {
        let div = document.createElement('div');
        div.textContent = `Node(${x}, ${y})`;
        this.closedListElem.appendChild(div);
    }

    setCurrentNodeElement(x, y) {
        this.currentNodeElem.textContent = `Node(${x}, ${y})`;
    }

    clearElement() {
        while (this.openListElem.firstChild) {
            this.openListElem.removeChild(this.openListElem.lastChild);
        }
        while (this.closedListElem.firstChild) {
            this.closedListElem.removeChild(this.closedListElem.lastChild);
        }
        this.currentNodeElem.textContent = '';
        document.getElementById('description').textContent = '';
    }
}

function initStepper(algorithm) {
    switch (algorithm) {
        case 'dfs':
        {
            stepper = new DFSStepper(STEPPER_VISUALIZER_WIDTH, STEPPER_VISUALIZER_HEIGHT, stepperVisualizerGrid);
        } break;
        case 'bfs':
        {
            stepper = new BFSStepper(STEPPER_VISUALIZER_WIDTH, STEPPER_VISUALIZER_HEIGHT, stepperVisualizerGrid);
        } break;
        case 'a*':
        {
            stepper = new AStarStepper(STEPPER_VISUALIZER_WIDTH, STEPPER_VISUALIZER_HEIGHT, stepperVisualizerGrid);
        } break;
    }
}

document.addEventListener('DOMContentLoaded', function(event) {
    // Mini visualizer grid
    let visualizerGridStepper = document.querySelector('.visualizer-grid.visualizer-grid--stepper');
    for (let y = 0; y < STEPPER_VISUALIZER_HEIGHT; y++) {
        let row = [];
        let rowElem = document.createElement('div');
        rowElem.classList.add('visualizer-grid__row');
        rowElem.style.gridTemplateColumns = `repeat(${STEPPER_VISUALIZER_WIDTH}, 1fr)`;

        for (let x = 0; x < STEPPER_VISUALIZER_WIDTH; ++x) {
            let node = document.createElement('div');
            let text = document.createElement('div');
            // text.textContent = '1';
            // text.classList.add('visualizer-grid__text');
            // node.appendChild(text);

            node.classList.add(`${x}-${y}`, 'visualizer-grid__node', 'visualizer-grid__node--border-rb');
            node.dataset.x = x;
            node.dataset.y = y;
            node.dataset.bsToggle = 'tooltip';
            node.dataset.bsTitle = `Node(${x}, ${y})`;

            let tooltip = new bootstrap.Tooltip(node);

            rowElem.appendChild(node);

            row.push(new Node(x, y, NODE_TYPE.EMPTY_NODE, node));
            row[x].tooltip = tooltip;
        }

        visualizerGridStepper.appendChild(rowElem);
        stepperVisualizerGrid.push(row);
    }
    stepperVisualizerGrid[0][0].changeType(NODE_TYPE.SOURCE_NODE);
    stepperVisualizerGrid[4][4].changeType(NODE_TYPE.DESTINATION_NODE);
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

    // Stepper
    document.getElementById('stepper').addEventListener('click', function(event) {
        if (stepper) {
            stepper.step();
            document.getElementById('description').textContent = stepper.description;
        }
    });

    // Reset button
    document.getElementById('reset').addEventListener('click', function(event) {
        document.getElementById('description').textContent = '';
        initStepper(algorithm);
    })

    initStepper(algorithm);
});
