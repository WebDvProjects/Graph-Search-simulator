const grid = document.querySelector(".grid");
const form = document.querySelector("form");
const rowsInput = document.querySelector("#rows");
const colsInput = document.querySelector("#cols");
const submitBtn = document.querySelector("#generate");
const stopBtn = document.querySelector("#stop-generate");

stopBtn.addEventListener("click", () => {
  Search.clearTimeOuts();
});

let cols = rowsInput.value;
let rows = colsInput.value;

const FormControl = (() => {
  const startCol = document.querySelector("#start-col");
  const startRow = document.querySelector("#start-row");
  const targetCol = document.querySelector("#target-col");
  const targetRow = document.querySelector("#target-row");

  /* EVENT LISTENERS */
  [rowsInput, colsInput].forEach((input) => {
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
  });

  [rowsInput, colsInput, startCol, startRow, targetCol, targetRow].forEach(
    (input) => {
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
  );

  form.onsubmit = function (e) {
    e.preventDefault();

    // validate form in case user didn't use input
    for (const input of [
      rowsInput,
      colsInput,
      startCol,
      startRow,
      targetCol,
      targetRow,
    ]) {
      if (!!!input.value) {
        input.setCustomValidity("This field is required");
        input.reportValidity();
        return;
      } else {
        input.setCustomValidity("");
      }
    }

    // perform search function
    const algo = document.querySelector('input[name="algorithm"]:checked').id;

    // clear grid
    GridSetup.clearGrid();

    // clear results
    Search.clearResults();

    // perform search
    Search.search(
      algo,
      [startRow.value, startCol.value],
      [targetRow.value, targetCol.value]
    );
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

  return { setStartTargetMax };
})();

const GridSetup = (() => {
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
      default:
        break;
    }
  };

  const clearGrid = () => {
    // clear any timeouts from serch functions
    Search.clearTimeOuts();

    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell) => {
      cell.classList.remove("start", "target", "visited", "path");
    });
  };

  return { createGrid, updateGrid, markCell, clearGrid };
})();

const Search = (() => {
  const resultsContainer = document.querySelector("#results-container");
  const visitsDisplay = document.querySelector("#visits");
  const pathSizeDisplay = document.querySelector("#path-size");
  let speed = 50;
  let timeOutExecutionIds = new Set();

  const search = (algoType, start, end, markSpeed = 50) => {
    // clear any current executions timeouts
    clearTimeOuts();

    // parse str to int
    start = start.map((x) => parseInt(x));
    end = end.map((x) => parseInt(x));

    speed = Math.max(0, markSpeed);
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
    resultsContainer.classList.remove("hidden");
  }

  function clearResults() {
    resultsContainer.classList.add("hidden");
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

      // add to path
      path.push([row, col]);

      // mark visited cells
      timeOutExecutionIds.add(
        setTimeout(() => {
          GridSetup.markCell(row, col, "visited");
        }, speed * iterationCounter())
      );

      if (i === endIndex) {
        // mark path
        timeOutExecutionIds.add(
          setTimeout(() => {
            path.forEach((node) => {
              GridSetup.markCell(node[0], node[1], "path");
            });
          }, speed * iterationCounter())
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
        }, bfsCounter() * speed)
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
            path.forEach((node) => {
              GridSetup.markCell(node[0], node[1], "path");
            });
          }, bfsCounter() * speed)
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
        }
      }
    }

    // no path found
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
        }, dfsCounter() * speed)
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
            path.forEach((node) => {
              GridSetup.markCell(node[0], node[1], "path");
            });
          }, dfsCounter() * speed)
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
        }
      }
    }
    console.log("no path found");
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
    queue.enqueue(start, 0 + heuristic(start, end));

    // keep track of the distance from the start node to each node
    const frontier = new Map();
    frontier.set(start.toString(), 0);

    while (queue.size() > 0) {
      const node = queue.dequeue().value;
      const nodeDistance = frontier.get(node.toString());
      frontier.delete(node.toString());

      // add node to visited
      visited.add(node.toString());
      timeOutExecutionIds.add(
        setTimeout(() => {
          GridSetup.markCell(node[0], node[1], "visited");
        }, dijkstraCounter() * speed)
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
            path.forEach((node) => {
              GridSetup.markCell(node[0], node[1], "path");
            });
          }, dijkstraCounter() * speed)
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
        const newDistance = nodeDistance + 1;

        // if child is not visited and not in the queue
        if (!visited.has(child.toString()) && !frontier.has(child.toString())) {
          // update the distance to the child
          frontier.set(child.toString(), newDistance);
          // add child to parent
          parent.set(child.toString(), node);
          // add child to queue
          queue.enqueue(child, newDistance + heuristic(child, end));
        }
        // Otherwise if child is in the queue and the new distance is less than the old distance
        else if (
          frontier.has(child.toString()) &&
          frontier.get(child.toString()) > newDistance
        ) {
          // update the distance to the child
          frontier.set(child.toString(), newDistance);
          // add child to parent
          parent.set(child.toString(), node);

          // delete child with old distance from queue
          queue.delete(child.toString());

          // add child to queue with updated distance (replace old child with new child)
          queue.enqueue(
            child,
            frontier.get(child.toString()) + heuristic(child, end)
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
    return manhattanDistance(a, b);

    // Euclidean distance
    // return euclideanDistance(a, b);
  }

  // find the manhattan distance between two nodes (this is our heuristic function)
  function manhattanDistance(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  }

  // find the euclidean distance between two nodes (this is our heuristic function)
  function euclideanDistance(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
  }

  //  Returns an array of neighbor nodes
  const neighbours = (node) => {
    const [row, col] = node;
    const children = [];
    // up
    if (row > 0) {
      children.push([row - 1, col]);
    }
    // down
    if (row < rows - 1) {
      children.push([row + 1, col]);
    }
    // left
    if (col > 0) {
      children.push([row, col - 1]);
    }
    // right
    if (col < cols - 1) {
      children.push([row, col + 1]);
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

    size() {
      return this.values.length;
    }
  }
  return { PriorityQueue };
})();

window.onload = () => {
  // create initial grid
  GridSetup.updateGrid(cols, rows);
  // set max value for start and target inputs
  FormControl.setStartTargetMax(rows, cols);
};
