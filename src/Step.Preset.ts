import type * as EnvSet from "./EnvSet.js";
import Message from "./Message.js";
import * as PackageManager from "./PackageManager.js";
import * as PostAction from "./PostAction.js";
import * as SkipCondition from "./SkipCondition.js";
import type * as Step from "./Step.js";

const _ALWAYS_FAILING_ONLY_FOR_TESTING: Step.t = {
	id: "_ALWAYS_FAILING_ONLY_FOR_TESTING",
	emoji: "🚨",
	name: Message.ALWAYS_FAILING_ONLY_FOR_TESTING,
	command: () => 'echo "error" && exit 123',
};

const BRANCH_CHECKING: Step.t = {
	id: "BRANCH_CHECKING",
	emoji: "🌲",
	name: Message.BRANCH_CHECKING,
	command: ({ safeBranch }) => `exit ${safeBranch ? 0 : 1}`,
	errorMessage: Message.BRANCH_CHECKING_ERROR,
	expectedExitCode: 0,
};

const FORMAT_TYPESCRIPT_FILES: Step.t = {
	id: "FORMAT_TYPESCRIPT_FILES",
	emoji: "💅",
	name: Message.FORMAT_TYPESCRIPT_FILES,
	command: ({ TSFilesList }: EnvSet.t) =>
		`${TSFilesList} | xargs prettier --write --loglevel silent`,
	recommendedAction: ({ TSFilesList }) =>
		`${TSFilesList} | xargs prettier --write`,
	skipCondition: [SkipCondition.NO_TYPESCRIPT_FILES],
	postAction: PostAction.STAGE_TS_FILES,
};

const ESLINT_CHECKING: Step.t = {
	id: "ESLINT_CHECKING",
	emoji: "📏",
	name: Message.LINT_CHECKING,
	command: ({ packageManager, sourceDir }) =>
		`${PackageManager.getPackageManagerExecutor(
			packageManager,
		)} eslint --ext .ts --ext .tsx --ext .mts --ext .mtsx ${sourceDir.join(
			" ",
		)} --fix`,
	skipCondition: [SkipCondition.NO_PRODUCT_TYPESCRIPT_FILES],
};

const TYPE_CHECKING: Step.t = {
	id: "TYPE_CHECKING",
	emoji: "🔍",
	name: Message.TYPE_CHECKING,
	command: ({ packageManager }) => `${packageManager} tsc -p . --noEmit`,
	skipCondition: [SkipCondition.NO_PRODUCT_TYPESCRIPT_FILES],
};

const BUILD: Step.t = {
	id: "BUILD",
	emoji: "🏗️ ",
	name: Message.BUILD_CHECKING,
	command: ({ packageManager }) => `${packageManager} run build`,
	skipCondition: [
		SkipCondition.NO_PRODUCT_TYPESCRIPT_FILES,
		SkipCondition.NO_COMMAND("build"),
	],
};

const TEST: Step.t = {
	id: "TEST",
	emoji: "🧪",
	name: Message.EXECUTE_TEST,
	command: ({ packageManager }) => `${packageManager} run test`,
	skipCondition: [
		SkipCondition.NO_PRODUCT_TYPESCRIPT_FILES,
		SkipCondition.NO_COMMAND("test"),
		SkipCondition.NO_TEST_FILES,
	],
};

export const STEP_PRESET = {
	_ALWAYS_FAILING_ONLY_FOR_TESTING,
	BRANCH_CHECKING,
	ESLINT_CHECKING,
	FORMAT_TYPESCRIPT_FILES,
	TYPE_CHECKING,
	BUILD,
	TEST,
};

export const STEPS_KIND = Object.keys(STEP_PRESET);
export type STEPS_VARIANT = keyof typeof STEP_PRESET;
