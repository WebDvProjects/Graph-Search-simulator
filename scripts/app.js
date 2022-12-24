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

      // validate input

      // set max value for start and target inputs
      setStartTargetMax(rows, cols);

      // update grid
      GridSetup.updateGrid(cols, rows);
    });
  });

  form.onsubmit = (e) => {
    e.preventDefault();
    // validate input

    // perform search function
    const algo = document.querySelector(
      'input[name="algorithm"]:checked'
    ).value;
    Search.search(algo, 0, 0);
  };

  const validateInput = (input) => {
    if (input.value < 1) {
      input.value = 1;
    } else if (input.value > 100) {
      input.value = 100;
    }
  };

  const setStartTargetMax = (rows, cols) => {
    console.log(rows, cols);
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
    console.log("dfs");
  };

  return { search };
})();

window.onload = () => {
  // create initial grid
  GridSetup.updateGrid(cols, rows);
  // set max value for start and target inputs
  FormControl.setStartTargetMax(rows, cols);
};
