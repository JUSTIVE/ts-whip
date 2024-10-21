import fs from "node:fs";
import { A, F, O, pipe } from "@mobily/ts-belt";
import { select } from "@topcli/prompts";
import { match } from "ts-pattern";
import { VerboseLog } from "./Decorator.js";
import Message from "./Message.js";

export type t = "npm" | "yarn" | "pnpm" | "bun";
export type PackageManagerExecutable = "npx" | "pnpx" | "bunx";

const toPackageManagerExecutable = (
	packageManager: t,
): PackageManagerExecutable =>
	match(packageManager)
		.returnType<PackageManagerExecutable>()
		.with("npm", () => "npx")
		.with("yarn", () => "npx") //no alternatives for yarn
		.with("bun", () => "bunx")
		.with("pnpm", () => "pnpx")
		.exhaustive();

export const getPackageManagerExecutor = (
	packageManager: t,
): PackageManagerExecutable =>
	pipe(
		O.fromPredicate<PackageManagerExecutable>(
			"bunx",
			() => process.argv0 === "bun",
		),
		O.getWithDefault(toPackageManagerExecutable(packageManager)),
	);

const determine = (): O.Option<t> => {
	return pipe(
		fs
			.readdirSync("./")
			.filter(
				(filename) => filename.includes("lock") || filename.includes("lockb"),
			),
		A.filterMap(fromLockFile),
	).at(-1);
};

const fromLockFile = (lockFileName: string): O.Option<t> =>
	match(lockFileName)
		.with("bun.lockb", F.always(O.Some("bun")))
		.with("package-lock.json", F.always(O.Some("npm")))
		.with("yarn.lock", F.always(O.Some("yarn")))
		.with("pnpm-lock.yaml", F.always(O.Some("pnpm")))
		.otherwise(F.always(O.None));

const make = (value: string): O.Option<t> =>
	O.fromPredicate(
		value,
		["bun", "npm", "yarn", "pnpm"].includes,
	) as O.Option<t>;

const askPackageManager = async (): Promise<t> => {
	const response = await select(Message.ASK_PACKAGE_MANAGER, {
		choices: [
			{ value: "bun", label: "bun" },
			{ value: "npm", label: "npm" },
			{ value: "yarn", label: "yarn" },
			{ value: "pnpm", label: "pnpm" },
		],
	});
	return pipe(response, make, O.getWithDefault(await askPackageManager()));
};

export const get = async (verbose: boolean): Promise<t> => {
	const packageManager = await match(determine())
		.when(O.isSome, F.identity<t>)
		.otherwise(async () => await askPackageManager());
	if (verbose) {
		VerboseLog(Message.PACKAGE_MANAGER_IS(packageManager));
	}
	return packageManager;
};
