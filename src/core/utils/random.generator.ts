import { Injectable } from '@nestjs/common';

@Injectable()
export class RandomGenerator {
  async generateRandomString(length: number): Promise<string> {
    const characters =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMOPQRSTUVWXYZ1234567890';
    const shuffle = (str: string) =>
      str
        .split('')
        .sort(() => 0.5 - Math.random())
        .join('');

    const part1 = shuffle(characters).substring(0, 32);
    const part2 = Date.now().toString();
    const part3 = shuffle(characters).substring(0, 32);

    return (part1 + part2 + part3).substring(0, length);
  }
}
