const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
};

export const generatePWD = async (len: any) => {
  const lower: string = 'abcdefghijklmnopqrstuvwxyz';
  const upper: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numb: string = '0123456789';
  const specials: string = '!#$%&*~';
  const allchars: string = lower + upper + numb + specials;
  let randPWDArray: string[] = new Array<string>(len);
  randPWDArray[0] = lower;
  randPWDArray[1] = upper;
  randPWDArray[2] = numb;
  randPWDArray[3] = specials;
  randPWDArray = randPWDArray.fill(allchars, 4);
  return shuffleArray(
    randPWDArray.map((x) => {
      return x[Math.floor(Math.random() * x.length)];
    })
  ).join('');
};
