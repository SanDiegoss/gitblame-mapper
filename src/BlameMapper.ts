import { Octokit } from '@octokit/core';

interface BlameOptions {
    pathToFile: string;
    repo?: string;
    branch?: string;
    owner?: string;
}

interface Range {
  commit: Commit;
  startingLine: number;
  endingLine: number;
}

interface GetBlameResult {
  repository: {
    ref: {
      target: {
        blame: {
          ranges: Range[];
        };
      };
    };
  };
}

interface BlameMapperOptions {
  isRepoInPath?: boolean;
}

export interface Commit {
    author: {
      name: string;
    };
    authoredDate: string;
  }

export class BlameMapper {
  readonly blameMap: Map<string, Range[]> = new Map<string, Range[]>();
  readonly options: BlameMapperOptions = {};
  readonly octokit: Octokit;
  constructor(octokit: Octokit, options?: BlameMapperOptions) {
    this.octokit = octokit;
    this.options = {
      isRepoInPath: Boolean(options?.isRepoInPath),
    };
  }
  set(file: string, blameResult: GetBlameResult) {
    const ranges = blameResult.repository.ref.target.blame.ranges;
    this.blameMap.set(file, ranges);
  }
  find(file: string, line: number): Commit {
    if (!this.blameMap.has(file)) {
      console.error(`Cannot find file ${file} in blameMap`);
      return {
        author: {
            name: 'Blame error'
        },
        authoredDate: 'Blame error',
      }
    }
    const ranges = this.blameMap.get(file);
    for (const range of ranges) {
      const startingLine = range.startingLine;
      const endingLine = range.endingLine;
      if (line >= startingLine && line <= endingLine) {
        return {
          author: range.commit.author,
          authoredDate: range.commit.authoredDate,
        };
      }
    }
    console.error(`Cannot find ${line} line for ${file}. Check the BlameMapper branch`)
      return {
        author: {
            name: 'Error find the line'
        },
        authoredDate: 'Error find the line',
      };
  }
  async blameAndSet(blameOptions: BlameOptions) {
    const pathToFile = blameOptions.pathToFile;
    const repo = blameOptions.repo || 'sdkjs';
    const blameResult = await this.getBlame(blameOptions);
    if (blameResult !== null) {
      this.set(
        `${this.options.isRepoInPath ? repo + '/' : ''}${pathToFile}`,
        blameResult
      );
    }
  }
  async getBlame(blameOptions: BlameOptions) {
    const pathToFile = blameOptions.pathToFile;
    const repo = blameOptions.repo || 'sdkjs';
    const branch = blameOptions.branch || 'master';
    const owner = blameOptions.owner || 'ONLYOFFICE';
    try {
      const result = (await this.octokit.graphql(
        `
              query blame($owner: String!, $repo: String!, $branch: String!, $path: String!) {
                repository(name: $repo, owner: $owner) {
                  ref(qualifiedName: $branch) {      
                    target {
                      ... on Commit {
                        blame(path:$path) {
                          ranges {
                            commit {
                              author {
                                name
                              }
                              authoredDate
                            }
                            startingLine
                            endingLine
                          }
                        }
                      }
                    }
                  }
                }
              } 
            `,
        {
          repo: repo,
          owner: owner,
          branch: branch,
          path: pathToFile,
        }
      )) as GetBlameResult;
      return result;
    } catch (error) {
      console.error(`Cannot GET ${pathToFile}: ${error}`);
      return null;
    }
  }
}
