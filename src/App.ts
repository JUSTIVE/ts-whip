import { exec } from "node:child_process";
import { exit } from "node:process";
import { A, O, pipe } from "@mobily/ts-belt";
import { Spinner } from "@topcli/spinner";
import chalk from "chalk";
import { match } from "ts-pattern";
import * as Config from "./Config";
import * as Decorator from "./Decorator";
import * as EnvSet from "./EnvSet";
import Message from "./Message";
import * as Stat from "./Stat";
import * as Step from "./Step";

type Running = EnvSet.t;
type Exit = number;
type Program = Running | Exit;

const flatMap = (f: (prev: Running) => Program) => (prevResult: Program) => {
	return typeof prevResult === "number" ? prevResult : f(prevResult);
};

const get = (program: Program): EnvSet.t => {
	return typeof program === "number" ? process.exit(program) : program;
};

const exitWhenNoStagedFiles = (envSet: EnvSet.t): Program => {
	if (A.isEmpty(envSet.stagedFileList)) {
		Decorator.Box(Message.NO_STAGED_FILES, chalk.cyan);
		return 0;
	}
	return envSet;
};

const notifyNoTSFiles = (envSet: EnvSet.t): Program => {
	if (envSet.TSFilesList.length === 0) {
		Decorator.Box(Message.NO_TYPESCRIPT_FILES, chalk.cyan);
	} else {
		if (envSet.ProductTSFilesList.length === 0) {
			Decorator.Box(Message.NO_PRODUCT_TYPESCRIPT_FILES, chalk.cyan);
		}
	}
	return envSet;
};

const runSteps =
	async (steps: ReadonlyArray<Step.t>) => async (envSet: EnvSet.t) => {
		const promises = steps.filter((step) =>
			match(step.id)
				.with("BUILD", () => envSet.safeBranch)
				.otherwise(() => true),
		);
		const results = await Promise.allSettled(
			promises.map((step) => Step.runner(step, envSet)),
		);
		Spinner.reset();
		return results;
	};

const runStep = (step: Step.t, envSet: EnvSet.t) => {
	return new Promise<null>((resolve) => {
		const recommendedAction = Step.getRecommendedAction(envSet, step);
		const command = exec(recommendedAction, (stdout, stderr) => {
			console.log(stdout);
			console.log(stderr);
		});
		command.on("exit", () => {
			resolve(null);
		});
	});
};

const runFirstFailedStep = async (
	steps: ReadonlyArray<Step.t>,
	envSet: EnvSet.t,
	results: PromiseSettledResult<Step.StepResult>[],
) => {
	Decorator.Box(Message.RETRY_COMMAND, chalk.hex("#FF7900"));
	const failedStep =
		steps[results.findIndex((result) => result.status === "rejected")];
	return O.map(failedStep, async (step) => await runStep(step, envSet));
};

const program = async (envSet: EnvSet.t): Promise<number> => {
	Stat.Log(envSet.stat);
	const { steps } = envSet;
	const results = await pipe(
		envSet,
		exitWhenNoStagedFiles,
		flatMap(notifyNoTSFiles),
		get,
		await runSteps(steps),
	);

	if (results.some(({ status }) => status === "rejected")) {
		Decorator.Box(Message.CANNOT_COMMIT, chalk.red);
		await runFirstFailedStep(steps, envSet, results);
		return 1;
	}
	Decorator.Box(Message.CAN_COMMIT, chalk.green);
	return 0;
};

const config = await Config.load();
const envSet = await EnvSet.make(config);
const result = await program(envSet);
exit(result);
