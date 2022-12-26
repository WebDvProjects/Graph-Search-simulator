import { getSpeed } from "./ui-settings.js";

const grid = document.querySelector(".grid");
const rowsInput = document.querySelector("#rows");
const colsInput = document.querySelector("#cols");
const submitBtn = document.querySelector(".start-btn");
const stopBtn = document.querySelector(".stop-btn");
const currentAlgoName = document.querySelector("#algorithm-name");

let drawing = false;
// the maximum delay (milliseconds) between marking nodes on the grid
let maxDelay = 100;

// grid control buttons
const clearBtn = document.querySelector("#clear");
const clearWallsBtn = document.querySelector("#erase-walls");
const toggleDrawing = document.querySelector("#toggle-walls");

/* EVENT LISTENERS */
// toggle drawing walls
toggleDrawing.addEventListener("click", () => {
  toggleDrawing.classList.toggle("active");
});

// clears only walls
clearWallsBtn.addEventListener("click", () => {
  GridSetup.clearWalls();
});

// clears the whole grid
clearBtn.addEventListener("click", () => {
  GridSetup.clearWalls();
  GridSetup.clearGrid();

  // clear start and end inputs
  InputControl.clearInputs();
});

// set the title of the current active algorithm
document.querySelectorAll("fieldset > label > input").forEach((input) => {
  input.addEventListener("click", () => {
    InputControl.setAlgorithmTitle(input.id);
  });
});

stopBtn.addEventListener("click", () => {
  Search.clearTimeOuts();
});

document.querySelector("body").addEventListener("mouseup", function () {
  drawing = false;
});

document.querySelector("body").addEventListener("touchend", function () {
  drawing = false;
});

let cols = rowsInput.value;
let rows = colsInput.value;

const InputControl = (() => {
  const startCol = document.querySelector("#start-col");
  const startRow = document.querySelector("#start-row");
  const targetCol = document.querySelector("#target-col");
  const targetRow = document.querySelector("#target-row");

  // set algorithm title
  function setAlgorithmTitle(algo_id) {
    switch (algo_id) {
      case "bfs":
        currentAlgoName.textContent = "Breadth First Search";
        break;
      case "dfs":
        currentAlgoName.textContent = "Depth First Search";
        break;
      case "dijkstra":
        currentAlgoName.textContent = "Dijkstra's Algorithm";
        break;
      case "a-star":
        currentAlgoName.textContent = "A* Search";
        break;
      case "idps":
        currentAlgoName.textContent = "Iterative Deepening Search";
        break;
      case "iteration":
        currentAlgoName.textContent = "Iteration";
        break;
    }
  }

  for (const input of [rowsInput, colsInput]) {
    input.addEventListener("input", () => {
      // update rows and cols values
      rows = rowsInput.value;
      cols = colsInput.value;

      // real-time validation
      if (
        !customValidation(
          input,
          `${input.name} must be a number between ${input.min} and ${input.max}`
        )
      ) {
        return;
      }

      // set max value for start and target inputs
      setStartTargetMax(rows, cols);

      // update grid
      GridSetup.updateGrid(cols, rows);
    });
  }

  for (const input of [
    rowsInput,
    colsInput,
    startCol,
    startRow,
    targetCol,
    targetRow,
  ]) {
    input.addEventListener("input", () => {
      // real-time validation
      if (
        !customValidation(
          input,
          `${input.name} must be a number between ${input.min} and ${input.max}`
        )
      ) {
        return;
      }
    });
  }

  submitBtn.onclick = function (e) {
    e.preventDefault();

    // if there is no start or end node selected
    if (document.querySelectorAll(":is(.start, .target)").length < 2) {
      // display error message
      submitBtn.classList.add("start-error");

      // set a delay to remove the error message
      setTimeout(() => {
        submitBtn.classList.remove("start-error");
      }, 2000);

      return;
    } else {
      submitBtn.classList.remove("start-error");
    }

    // clear grid
    GridSetup.clearGrid();

    // clear results
    Search.clearResults();

    // disable drawing walls
    toggleDrawing.classList.remove("active");
    disableDrawingControlBtns();

    const algo = document.querySelector('input[name="algorithm"]:checked').id;

    // set algorithm title
    // setAlgorithmTitle(algo);

    // perform search function
    Search.search(
      algo,
      [startRow.value, startCol.value],
      [targetRow.value, targetCol.value],
      getSpeed()
    );
  };
  // clear start and target position inputs
  const clearInputs = () => {
    for (const input of [startCol, startRow, targetCol, targetRow]) {
      input.value = "";
    }
  };

  const customValidation = (input, msg) => {
    if (
      !!!input.value ||
      input.validity.rangeUnderflow ||
      input.validity.rangeOverflow ||
      isNaN(input.value) ||
      input.validity.badInput
    ) {
      input.setCustomValidity(msg);
      input.reportValidity();
      return false;
    } else {
      input.setCustomValidity("");
      return true;
    }
  };

  const setStartTargetMax = (rows, cols) => {
    // console.log(rows, cols);
    startCol.max = cols - 1;
    startRow.max = rows - 1;
    targetCol.max = cols - 1;
    targetRow.max = rows - 1;
  };

  /* 
Set the position of the start and target nodes in the form
from clicking on the grid
*/
  const setPositions = function (type) {
    const selected = document.querySelectorAll(`.${type}`);
    if (selected.length > 0 && selected.length < 2) {
      const [row, col] = [...selected].map((cell) => [
        cell.getAttribute("data-row"),
        cell.getAttribute("data-col"),
      ])[0];
      if (type === "start") {
        startRow.value = row;
        startCol.value = col;
        // remove validation error
        startRow.setCustomValidity("");
        startCol.setCustomValidity("");
      } else {
        targetRow.value = row;
        targetCol.value = col;
        // remove validation error
        targetRow.setCustomValidity("");
        targetCol.setCustomValidity("");
      }
    } else {
      if (type === "start") {
        startRow.value = "";
        startCol.value = "";
      } else {
        targetRow.value = "";
        targetCol.value = "";
      }
    }
  };

  return { setStartTargetMax, setPositions, setAlgorithmTitle, clearInputs };
})();

