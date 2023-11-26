import { readFileSync } from 'fs';

export interface Warning {
  pathToFile: string;
  line: number;
  warnText: string;
}

export class Parser {
  static parse(inputFile = 'input.txt'): Warning[] {
    const result: Warning[] = [];
    const re = /(\w[\w\/]+\.js)\:(\d+)\:\d+\:\s\w+/;
    const data = readFileSync(inputFile, { encoding: 'utf8' });
    const splitedData = data
      .split('\n');
    let warnText = '';
    let pathToFile = '';
    let line = 0;
    let started = false;
    for (let i = 0; i < splitedData.length; i += 1) {
      const str = splitedData[i];
      if (re.test(str)) {
        started = true;
        if (warnText !== '') {
          result.push({
            pathToFile: pathToFile,
            line: line,
            warnText: warnText
          });
        }
        pathToFile = re.exec(str)[1];
        line = Number(re.exec(str)[2]);
        warnText = str.slice(2);
      } else if (started && str.slice(0, 2) === '>>'){
        warnText += str.slice(2);
      } else {
        started = false;
      }
    }
    result.push({
      pathToFile: pathToFile,
      line: line,
      warnText: warnText
    });
    return result;
  }
}