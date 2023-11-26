import dotenv from 'dotenv';
import { Octokit } from '@octokit/core';
import { BlameMapper } from './BlameMapper';
import { Parser } from './Parser';
import { ReportInfo, Reporter } from './Reporter';

dotenv.config();
const token = process.env.TOKEN;
const octokit = new Octokit({ auth: token });

const blameMapper = new BlameMapper(octokit, { isRepoInPath: false });
const warnings = Parser.parse();
const filesSet = new Set<string>();
warnings.forEach((warn) => {
  filesSet.add(warn.pathToFile);
});

const fileArray = Array.from(filesSet);
Promise.all(fileArray.map((file) => blameMapper.blameAndSet({pathToFile: file, branch: 'feature/closure-compiler-warnings'}))).then(() => {
  const infos: ReportInfo[] = warnings.map((warn) => ({
    text: warn.warnText,
    ...blameMapper.find(warn.pathToFile, warn.line),
  }));
  Reporter.report(infos, {
    isSingleFile: false,
  });
});