const GridSetup = (function () {
  const createGrid = (width, height) => {
    // clear grid
    grid.innerHTML = "";
    for (let i = 0; i < width * height; i++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      // Record the position of each cell
      const row = Math.floor(i / width);
      const col = i % width;
      cell.setAttribute("data-row", row);
      cell.setAttribute("data-col", col);

      // set custom tooltip value
      cell.style.setProperty("--row-pos", row);
      cell.style.setProperty("--col-pos", col);

      /* 
      An event listener that allows users to select the start and end nodes by clicking on the grid
      The first click will set the cell as start and the second click will set the cell as target
      clicking the respective node again will unselect it
      */
      cell.addEventListener("click", (e) => {
        // if we are drawing walls then don't allow to select start and end nodes
        if (
          toggleDrawing.classList.contains("active") ||
          cell.classList.contains("wall")
        )
          return;

        // set cell as start when touch
        // can unselect by clicking again
        const selectedStarts = document.querySelectorAll(".start");

        // check if there is already a start selected and if the cell is not the same as the selected start
        if (
          (selectedStarts.length > 0 &&
            !!![...selectedStarts].find((start) => cell === start)) ||
          cell.classList.contains("target")
        ) {
          const selectedTargets = document.querySelectorAll(".target");
          // check if there is already a target selected and if the cell is not the same as the selected target
          if (
            (selectedTargets.length > 0 &&
              !!![...selectedTargets].find((target) => cell === target)) ||
            cell.classList.contains("start")
          ) {
            return;
          }
          // toggle target class
          cell.classList.toggle("target");
          InputControl.setPositions("target");

          return;
        }
        cell.classList.toggle("start");
        InputControl.setPositions("start");
      });

      /* 
      An event listener that allows mobile users to select the start and end nodes by tapping
      The first click will set the cell as start and the second click will set the cell as target
      clicking the respective node again will unselect it
      */
      cell.addEventListener("touchend", (e) => {
        // if we are drawing walls then don't allow to select start and end nodes
        if (
          toggleDrawing.classList.contains("active") ||
          cell.classList.contains("wall")
        )
          return;

        // set cell as start when touch
        // can unselect by clicking again
        const selectedStarts = document.querySelectorAll(".start");

        // check if there is already a start selected and if the cell is not the same as the selected start
        if (
          (selectedStarts.length > 0 &&
            !!![...selectedStarts].find((start) => cell === start)) ||
          cell.classList.contains("target")
        ) {
          const selectedTargets = document.querySelectorAll(".target");
          // check if there is already a target selected and if the cell is not the same as the selected target
          if (
            (selectedTargets.length > 0 &&
              !!![...selectedTargets].find((target) => cell === target)) ||
            cell.classList.contains("start")
          ) {
            return;
          }
          // toggle target class
          cell.classList.toggle("target");
          InputControl.setPositions("target");

          return;
        }
        cell.classList.toggle("start");
        InputControl.setPositions("start");
      });

      // add an event listener to allow users to draw walls
      cell.addEventListener("mousedown", (e) => {
        // don't draw walls on start and target nodes
        if (
          cell.classList.contains("start") ||
          cell.classList.contains("target")
        )
          return;

        if (toggleDrawing.classList.contains("active")) {
          // toggle wall class
          cell.classList.toggle("wall");
          drawing = true;
        }
      });

      // When user is holding the mouse then allow drawing
      cell.addEventListener("mouseenter", (e) => {
        // don't draw walls on start and target nodes
        if (
          cell.classList.contains("start") ||
          cell.classList.contains("target")
        )
          return;
        if (toggleDrawing.classList.contains("active") && drawing) {
          // toggle wall class
          cell.classList.toggle("wall");
        }
      });

      // Event to allow users to draw walls on mobile browser
      cell.addEventListener("touchstart", (e) => {
        e.preventDefault();
        // don't draw walls on start and target nodes
        if (
          cell.classList.contains("start") ||
          cell.classList.contains("target")
        )
          return;
        if (toggleDrawing.classList.contains("active")) {
          // toggle wall class
          cell.classList.toggle("wall");
          drawing = true;
        }
      });

      // Event to simulate dragging/drawing on mobile browser
      cell.addEventListener("touchmove", (e) => {
        e.preventDefault();
        // don't draw walls on start and target nodes
        if (
          cell.classList.contains("start") ||
          cell.classList.contains("target")
        )
          return;

        // get the touch element and current touch position
        // ! NOTE: the target will always be the point where touchmove started
        const touch = e.targetTouches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        // ! So we have to check what element is at position
        const element = document.elementFromPoint(x, y);

        // if the element is not a cell ignore
        if (!element.classList.contains("cell")) return;

        if (toggleDrawing.classList.contains("active") && drawing) {
          // toggle wall class
          element.classList.toggle("wall");
        }
      });

      // Event to prevent cells from being dragged on the grid
      cell.addEventListener("dragstart", (e) => {
        e.preventDefault();
      });

      grid.appendChild(cell);
    }
  };

  const updateGrid = (width, height) => {
    document.documentElement.style.setProperty("--grid-cols", cols);
    document.documentElement.style.setProperty("--grid-rows", rows);
    // create new grid
    createGrid(width, height);
  };

  const markCell = (row, col, type) => {
    const cell = document.querySelector(
      `.cell[data-row="${row}"][data-col="${col}"]`
    );

    switch (type) {
      case "start":
        cell.classList.add("start");
        break;
      case "target":
        cell.classList.add("target");
        break;
      case "visited":
        cell.classList.add("visited");
        break;
      case "path":
        cell.classList.add("path");
        break;
      case "frontier":
        cell.classList.add("frontier");
      default:
        break;
    }
  };

  const clearGrid = () => {
    // clear any timeouts from serch functions
    Search.clearTimeOuts();

    // enable drawing contol btns
    enableDrawingControlBtns();

    const cells = document.querySelectorAll(".cell");
    for (const cell of cells) {
      cell.classList.remove("start", "target", "visited", "path", "frontier");
    }
  };

  const clearWalls = () => {
    const cells = document.querySelectorAll(".cell");
    for (const cell of cells) {
      cell.classList.remove("wall");
    }
  };

  // check if cell is a wall
  const isWall = (row, col) => {
    const cell = document.querySelector(
      `.cell[data-row="${row}"][data-col="${col}"]`
    );
    return cell.classList.contains("wall");
  };

  return {
    createGrid,
    updateGrid,
    markCell,
    clearGrid,
    clearWalls,
    isWall,
  };
})();

