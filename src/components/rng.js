function feistel(x, bits = 8) {
  const half = bits / 2;
  const mask = (1 << half) - 1;

  let left = x >> half;
  let right = x & mask;

  const newLeft = right;
  const newRight = left ^ ((right * 13 + 7) & mask);

  return (newLeft << half) | newRight;
}

export { feistel };
