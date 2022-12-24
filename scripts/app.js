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
        console.log("invalid");
        return;
      } else {
        input.setCustomValidity("");
      }
    }

    console.log("submit");
    // perform search function
    const algo = document.querySelector(
      'input[name="algorithm"]:checked'
    ).value;

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

  return { createGrid, updateGrid };
})();

const Search = (() => {
  const search = (algoType, start, end) => {
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

  const bfs = (start, end) => {
    console.log("bfs");
  };
  const dfs = (start, end) => {
    console.log(start);

    if (start[0] === end[0] && start[1] === end[1]) {
      console.log("start is end");
      return;
    }

    // Parse str to int
    start = start.map((x) => parseInt(x));
    end = end.map((x) => parseInt(x));

    // DFS uses a stack
    const stack = [];
    // keep track of visited nodes
    const visited = new Set();
    // keep track of parent nodes
    const parent = new Map();

    // add start node to stack
    stack.push(start);
    // add start node to visited
    visited.add(start);

    while (stack.length > 0) {
      // get the last node in the stack
      const node = stack.pop();
      // if node is the target node, we're done
      if (node[0] === end[0] && node[1] === end[1]) {
        console.log("found target");
        // backtrack to get the path
        const path = [];
        let current = end;
        while (current.toString() !== start.toString()) {
          path.push(current);
          current = parent.get(current);
          console.log("in a while loop");
        }
        path.push(start);
        path.reverse();
        console.log(path);
        return path;
      }
      // get the children of the current node
      const children = neighbours(node);
      // loop through children
      for (const child of children) {
        // if child is not visited
        if (!visited.has(child)) {
          // add child to visited
          visited.add(child);
          // add child to parent
          parent.set(child, node);
          // add child to stack
          stack.push(child);
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