const Search = (() => {
  const resultsContainer = document.querySelector("#results-container");
  const visitsDisplay = document.querySelector("#visits");
  const pathSizeDisplay = document.querySelector("#path-size");
  let delay = 50;
  let timeOutExecutionIds = new Set();

  const search = (algoType, start, end, markSpeed = 0) => {
    // clear any current executions timeouts
    clearTimeOuts();

    // parse str to int
    start = start.map((x) => parseInt(x));
    end = end.map((x) => parseInt(x));

    // delay is inverseely proportional to the speed
    // 100 being the max delay (therefore 0 delay is fastest)
    delay = (1 - markSpeed) * maxDelay;

    switch (algoType) {
      case "bfs":
        bfs(start, end);
        break;
      case "dfs":
        dfs(start, end);
        break;
      case "dijkstra":
        dijkstra(start, end);
        break;
      case "iteration":
        iteration(start, end);
        break;

      case "a-star":
        aStar(start, end);
        break;

      default:
        break;
    }
  };

  function counter(linear = true, countStart = 0) {
    let count = countStart;

    if (linear) {
      // return a function that increments count
      return function () {
        return count++;
      };
    } else {
      // return a function that decrements count
      return function () {
        return count--;
      };
    }
  }

  function clearTimeOuts() {
    for (let id of timeOutExecutionIds) {
      clearTimeout(id);
      timeOutExecutionIds.delete(id);
    }
  }

  function showResults(path, visited) {
    pathSizeDisplay.textContent = path.length;
    visitsDisplay.textContent = visited;
    // resultsContainer.classList.remove("hidden");
  }

  function clearResults() {
    // resultsContainer.classList.add("hidden");
    pathSizeDisplay.textContent = "";
    visitsDisplay.textContent = "";
  }

  const iteration = (start, end) => {
    // mark start and target cells
    GridSetup.markCell(start[0], start[1], "start");
    GridSetup.markCell(end[0], end[1], "target");

    {
      // Reverse Iteration (Just incase but not necessary)
      // //  check if start is ahead or behind target
      // const isStartBehindTarget = (() => {
      //   return (
      //     (start[0] + 1) * (start[1] + 1) - 1 < (end[0] + 1) * (end[1] + 1) - 1
      //   );
      // })();
      // let iterationCounter = null;
      // if (!isStartBehindTarget) {
      //   // if start is ahead of target, swap them
      //   [start, end] = [end, start];
      //   // initiate a reverse counter (counter starts from endIndex)
      //   iterationCounter = counter(false, end[0] * cols + end[1]);
      // } else {
      //   // initiate a linear counter
      //   iterationCounter = counter();
      // }
    }

    // initiate a linear counter
    const iterationCounter = counter();

    const path = [];

    const startIndex = start[0] * cols + start[1];
    const endIndex = end[0] * cols + end[1];
    // Loop through all cells
    for (let i = startIndex; i < rows * cols; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      // check if cell is a wall
      if (GridSetup.isWall(row, col)) {
        break;
      }

      // add to path
      path.push([row, col]);

      // mark visited cells
      timeOutExecutionIds.add(
        setTimeout(() => {
          GridSetup.markCell(row, col, "visited");
        }, delay * iterationCounter())
      );

      if (i === endIndex) {
        // mark path
        timeOutExecutionIds.add(
          setTimeout(() => {
            for (const node of path) {
              GridSetup.markCell(node[0], node[1], "path");
            }
          }, delay * iterationCounter())
        );

        // show results
        showResults(path, path.length);
        return path;
      }
    }

    // path not found
    showResults([], path.length);
    console.log("Path not found");
    return [];
  };

  const bfs = (start, end) => {
    // create a counter object
    const bfsCounter = counter();

    // mark start and target cells
    GridSetup.markCell(start[0], start[1], "start");
    GridSetup.markCell(end[0], end[1], "target");

    // BFS uses a queue
    const queue = [];
    // keep track of visited nodes

    // keep track of frontier nodes (nodes that are in the queue) to avoid adding them multiple times
    // the other way around would be to mark nodes as visited when they are added to the queue
    const frontier = new Set();

    const visited = new Set();
    // keep track of parent nodes
    const parent = new Map();

    // add start node to queue
    queue.push(start);
    frontier.add(start.toString());

    while (queue.length > 0) {
      // get the first node in the queue
      const node = queue.shift();
      frontier.delete(node.toString());

      // check if node has been visited because it might have been added to the queue multiple times
      // also we do not need to re-visit the node in BFS just in case
      if (visited.has(node.toString())) {
        continue;
      }

      // add node to visited
      visited.add(node.toString());
      timeOutExecutionIds.add(
        setTimeout(() => {
          GridSetup.markCell(node[0], node[1], "visited");
        }, bfsCounter() * delay)
      );

      // check if node is end
      if (node[0] === end[0] && node[1] === end[1]) {
        // backtrack to get the path
        const path = [];
        let current = end;
        while (current.toString() !== start.toString()) {
          path.push(current);
          current = parent.get(current.toString());
        }
        path.push(start);
        path.reverse();

        // mark path
        timeOutExecutionIds.add(
          setTimeout(() => {
            for (const node of path) {
              GridSetup.markCell(node[0], node[1], "path");
            }
          }, bfsCounter() * delay)
        );
        // console.log(path, visited);
        showResults(path, visited.size);
        return [path, visited];
      }

      // get neighbors
      const children = neighbours(node);
      // add neighbors to queue
      for (const child of children) {
        if (!visited.has(child.toString()) && !frontier.has(child.toString())) {
          queue.push(child);
          frontier.add(child.toString());
          // add neighbor to parents
          parent.set(child.toString(), node);

          // mark frontier nodes
          timeOutExecutionIds.add(
            setTimeout(() => {
              GridSetup.markCell(child[0], child[1], "frontier");
            }, bfsCounter() * delay)
          );
        }
      }
    }

    // no path found
    console.log("No path found");
    showResults([], visited.size);
    return [];
  };

  const dfs = (start, end) => {
    // create a counter object
    const dfsCounter = counter();

    if (start[0] === end[0] && start[1] === end[1]) {
      console.log("start is end");
      return;
    }

    // mark start and target cells
    GridSetup.markCell(start[0], start[1], "start");
    GridSetup.markCell(end[0], end[1], "target");

    // DFS uses a stack
    const stack = [];

    // frontier nodes (nodes that are in the stack) to avoid adding them multiple times
    const frontier = new Set();

    // keep track of visited nodes
    const visited = new Set();
    // keep track of parent nodes
    const parent = new Map();

    // add start node to stack
    stack.push(start);
    frontier.add(start.toString());

    while (stack.length > 0) {
      // get the last node in the stack
      const node = stack.pop();
      frontier.delete(node.toString());

      // add node to visited
      visited.add(node.toString());
      timeOutExecutionIds.add(
        setTimeout(() => {
          GridSetup.markCell(node[0], node[1], "visited");
        }, dfsCounter() * delay)
      );

      // if node is the target node, we're done
      if (node[0] === end[0] && node[1] === end[1]) {
        // backtrack to get the path
        const path = [];
        let current = end;
        while (current.toString() !== start.toString()) {
          path.push(current);
          current = parent.get(current.toString());
        }
        path.push(start);
        path.reverse();
        // mark path
        timeOutExecutionIds.add(
          setTimeout(() => {
            for (const node of path) {
              GridSetup.markCell(node[0], node[1], "path");
            }
          }, dfsCounter() * delay)
        );

        // console.log(path, visited);
        showResults(path, visited.size);
        return [path, visited];
      }
      // get the children of the current node
      const children = neighbours(node);
      // loop through children
      for (const child of children) {
        // if child is not visited
        if (!visited.has(child.toString()) && !frontier.has(child.toString())) {
          // add child to parent
          parent.set(child.toString(), node);
          // add child to stack
          stack.push(child);
          frontier.add(child.toString());

          // mark frontier nodes
          timeOutExecutionIds.add(
            setTimeout(() => {
              GridSetup.markCell(child[0], child[1], "frontier");
            }, dfsCounter() * delay)
          );
        }
      }
    }
    console.log("no path found");
    showResults([], visited.size);
    return [];
  };

  const dijkstra = (start, end) => {
    // mark start and target cells
    GridSetup.markCell(start[0], start[1], "start");
    GridSetup.markCell(end[0], end[1], "target");

    // create a counter object
    const dijkstraCounter = counter();

    const visited = new Set();
    const parent = new Map();

    // create a priority queue
    const queue = new DataStructures.PriorityQueue();

    // add start node to queue
    queue.enqueue(start, 0);

    // keep track of the distance from the start node to each node
    const distances = new Map();
    distances.set(start.toString(), 0);

    while (queue.size() > 0) {
      let node = queue.dequeue();
      let distanceFromSrc = node.priority;
      node = node.value;

      // check if node is already being visited
      // we do this here because all visited nodes have the best distance so far
      // so we don't need to check them again ()
      if (visited.has(node.toString())) {
        continue;
      }

      // add node to visited
      visited.add(node.toString());
      timeOutExecutionIds.add(
        setTimeout(() => {
          GridSetup.markCell(node[0], node[1], "visited");
        }, dijkstraCounter() * delay)
      );

      // check if node is end
      if (node[0] === end[0] && node[1] === end[1]) {
        // backtrack to get the path
        const path = [];
        let current = end;
        while (current.toString() !== start.toString()) {
          path.push(current);
          current = parent.get(current.toString());
        }
        path.push(start);
        path.reverse();
        // mark path
        timeOutExecutionIds.add(
          setTimeout(() => {
            for (const node of path) {
              GridSetup.markCell(node[0], node[1], "path");
            }
          }, dijkstraCounter() * delay)
        );

        // console.log(path, visited);
        showResults(path, visited.size);
        return [path, visited];
      }

      // get neighbors
      const children = neighbours(node);
      // loop through neighbors
      for (const child of children) {
        // calculate the distance from the start node to the child
        const newDistance = distanceFromSrc + 1;

        // Add a child as long as its not in the queue or its in the queue but with a greater distance
        if (
          !distances.has(child.toString()) ||
          distances.get(child.toString()) > newDistance
        ) {
          distances.set(child.toString(), newDistance);
          parent.set(child.toString(), node);
          // add child to queue
          queue.enqueue(child, newDistance);

          // mark frontier nodes
          timeOutExecutionIds.add(
            setTimeout(() => {
              GridSetup.markCell(child[0], child[1], "frontier");
            }, dijkstraCounter() * delay)
          );
        }
      }
    }

    console.log("no path found");
    showResults([], visited.size);
    return [];
  };

  /* 
    A* algorithm also known as Best First Search
   */
  const aStar = (start, end) => {
    // mark start and target cells
    GridSetup.markCell(start[0], start[1], "start");
    GridSetup.markCell(end[0], end[1], "target");

    // create a counter object
    const aStarCounter = counter();

    const visited = new Set();
    const parent = new Map();

    // create a priority queue
    const queue = new DataStructures.PriorityQueue();

    // add start node to queue
    const startNode = new DataStructures.Node(start, null);
    const endNode = new DataStructures.Node(end, null);
    queue.enqueue(startNode, 0);

    // keep track of the distance from the start node to each node
    const distances = new Map();
    distances.set(start.toString(), 0);

    while (queue.size() > 0) {
      let node = queue.dequeue().value;
      //   let distanceFromSrc = node.priority;
      //   node = node.value;

      // check if node is already being visited
      // we do this here because all visited nodes have the best distance so far
      // so we don't need to check them again ()
      if (visited.has(node.toString())) {
        continue;
      }

      // add node to visited
      visited.add(node.toString());
      timeOutExecutionIds.add(
        setTimeout(() => {
          GridSetup.markCell(node.value[0], node.value[1], "visited");
        }, aStarCounter() * delay)
      );

      // check if node is end
      if (node.equals(endNode)) {
        // backtrack to get the path
        const path = [];
        let current = node;
        while (current.toString() !== start.toString()) {
          path.push(current.value);
          //   current = parent.get(current.toString());
          current = current.parent;
        }
        path.push(start);
        path.reverse();
        // mark path
        timeOutExecutionIds.add(
          setTimeout(() => {
            for (const node of path) {
              GridSetup.markCell(node[0], node[1], "path");
            }
          }, aStarCounter() * delay)
        );

        // console.log(path, visited);
        showResults(path, visited.size);
        return [path, visited];
      }

      // get neighbors
      const children = neighbours(node.value);
      // loop through neighbors
      for (const child of children) {
        const childNode = new DataStructures.Node(child, node);
        childNode.g = node.g + 1;
        childNode.h = heuristic(child, end);
        childNode.f = childNode.g + childNode.h;

        // check if node is already being visited
        if (visited.has(childNode.toString())) {
          continue;
        }

        // Add a child as long as its not in
        // the queue or its in the queue but with a greater distance
        if (!queue.has(childNode) || childNode.g < queue.get(childNode).g) {
          // add child to queue
          queue.enqueue(childNode, childNode.f);

          // mark frontier nodes
          timeOutExecutionIds.add(
            setTimeout(() => {
              GridSetup.markCell(child[0], child[1], "frontier");
            }, aStarCounter() * delay)
          );
        }
      }
    }

    console.log("no path found");
    showResults([], visited.size);
    return [];
  };

  // heuristic function
  function heuristic(a, b) {
    // Manhattan distance
    // return manhattanDistance(a, b);

    // Euclidean distance
    return euclideanDistance(a, b);
  }

  // find the manhattan distance between two nodes (this is our heuristic function)
  function manhattanDistance(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  }

  // find the euclidean distance between two nodes (this is our heuristic function)
  function euclideanDistance(a, b) {
    // the 0.6 is to  make the algorithm more greedy , a higher number can be used to make it more greedy
    return (Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2)) ** 0.6;
  }

  //  Returns an array of neighbor nodes
  const neighbours = (node) => {
    const [row, col] = node;
    const children = [];

    // left
    if (col > 0) {
      // check if the node is not a wall
      if (!GridSetup.isWall(row, col - 1)) {
        children.push([row, col - 1]);
      }
    }
    // down
    if (row < rows - 1) {
      // check if the node is not a wall
      if (!GridSetup.isWall(row + 1, col)) {
        children.push([row + 1, col]);
      }
    }
    // right
    if (col < cols - 1) {
      // check if the node is not a wall
      if (!GridSetup.isWall(row, col + 1)) {
        children.push([row, col + 1]);
      }
    }
    // up
    if (row > 0) {
      // check if the node is not a wall
      if (!GridSetup.isWall(row - 1, col)) {
        children.push([row - 1, col]);
      }
    }

    return children;
  };

  return { search, clearResults, clearTimeOuts };
})();

