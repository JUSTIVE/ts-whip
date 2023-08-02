import { execSync } from "child_process";
import chalk from "chalk";
import * as Decorator from "./Decorator.mjs";
import { Locales } from './Locales';
import { match } from 'ts-pattern';
import { O, pipe, F } from '@mobily/ts-belt';

export type FileDiff = {
  added: number;
  deleted: number;
  filename: string;
};
export type t = {
  files: FileDiff[];
  total: {
    added: number;
    deleted: number;
  };
};

export const getStat = (): t => {
  const files: FileDiff[] = execSync("git diff --cached --numstat")
    .toString()
    .split("\n")
    .slice(0, -1)
    .map((line) => {
      const [added, deleted, filename] = line.split("\t");
      return {
        added: Number(added),
        deleted: Number(deleted),
        filename,
      };
    });

  const total = files
    .filter(({ added, deleted }) => isNaN(added) || isNaN(deleted))
    .reduce(
      (acc, { added, deleted }) => ({
        added: acc.added + added,
        deleted: acc.deleted + deleted,
      }),
      { added: 0, deleted: 0 },
    );

  return { files, total };
};

//log with box and text in it

export const Log = ({ files, total: { added, deleted } }: t, locale:Locales) => {
  const logFile = (value: FileDiff) => {
    const tooManyConstraint = 50;
    const tooManyAdded = value.added > tooManyConstraint;
    const added = (tooManyAdded ? chalk.yellow : chalk.green)(value.added);

    const tooManyDeleted = value.deleted > tooManyConstraint;
    const deleted = (tooManyDeleted ? chalk.yellow : chalk.red)(value.deleted);

    const manyChanged = tooManyAdded || tooManyDeleted;
    const filename = (manyChanged ? chalk.yellow : chalk.cyan)(value.filename);

		const tooManyChangedTag = pipe(
			manyChanged,
			O.fromPredicate(F.identity),
			O.map(F.always(
				match(locale)
				.with("en-US", () => "too many changes")
				.with("ko-KR", () => "너무 많은 변경이 있습니다")
				.with("ja-JP", () => "多すぎる変更")
				.exhaustive()
			)),
			O.getWithDefault("")
		);

		console.log(`${added}\t${deleted}\t${filename}\t${tooManyChangedTag}`)
  };
  console.log(`\n${chalk.bgCyan("\nStaged Files")}`);
  console.log(`\n${chalk.cyan("added\tdeleted\tfilename")}\n`);
  files.map(logFile);
  console.log("");
  console.log(`total added: ${chalk.green(added)}`);
  console.log(`total deleted: ${chalk.red(deleted)}`);
  console.log("");

  const tooManyChanged = added + deleted > 200 || files.length > 20;
  if (tooManyChanged) {
    Decorator.Box("Too many changes!!!", chalk.yellow);
  }
};
