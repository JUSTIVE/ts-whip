import { execSync } from "child_process";
import { F, O, pipe } from "@mobily/ts-belt";
import chalk from "chalk";
import { match } from "ts-pattern";
import * as Decorator from "./Decorator.js";
import { Locales } from "./Locales.js";

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

export const Log = (
	{ files, total: { added, deleted } }: t,
	locale: Locales,
) => {
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
			O.map(
				F.always(
					match(locale)
						.with("en-US", () => "too many changes")
						.with("ko-KR", () => "너무 많은 변경이 있습니다")
						.with("ja-JP", () => "多すぎる変更")
						.exhaustive(),
				),
			),
			O.getWithDefault(""),
		);

		console.log(`${added}\t${deleted}\t${filename}\t${tooManyChangedTag}`);
	};

	const title = match(locale)
		.with("en-US", () => "Staged Files")
		.with("ko-KR", () => "스테이지된 파일")
		.with("ja-JP", () => "ステージされたファイル")
		.exhaustive();

	const addedLabel = match(locale)
		.with("en-US", () => "added")
		.with("ko-KR", () => "추가됨")
		.with("ja-JP", () => "追加")
		.exhaustive();

	const deletedLabel = match(locale)
		.with("en-US", () => "deleted")
		.with("ko-KR", () => "삭제됨")
		.with("ja-JP", () => "削除")
		.exhaustive();

	const fileNameLabel = match(locale)
		.with("en-US", () => "filename")
		.with("ko-KR", () => "파일명")
		.with("ja-JP", () => "ファイル名")
		.exhaustive();

	console.log(`\n${chalk.bgCyan(`\n ${title} `)}`);
	console.log(
		`\n${chalk.cyan(`${addedLabel}\t${deletedLabel}\t${fileNameLabel}`)}\n`,
	);
	files.map(logFile);

	const totalAddedLabel = match(locale)
		.with("en-US", () => "total added")
		.with("ko-KR", () => "총 추가됨")
		.with("ja-JP", () => "合計追加")
		.exhaustive();

	const totalDeletedLabel = match(locale)
		.with("en-US", () => "total deleted")
		.with("ko-KR", () => "총 삭제됨")
		.with("ja-JP", () => "合計削除")
		.exhaustive();

	console.log(`\n${totalAddedLabel}: ${chalk.green(added)}`);
	console.log(`${totalDeletedLabel}: ${chalk.red(deleted)}\n`);

	const tooManyChanged = added + deleted > 200 || files.length > 20;
	if (tooManyChanged) {
		const tooManyChangedLabel = match(locale)
			.with("en-US", () => "Too many changes!!!")
			.with("ko-KR", () => "너무 많은 변경이 있습니다!!!")
			.with("ja-JP", () => "多すぎる変更があります!!!")
			.exhaustive();
		Decorator.Box(tooManyChangedLabel, chalk.yellow);
	}
};