const DataStructures = (() => {
  // Priority Queue
  class PriorityQueue {
    constructor() {
      this.values = [];
    }
    // add to queue and sort
    enqueue(value, priority) {
      this.values.push({ value, priority });
      this.sort();
    }
    dequeue() {
      return this.values.shift();
    }
    sort() {
      this.values.sort((a, b) => a.priority - b.priority);
    }

    delete(value) {
      this.values = this.values.filter(
        (node) => node.value.toString() !== value
      );
      this.sort();
    }

    get(node) {
      return this.values.find((n) => n.value.equals(node));
    }

    has(node) {
      return this.values.some((n) => n.value.equals(node));
    }

    size() {
      return this.values.length;
    }
  }

  class Node {
    constructor(value, parent = null) {
      this.parent = parent;
      this.value = value;
      // this.children = [];
      this.g = 0;
      this.h = 0;
      this.f = 0;
    }

    equals(node) {
      return this.value.toString() === node.value.toString();
    }

    toString() {
      return this.value.toString();
    }
  }

  return { PriorityQueue, Node };
})();

function disableDrawingControlBtns() {
  for (const btn of [toggleDrawing, clearWallsBtn]) {
    btn.disabled = true;
  }
}

function enableDrawingControlBtns() {
  for (const btn of [toggleDrawing, clearWallsBtn]) {
    btn.disabled = false;
  }
}

window.onload = () => {
  // create initial grid
  GridSetup.updateGrid(cols, rows);
  // set max value for start and target inputs
  InputControl.setStartTargetMax(rows, cols);

  // set current algorithm title
  InputControl.setAlgorithmTitle(
    document.querySelector(".algorithms :checked").id
  );
};
