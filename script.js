const calculator = {
  currentValue: "0",
  previousValue: null,
  operation: null,
  waitingForOperand: false,
  decimalEntered: false,
};

const elements = {
  current: document.getElementById("current"),
  history: document.getElementById("history"),
  errorIndicator: document.getElementById("error-indicator"),
  buttons: document.querySelectorAll(".btn"),
  themeToggle: document.querySelector(".theme-toggle"),
};

const buttonSound = new Audio("click.wav");
buttonSound.volume = 0.5;

const operatorSymbols = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
  power: "^",
  squareRoot: "√",
  square: "²",
  modulus: "mod",
  percentage: "%",
  inverse: "1/",
};

const keyMap = {
  0: "0",
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  ".": ".",
  "+": "add",
  "-": "subtract",
  "*": "multiply",
  x: "multiply",
  "/": "divide",
  Enter: "calculate",
  "=": "calculate",
  Escape: "clear",
  Backspace: "delete",
  Delete: "clear",
  "%": "percentage",
  m: "modulus",
  "^": "power",
  s: "square",
  r: "squareRoot",
  i: "inverse",
};

// Initialize calculator
document.addEventListener("DOMContentLoaded", () => {
  elements.buttons.forEach((btn) =>
    btn.addEventListener("click", handleButtonClick)
  );
  document.addEventListener("keydown", handleKeyPress);
  elements.themeToggle.addEventListener("click", toggleTheme);
  initTheme();
  updateDisplay();
});

function handleButtonClick() {
  playButtonSound();
  this.classList.add("active");
  setTimeout(() => this.classList.remove("active"), 150);

  const { action, value } = this.dataset;
  if (value) handleNumberInput(value);
  else if (action === "calculate") {
    performCalculation();
    calculator.previousValue = null;
    calculator.operation = null;
  } else if (action === "clear") clearCalculator();
  else if (action === "delete") deleteLastDigit();
  else if (action) handleOperator(action);

  updateDisplay();
}

function handleKeyPress(e) {
  const action = keyMap[e.key];
  if (!action) return;

  const button = document.querySelector(
    `[data-action="${action}"], [data-value="${action}"]`
  );
  if (button) {
    button.click();
    e.preventDefault();
  }
}

function handleNumberInput(number) {
  if (calculator.waitingForOperand) {
    calculator.currentValue = number === "." ? "0." : number;
    calculator.waitingForOperand = false;
    calculator.decimalEntered = number === ".";
    return;
  }

  if (number === ".") {
    if (calculator.decimalEntered) return;
    calculator.decimalEntered = true;
    if (!calculator.currentValue.includes(".")) {
      calculator.currentValue += ".";
    }
  } else {
    calculator.currentValue =
      calculator.currentValue === "0"
        ? number
        : calculator.currentValue + number;
  }
}

function handleOperator(action) {
  const unaryOps = ["square", "squareRoot", "inverse"];

  if (unaryOps.includes(action)) {
    calculator.operation = action;
    performCalculation();
    return;
  }

  if (action === "power") {
    calculator.previousValue =
      calculator.previousValue || calculator.currentValue;
    calculator.operation = action;
    calculator.waitingForOperand = true;
    calculator.decimalEntered = false;
    return;
  }

  if (calculator.waitingForOperand) {
    calculator.operation = action;
    return;
  }

  if (calculator.previousValue !== null) performCalculation();

  calculator.previousValue = calculator.currentValue;
  calculator.operation = action;
  calculator.waitingForOperand = true;
  calculator.decimalEntered = false;
}

function performCalculation() {
  if (!calculator.operation) return;

  const prev = parseFloat(calculator.previousValue || calculator.currentValue);
  const current = calculator.waitingForOperand
    ? prev
    : parseFloat(calculator.currentValue);

  const operations = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) =>
      b === 0
        ? (() => {
            throw new Error("Cannot divide by zero");
          })()
        : a / b,
    power: (a, b) => Math.pow(a, b),
    square: (a) => Math.pow(a, 2),
    squareRoot: (a) =>
      a < 0
        ? (() => {
            throw new Error("Invalid input for √");
          })()
        : Math.sqrt(a),
    inverse: (a) =>
      a === 0
        ? (() => {
            throw new Error("Cannot divide by zero");
          })()
        : 1 / a,
    modulus: (a, b) => a % b,
    percentage: (a, b) => a * (b / 100),
  };

  try {
    const result = operations[calculator.operation](prev, current);
    calculator.currentValue = parseFloat(result.toFixed(6)).toString();

    const isUnary = ["square", "squareRoot", "inverse"].includes(
      calculator.operation
    );
    calculator.previousValue = isUnary ? null : calculator.previousValue;
    calculator.operation = isUnary ? null : calculator.operation;
    calculator.waitingForOperand = false;
  } catch (error) {
    showError(error.message);
  }
}

function clearCalculator() {
  Object.assign(calculator, {
    currentValue: "0",
    previousValue: null,
    operation: null,
    waitingForOperand: false,
    decimalEntered: false,
  });
  hideError();
}

function deleteLastDigit() {
  if (calculator.waitingForOperand) return;

  if (
    calculator.currentValue.length === 1 ||
    (calculator.currentValue.length === 2 &&
      calculator.currentValue.startsWith("-"))
  ) {
    calculator.currentValue = "0";
    calculator.decimalEntered = false;
  } else {
    if (calculator.currentValue.slice(-1) === ".")
      calculator.decimalEntered = false;
    calculator.currentValue = calculator.currentValue.slice(0, -1);
  }
}

function updateDisplay() {
  if (elements.current.classList.contains("error")) return;

  elements.current.textContent = formatNumber(calculator.currentValue);
  elements.history.textContent = calculator.operation
    ? `${formatNumber(calculator.previousValue)} ${
        operatorSymbols[calculator.operation] || ""
      }`
    : "";
}

function formatNumber(number) {
  if (typeof number === "string" && number.endsWith(".")) return number;

  const num = parseFloat(number);
  if (isNaN(num)) return "0";

  // Format with commas and 6 decimal places
  return num
    .toLocaleString("en-US", {
      maximumFractionDigits: 6,
      useGrouping: true,
    })
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

function showError(message) {
  clearCalculator();
  elements.current.textContent = message;
  elements.current.classList.add("error");
  elements.errorIndicator.style.opacity = "1";
  setTimeout(hideError, 2000);
}

function hideError() {
  elements.current.classList.remove("error");
  elements.errorIndicator.style.opacity = "0";
  updateDisplay();
}

function playButtonSound() {
  buttonSound.currentTime = 0;
  buttonSound.play().catch(() => console.log("Sound blocked"));
}

function toggleTheme() {
  const newTheme =
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "default"
      : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("nexusCalcTheme", newTheme);
  playButtonSound();
}

function initTheme() {
  const savedTheme = localStorage.getItem("nexusCalcTheme");
  if (savedTheme)
    document.documentElement.setAttribute("data-theme", savedTheme);
}
