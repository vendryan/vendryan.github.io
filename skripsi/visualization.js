document.addEventListener('DOMContentLoaded', function(evt) {
    let visualizerGridElem = document.querySelector('.visualizer-grid.visualizer-grid--normal');

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
        clearMaze(VISUALIZER_GRID_WIDTH, VISUALIZER_GRID_HEIGHT, visualizerGrid);
    })

    // Generate maze
    document.getElementById('generate-maze').addEventListener('click', async function(event) {
        clearMaze(VISUALIZER_GRID_WIDTH, VISUALIZER_GRID_HEIGHT, visualizerGrid);
        toggleVisualizationButtonState();
        switch (boardState.mazeAlgorithm) {
            case 'recursive-division':
            {
                await recursiveDivisionMaze(0, VISUALIZER_GRID_WIDTH - 1, 0, VISUALIZER_GRID_HEIGHT - 1, visualizerGrid);
            } break;
            case 'recursive-backtracking':
            {
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