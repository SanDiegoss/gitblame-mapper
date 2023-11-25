import dotenv from 'dotenv';
import { Octokit } from 'octokit';
import path from 'node:path';

dotenv.config();
const token = process.env.TOKEN;
const octokit = new Octokit({ auth: token });

interface Commit {
  author: {
    name: string;
  };
}

interface Range {
  commit: Commit;
  startingLine: number;
  endingLine: number;
  age: number;
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

type CommitInfo = Commit & {
  age: number;
};

class BlameMapper {
  readonly blameMap: Map<string, Range[]> = new Map<string, Range[]>();
  set(file: string, blameResult: GetBlameResult) {
    const ranges = blameResult.repository.ref.target.blame.ranges;
    this.blameMap.set(file, ranges);
  }
  find(file: string, line: number): CommitInfo {
    const ranges = this.blameMap.get(file);
    for (const range of ranges) {
      const startingLine = range.startingLine;
      const endingLine = range.endingLine;
      if (line >= startingLine && line <= endingLine) {
        return {
          author: range.commit.author,
          age: range.age,
        };
      }
    }
  }
  async blameAndSet(
    repo: string,
    pathToFile: string,
    branch = 'master',
    owner = 'ONLYOFFICE'
  ) {
    const blameResult = await BlameMapper.getBlame(
      repo,
      pathToFile,
      branch,
      owner
    );
    this.set(`${repo}/${pathToFile}`, blameResult);
  }
  static async getBlame(
    repo: string,
    pathToFile: string,
    branch = 'master',
    owner = 'ONLYOFFICE'
  ) {
    const result = (await octokit.graphql(
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
                    }
                    startingLine
                    endingLine
                    age
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
  }
}

const blameMapper = new BlameMapper();
Promise.all([
  blameMapper.blameAndSet('sdkjs', 'build/Gruntfile.js'),
  blameMapper.blameAndSet('sdkjs', 'MakeFile'),
]).then(() => {
  console.log(blameMapper.find('sdkjs/build/Gruntfile.js', 3));
  console.log(blameMapper.find('sdkjs/build/Gruntfile.js', 15));
  console.log(blameMapper.find('sdkjs/build/Gruntfile.js', 47));
  console.log(blameMapper.find('sdkjs/build/Gruntfile.js', 96));
});
