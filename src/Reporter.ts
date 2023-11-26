import { Commit } from './BlameMapper';
import fs from 'node:fs';
import path from 'node:path'

interface ReporterOptions {
  isSingleFile?: boolean;
  outFileName?: string;
  reportFolder?: string,
}

export type ReportInfo = Commit & {
  text: string;
};

export class Reporter {
  static report(reportsInfo: ReportInfo[], options?: ReporterOptions) {
    const authorsMap = new Map<string, string[]>();
    const outFileName = options?.outFileName || 'out.txt';
    const reportFolder = options?.reportFolder || 'reports';
    reportsInfo.forEach((reportInfo) => {
      const text = `COMMIT DATE: ${reportInfo.authoredDate}\nWARNING TEXT:\n${reportInfo.text}`;
      if (!authorsMap.has(reportInfo.author.name)) {
        authorsMap.set(reportInfo.author.name, [text]);
      } else {
        authorsMap.get(reportInfo.author.name).push(text);
      }
    });
    if (options?.isSingleFile) {
      let result = '============BLAME REPORT============\n';
      authorsMap.forEach((textArray, author) => {
        result += `==========AUTHOR: ${author}==========\n`;
        textArray.forEach((text) => {
          result += text;
        });
      });
      if (!fs.existsSync(path.join(__dirname, '..', reportFolder))) {
        fs.mkdirSync(path.join(__dirname, '..', reportFolder));
      }
      fs.writeFileSync(path.join(__dirname, '..', reportFolder, outFileName), result);
    } else {
      authorsMap.forEach((textArray, author) => {
        let result = '============BLAME REPORT============\n';
        result += `==========AUTHOR: ${author}==========\n`;
        textArray.forEach((text) => {
          result += text;
        });
        if (!fs.existsSync(path.join(__dirname, '..', reportFolder))) {
          fs.mkdirSync(path.join(__dirname, '..', reportFolder));
        }
        fs.writeFileSync(path.join(__dirname, '..', reportFolder, `${author}-${outFileName}`), result);
      });
    }
  }
}
