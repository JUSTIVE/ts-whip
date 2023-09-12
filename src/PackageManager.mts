

import { select } from "@topcli/prompts";
import { pipe } from "effect/Function";
import fs from "fs";
import { match } from "ts-pattern";
import { VerboseLog } from "./Decorator.mjs";
import { Locales } from './Locales';
import { A, F, O } from '@mobily/ts-belt';

export type t = "npm" | "yarn" | "pnpm" |"bun";
export type PackageManagerExecutable = "npx" | "pnpx" | "bunx";

const toPackageManagerExecutable = (packageManager:t):PackageManagerExecutable =>
   match(packageManager)
  .returnType<PackageManagerExecutable>()
  .with("npm",()=>"npx")
  .with("yarn",()=>"npx")//no alternatives for yarn
  .with("bun",()=>"bunx")
  .with("pnpm",()=>"pnpx")
  .exhaustive()


export const getPackageManagerExecutor = (packageManager:t):PackageManagerExecutable=>
  pipe(
    O.fromPredicate<PackageManagerExecutable>("bunx",()=>process.argv0==='bun'),
    O.getWithDefault(toPackageManagerExecutable(packageManager))
  )

const determine = (): O.Option<t> => {
  return pipe(
    fs
      .readdirSync("./")
      .filter((filename) => filename.includes("lock")||filename.includes("lockb")),
    A.filterMap(fromLockFile),
    A.reverse,
    A.get(0)
  );
};

const fromLockFile = (lockFileName:string):O.Option<t>=>
  match(lockFileName)
  .with("bun.lockb",F.always(O.Some("bun")))
  .with("package-lock.json", F.always(O.Some("npm")))
  .with("yarn.lock", F.always(O.Some("yarn")))
  .with("pnpm-lock.yaml", F.always(O.Some("pnpm")))
  .otherwise(F.always(O.None))

const make = (value:string):O.Option<t> => (
  pipe(
    value,
    O.fromPredicate(['bun', 'npm', 'yarn', 'pnpm'].includes)
  ) as O.Option<t>
)

const askPackageManager = async (locale:Locales): Promise<t> => {
  const questionPrompt = match(locale)
  .with("en-US", F.always("Select your package manager"))
  .with("ko-KR", F.always("패키지 매니저를 선택하세요."))
  .with("ja-JP", F.always("パッケージマネージャーを選択してください。"))
  .exhaustive()
  const response = await select(questionPrompt, {
    choices: [
      { value: "bun", label:"bun"},
      { value: "npm", label: "npm" },
      { value: "yarn", label: "yarn" },
      { value: "pnpm", label: "pnpm" },
    ],
  });
  return pipe(
    response,
    make,
    O.getWithDefault(await askPackageManager(locale))
  )
};

export const get = async (verbose: boolean,locale:Locales): Promise<t> => {
  const packageManager = match(determine())
    .when(O.isSome,F.identity<t>)
    .otherwise(async ()=>await askPackageManager(locale))
  
  
  if (verbose){
    const message = match(locale)
    .with("en-US", F.always(`Detected Package Manager is ${packageManager}`))
    .with("ko-KR", F.always(`패키지 매니저는 ${packageManager} 입니다.`))
    .with("ja-JP", F.always(`パッケージマネージャーは${packageManager}です。`))
    .exhaustive()
    VerboseLog(message)
  }

  return packageManager;
};
