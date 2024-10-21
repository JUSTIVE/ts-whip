import { exec } from "node:child_process";
import { promisify } from "node:util";
import { F, O, pipe } from "@mobily/ts-belt";
import chalk from "chalk";
import * as Decorator from "./Decorator.js";
import Message from "./Message.js";

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

export const getStat = async (): Promise<t> => {
	const exec_ = promisify(exec);
	const files: FileDiff[] = (await exec_("git diff --cached --numstat")).stdout
		.toString()
		.split("\n")
		.slice(0, -1)
		.map((line) => {
			const [added, deleted, filename] = line.split("\t");
			return {
				added: Number(added),
				deleted: Number(deleted),
				filename,
			} as FileDiff;
		});

	const total = files
		.filter(
			({ added, deleted }) => !Number.isNaN(added) || !Number.isNaN(deleted),
		)
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

export const Log = ({ files, total: { added, deleted } }: t) => {
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
			O.map(F.always(Message.TOO_MANY_CHANGES)),
			O.getWithDefault(""),
		);

		console.log(`${added}\t${deleted}\t${filename}\t${tooManyChangedTag}`);
	};

	console.log(`\n${chalk.bgCyan(`\n ${Message.STAGED_FILES} `)}`);
	console.log(
		`\n${chalk.cyan(`${Message.ADDED}\t${Message.DELETED}\t${Message.FILENAME}`)}\n`,
	);
	files.map(logFile);

	console.log(`\n${Message.TOTAL_ADDED}: ${chalk.green(added)}`);
	console.log(`${Message.TOTAL_DELETED}: ${chalk.red(deleted)}\n`);

	const tooManyChanged = added + deleted > 200 || files.length > 20;
	if (tooManyChanged) {
		Decorator.Box(Message.TOO_MANY_CHANGES_LABEL, chalk.yellow);
	}
};
