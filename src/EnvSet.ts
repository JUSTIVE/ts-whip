import { execSync } from "child_process";
import * as Config from "./Config.js";
import * as PackageManager from "./PackageManager.js";
import * as Stat from "./Stat.js";
import * as Step from "./Step.js";

import { A, F, O } from "@mobily/ts-belt";
import { pipe } from "effect";
import { Locales, getLocale } from "./Locales.js";
import { getPlatform } from "./Platform.js";
import { STEPS_VARIANT, STEP_PRESET } from "./Step.Preset.js";

export type t = {
	packageManager: PackageManager.t;
	stagedFileList: string[];
	TSFilesList: string[];
	ProductTSFilesList: string[];
	stat: Stat.t;
	sourceDir: string[];
	unSafeBranchList: string[];
	safeBranch: boolean;
	locale: Locales;
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

const isAnyTextFileExists = async () => {
	return (
		execSync('find . -name "*.test.*" ! -path "*/node_modules/*"')
			.toString()
			.split("\n").length > 0
	);
};

const getStagedTSFileList = (stagedFileList: StagedFileList): StagedFileList =>
	stagedFileList.filter((filename) =>
		[".ts", ".tsx", ".mts", ".mtsx"].some((ext) => filename.endsWith(ext)),
	);

const getProductTSFileList = (TSFilesList: string[]) =>
	TSFilesList.filter((filename) => !filename.includes("husky"));

const stagedFileList = await getStagedFileList();
const TSFilesList = getStagedTSFileList(stagedFileList);
const ProductTSFilesList = getProductTSFileList(TSFilesList);

export const determineSafeBranch = (unSafeBranchList: string[]): boolean => {
	return pipe(
		O.fromExecution(() =>
			execSync(
				`git rev-parse --abbrev-ref HEAD | grep -E "${unSafeBranchList.join(
					"|",
				)}"`,
			),
		),
		O.match(F.always(false), F.always(true)),
	);
};

//read available scripts from package.json
export const collectScript = () => {
	const packageJSON = JSON.parse(execSync("cat package.json").toString());
	const scripts = packageJSON.scripts;
	return Object.keys(scripts);
};

export const loadSteps = async (
	steps: STEPS_VARIANT[],
): Promise<ReadonlyArray<Step.t>> => {
	return pipe(
		steps,
		A.map((x) => STEP_PRESET[x]),
	);
};

export const make = async ({
	sourceDir,
	unSafeBranchList,
	verbose,
	steps,
}: Config.t): Promise<t> => {
	const locale = await getLocale(getPlatform());
	return {
		packageManager: await PackageManager.get(verbose, locale),
		stagedFileList,
		TSFilesList,
		ProductTSFilesList,
		stat: Stat.getStat(),
		sourceDir,
		unSafeBranchList,
		safeBranch: pipe(unSafeBranchList, determineSafeBranch),
		locale,
		verbose,
		testFileExists: await isAnyTextFileExists(),
		availableCommands: collectScript() ?? [],
		steps: await loadSteps(steps),
	};
};
