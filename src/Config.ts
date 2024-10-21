import fs from "node:fs";
import { D, F, G, O, flow, pipe } from "@mobily/ts-belt";
import { question, select } from "@topcli/prompts";
import chalk from "chalk";
import { P, match } from "ts-pattern";
import * as Decorator from "./Decorator";
import { STEPS_KIND, type STEPS_VARIANT } from "./Step.Preset";

export type t = {
	steps: (STEPS_VARIANT | [STEPS_VARIANT, string])[];
	unSafeBranchList: string[];
	sourceDir: string[];
	verbose: boolean;
};

const CONFIG_PATH = "tstw.config.json";

const fromJSONString = (json: string): O.Option<t> => {
	const parsedJSON = JSON.parse(json);
	const getArrayField = <T>(fieldName: string): O.Option<T[]> =>
		pipe(
			parsedJSON,
			D.get(fieldName),
			O.fromNullable,
			O.flatMap(O.fromPredicate(G.isArray)),
		);

	const steps: (STEPS_VARIANT | [STEPS_VARIANT, string])[] = pipe(
		"steps",
		getArrayField,
		O.flatMap(
			O.fromPredicate((stepsField) =>
				stepsField.every((x) =>
					match(x)
						.with(P.string, (x) => STEPS_KIND.includes(x))
						.with([P.string, P.string], ([step]) => STEPS_KIND.includes(step))
						.otherwise(() => false),
				),
			),
		),
	) as (STEPS_VARIANT | [STEPS_VARIANT, string])[];
	const unSafeBranchList = getArrayField<string>("unSafeBranchList");
	const sourceDir = getArrayField<string>("sourceDir");
	const verbose = pipe(
		parsedJSON.verbose,
		O.fromNullable,
		O.flatMap(O.fromPredicate(G.isBoolean)),
		O.getWithDefault(false),
	);

	return O.flatMap(steps, (steps) =>
		O.flatMap(unSafeBranchList, (unSafeBranchList) =>
			O.map(
				sourceDir,
				(sourceDir): t =>
					({
						steps,
						unSafeBranchList,
						sourceDir,
						verbose,
					}) as t,
			),
		),
	);
};

const toJson = (config: t): string => {
	return JSON.stringify(config);
};

const writeToFile = async (configJSON: string) => {
	Decorator.Line(`Writing config to ${CONFIG_PATH}`, chalk.yellow);
	await Bun.write(CONFIG_PATH, configJSON);
};

const readFromFile = async (path: string): Promise<O.Option<t>> => {
	try {
		const json = (await fs.promises.readFile(path)).toString();
		return fromJSONString(json);
	} catch (e) {
		return O.None;
	}
};

const askAndMake = async (): Promise<t> => {
	const askSteps = async (
		prevState: STEPS_VARIANT[],
	): Promise<STEPS_VARIANT[]> => {
		const AVAILABLE_KINDS = (STEPS_KIND as STEPS_VARIANT[])
			.filter((x) => x !== "_ALWAYS_FAILING_ONLY_FOR_TESTING")
			.filter((kind: STEPS_VARIANT) => !prevState.includes(kind));
		const userResponse = await select("Select steps to run", {
			choices: ["done", ...AVAILABLE_KINDS].map((kind: string) => ({
				value: kind,
				label: kind,
			})),
		});
		if (userResponse === "done") return prevState;
		return await askSteps([...prevState, userResponse] as STEPS_VARIANT[]);
	};

	const unSafeBranchResponse = (
		await question(
			"Enter unsafe branch list (space separated, regexes allowed)",
		)
	).split(" ");
	const sourceDirResponse = (
		await question("Enter source directory list (space separated)")
	).split(" ");
	const stepsResponse: t["steps"] = await askSteps([]);

	return {
		steps: stepsResponse,
		unSafeBranchList: unSafeBranchResponse,
		sourceDir: sourceDirResponse,
		verbose: false,
	};
};

export const load = async (): Promise<t> => {
	//TODO: Partially loaded config
	const loadedConfig = await readFromFile(CONFIG_PATH);
	if (O.isSome(loadedConfig)) return loadedConfig;
	return pipe(await askAndMake(), F.tap(flow(toJson, writeToFile)));
};
