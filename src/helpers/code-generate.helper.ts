export function codeGenerator() {
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const code = [];
  for (let i = 0; i < 12; i++) {
    const item = numbers[Math.floor(Math.random() * numbers.length)];
    code.push(item);
  }

  return code.join("");
}

