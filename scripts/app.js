const grid = document.querySelector(".grid");
const form = document.querySelector("form");
const rowsInput = document.querySelector("#rows");
const colsInput = document.querySelector("#cols");
const submitBtn = document.querySelector("#generate");
// const algorithms = document.getElementsByName("algorithm");

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
    const algo = document.querySelector(
      'input[name="algorithm"]:checked'
    ).value;

    // clear grid
    GridSetup.clearGrid();

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
    startCol.max = cols;
    startRow.max = rows;
    targetCol.max = cols;
    targetRow.max = rows;
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
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell) => {
      cell.classList.remove("start", "target", "visited", "path");
    });
  };

  return { createGrid, updateGrid, markCell, clearGrid };
})();

const Search = (() => {
  let speed = 50;

  const search = (algoType, start, end, markSpeed = 50) => {
    speed = Math.max(0, markSpeed);
    switch (algoType) {
      case "bfs":
        bfs(start, end);
        break;
      case "dfs":
        dfs(start, end);
        break;
      default:
        break;
    }
  };

  function counter() {
    let count = 0;
    return function () {
      return count++;
    };
  }

  const bfs = (start, end) => {
    // create a counter object
    const bfsCounter = counter();

    // parse str to int
    start = start.map((x) => parseInt(x));
    end = end.map((x) => parseInt(x));

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
      setTimeout(() => {
        GridSetup.markCell(node[0], node[1], "visited");
      }, bfsCounter() * speed);

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
        setTimeout(() => {
          path.forEach((node) => {
            GridSetup.markCell(node[0], node[1], "path");
          });
        }, bfsCounter() * speed);
        console.log(path, visited);
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

    // Parse str to int
    start = start.map((x) => parseInt(x));
    end = end.map((x) => parseInt(x));

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
      setTimeout(() => {
        GridSetup.markCell(node[0], node[1], "visited");
      }, dfsCounter() * speed);

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
        setTimeout(() => {
          path.forEach((node) => {
            GridSetup.markCell(node[0], node[1], "path");
          });
        }, dfsCounter() * speed);

        console.log(path, visited);
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

  return { search };
})();

window.onload = () => {
  // create initial grid
  GridSetup.updateGrid(cols, rows);
  // set max value for start and target inputs
  FormControl.setStartTargetMax(rows, cols);
};
