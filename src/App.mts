import { exec } from "child_process";
import chalk from "chalk";
import * as EnvSet from "./EnvSet.mjs";
import * as Step from "./Step.mjs";
import { Spinner } from "@topcli/spinner";
import * as Stat from "./Stat.mjs";
import * as Decorator from "./Decorator.mjs";
import { pipe } from "effect";
import * as Config from "./Config.js";
import { match } from 'ts-pattern';

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
	const message = match(envSet.locale)
	.with("en-US",()=>`There are no staged files. Exit.`)
	.with("ko-KR",()=>`스테이징된 파일이 없어 종료합니다.`)
	.with("ja-JP",()=>`ステージングされたファイルがないので、終了します。`)
	.exhaustive()

  if (envSet.stagedFileList.length === 0) {
    Decorator.Box(message, chalk.cyan);
    return 0;
  }
  return envSet;
};

const notifyNoTSFiles = (envSet: EnvSet.t): Program => {
	const noTSSkipMessage = match(envSet.locale)
	.with("en-US",()=>`There are no TypeScript files. Skip some steps.`)
	.with("ko-KR",()=>`타입스크립트 파일이 없어 일부 단계를 건너뜁니다.`)
	.with("ja-JP",()=>`TypeScriptファイルがないので、一部のステップをスキップします。`)
	.exhaustive()

	const noProductTSMessage = match(envSet.locale)
	.with("en-US",()=>`There are no production TypeScript files. Skip some steps.`)
	.with("ko-KR",()=>`프로덕션 타입스크립트 파일이 없어 일부 단계를 건너뜁니다.`)
	.with("ja-JP",()=>`プロダクションTypeScriptファイルがないので、一部のステップをスキップします。`)
	.exhaustive()

  if (envSet.TSFilesList.length === 0) {
    Decorator.Box(
      noTSSkipMessage,
      chalk.cyan,
    );
  } else {
    if (envSet.ProductTSFilesList.length === 0) {
      Decorator.Box(
        noProductTSMessage,
        chalk.cyan,
      );
    }
  }
  return envSet;
};

const runSteps = async (steps: ReadonlyArray<Step.t>) => async (envSet: EnvSet.t) => {
  const promises = steps.filter(
		step=>{
			return match(step.id)
			.with("BUILD",()=>(envSet.safeBranch))
			.otherwise(()=>true)
		}
  );
  const results = await Promise.allSettled(
    promises.map((step) => Step.runner(step, envSet)),
  );

  Spinner.reset();
  return results;
};

const runStep = (step: Step.t, envSet: EnvSet.t) => {
  return new Promise((resolve) => {
    const recommendedAction = Step.getRecommendedAction(envSet, step);
    const command = exec(recommendedAction, (error, stdout, stderr) => {
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
	const message = match(envSet.locale)
	.with("en-US",()=>`Run the first failed command again`)
	.with("ko-KR",()=>`실패한 첫 번째 명령어를 다시 실행합니다`)
	.with("ja-JP",()=>`最初に失敗したコマンドを再実行します`)
	.exhaustive()

  Decorator.Box(
    message,
    chalk.hex("#FF7900"),
  );
  const failedIndex = results.findIndex(
    (result) => result.status === "rejected",
  );
  return await runStep(steps[failedIndex], envSet);
};

const program = async (envSet: EnvSet.t) => {
  Stat.Log(envSet.stat,envSet.locale);
  const {steps} = envSet
  const results = await pipe(
    envSet,
    exitWhenNoStagedFiles,
    flatMap(notifyNoTSFiles),
    get,
    await runSteps(steps),
  );

  const COMMITABLE_STATE =
    results.filter(({ status }) => status === "rejected").length === 0
      ? "Commitable"
      : "NotCommitable";

  if (COMMITABLE_STATE === "NotCommitable") {
		const cannotCommitMessage = match(envSet.locale)
		.with("en-US",()=>`Cannot commit`)
		.with("ko-KR",()=>`커밋할 수 없습니다`)
		.with("ja-JP",()=>`コミットできません`)
		.exhaustive()
    Decorator.Box(cannotCommitMessage, chalk.red);
    await runFirstFailedStep(steps, envSet, results);
    process.exit(1);
  } else {
		const canCommitMessage = match(envSet.locale)
		.with("en-US",()=>`You can commit`)
		.with("ko-KR",()=>`커밋할 수 있습니다`)
		.with("ja-JP",()=>`コミットできます`)
		.exhaustive()
    Decorator.Box(canCommitMessage, chalk.green);
    process.exit(0);
  }
};

await pipe(await EnvSet.make(await Config.load()), await program);
