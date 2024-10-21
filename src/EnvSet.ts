import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { A, O, pipe } from "@mobily/ts-belt";
import { P, match } from "ts-pattern";
import type * as Config from "./Config.js";
import type * as EnvSet from "./EnvSet.js";
import * as PackageManager from "./PackageManager.js";
import * as Stat from "./Stat.js";
import { type STEPS_VARIANT, STEP_PRESET } from "./Step.Preset.js";
import type * as Step from "./Step.js";

export type t = {
	packageManager: PackageManager.t;
	stagedFileList: string[];
	TSFilesList: string[];
	ProductTSFilesList: string[];
	stat: Stat.t;
	sourceDir: string[];
	unSafeBranchList: string[];
	safeBranch: boolean;
	verbose: boolean;
	availableCommands: string[];
	testFileExists: boolean;
	steps: ReadonlyArray<Step.t>;
};

type StagedFile = string;
type StagedFileList = StagedFile[];

const getStagedFileList = async (): Promise<StagedFileList> => {
	return execSync("git diff --cached --name-only --diff-filter=d")
		.toString()
		.split("\n")
		.slice(0, -1)
		.map((filename) => (filename.includes(" ") ? `"${filename}"` : filename));
};

const isAnyTestFileExists = async () => {
	const direntFullPath = ({ parentPath, name }: fs.Dirent) =>
		`${parentPath}${path.sep}${name}`;
	const getFiles = (dir: string): fs.Dirent[] => {
		const dirents = fs.readdirSync(dir, { withFileTypes: true });
		const files = dirents.filter(
			(dirent) =>
				dirent.isFile() &&
				dirent.name.includes(".test.") &&
				dirent.name.includes(".ts"),
		);
		const subdirectories = dirents
			.filter((dirent) => dirent.isDirectory())
			.filter(
				(x) =>
					!x.name.startsWith("node_modules") &&
					!x.name.includes("__generated__") &&
					!x.name.startsWith("."),
			);

		for (const subdirectory of subdirectories) {
			files.push(...getFiles(direntFullPath(subdirectory)));
		}
		return files;
	};
	return getFiles("./").some((x) => x.name.includes(".test."));
};

const getStagedTSFileList = (
	stagedFileList: StagedFileList,
): StagedFileList => {
	const allowed_exts = [".ts", ".tsx", ".mts", ".mtsx"];
	return stagedFileList.filter((filename) =>
		allowed_exts.some((ext) => filename.endsWith(ext)),
	);
};

const getProductTSFileList = (TSFilesList: string[]) =>
	TSFilesList.filter((filename) => !filename.includes("husky"));

const stagedFileList = await getStagedFileList();
const TSFilesList = getStagedTSFileList(stagedFileList);
const ProductTSFilesList = getProductTSFileList(TSFilesList);

export const determineSafeBranch = async (
	unSafeBranchList: string[],
): Promise<boolean> =>
	!unSafeBranchList.includes(
		((await Bun.file(".git/HEAD").text()).split(" ")[1] ?? "")
			.split("/")
			.at(-1) ?? "",
	);

//read available scripts from package.json
export const collectScript = async () => {
	const file = await Bun.file("package.json").text();
	const packageJSON = JSON.parse(file);
	const scripts = packageJSON.scripts;
	return Object.keys(scripts);
};

export const loadSteps = async (
	steps: (STEPS_VARIANT | [STEPS_VARIANT, string])[],
): Promise<ReadonlyArray<Step.t>> => {
	return pipe(
		steps,
		A.filterMap((x) =>
			match(x)
				.with(P.string, (x) => STEP_PRESET[x])
				.with([P.string, P.string], ([step, command]) => ({
					...STEP_PRESET[step],
					command: (_envSet: EnvSet.t) => command,
				}))
				.otherwise(() => O.None),
		),
	);
};

export const make = async ({
	sourceDir,
	unSafeBranchList,
	verbose,
	steps: steps_,
}: Config.t): Promise<t> => {
	const [
		packageManager,
		testFileExists,
		availableCommands,
		steps,
		safeBranch,
		stat,
	] = await Promise.all([
		PackageManager.get(verbose),
		isAnyTestFileExists(),
		collectScript(),
		loadSteps(steps_),
		determineSafeBranch(unSafeBranchList),
		Stat.getStat(),
	]);

	return {
		packageManager,
		stagedFileList,
		TSFilesList,
		ProductTSFilesList,
		stat,
		sourceDir,
		unSafeBranchList,
		safeBranch,
		verbose,
		testFileExists,
		availableCommands,
		steps,
	};
};
