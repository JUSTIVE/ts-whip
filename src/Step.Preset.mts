import * as SkipCondition from "./SkipCondition.mjs";
import * as PostAction from "./PostAction.mjs";
import * as EnvSet from "./EnvSet.mjs";
import * as Step from "./Step.mjs";
import * as PackageManager from "./PackageManager.mjs";
import { match } from 'ts-pattern';

const _ALWAYS_FAILING_ONLY_FOR_TESTING: Step.t = {
	id:"_ALWAYS_FAILING_ONLY_FOR_TESTING",
  emoji: "🚨",
  name: (locale)=>{
		return match(locale)
		.with("en-US", ()=>"Always Failing (Only for testing)")
		.with("ko-KR",()=>"항상 실패 (테스트용)")
		.with("ja-JP",()=>"常に失敗 (テスト用)")
		.exhaustive()
	},
  command: () => 'echo "error" && exit 123',
};

const BRANCH_CHECKING: Step.t = {
	id:"BRANCH_CHECKING",
  emoji: "🌲",
  name: (locale)=>{
		return match(locale)
		.with("en-US", ()=>"Branch Checking")
		.with("ko-KR",()=>"브랜치 확인")
		.with("ja-JP",()=>"ブランチ確認")
		.exhaustive()
	},
  command: ({ safeBranch }) => `exit ${safeBranch ? 0 : 1}`,
  errorMessage: (locale)=>{
		return match(locale)
		.with("en-US", ()=>"You are not on a safe branch. Please checkout to a safe branch")
		.with("ko-KR",()=>"위험한 브랜치에 커밋을 하고 있습니다. 다른 브랜치에서 작업해 주세요")
		.with("ja-JP",()=>"危険なブランチでコミットしています。安全なブランチにチェックアウトしてください")
		.exhaustive()
	},
  expectedExitCode: 0,
};

const FORMAT_TYPESCRIPT_FILES: Step.t = {
	id:"FORMAT_TYPESCRIPT_FILES",
  emoji: "💅",
  name: (locale)=>{
		return match(locale)
		.with("en-US", ()=>"Formatting staged files")
		.with("ko-KR",()=>"스테이징된 파일들을 포맷팅합니다")
		.with("ja-JP",()=>"ステージングされたファイルをフォーマットします")
		.exhaustive()
	},
  command: ({ TSFilesList }: EnvSet.t) =>
    `${TSFilesList} | xargs prettier --write --loglevel silent`,
  recommendedAction: ({ TSFilesList }) =>
    `${TSFilesList} | xargs prettier --write`,
  skipCondition: [SkipCondition.NO_TYPESCRIPT_FILES],
  postAction: PostAction.STAGE_TS_FILES,
};

const ESLINT_CHECKING: Step.t = {
	id:"ESLINT_CHECKING",
  emoji: "📏",
  name: (locale)=> 
		match(locale)
		.with("en-US", ()=>"Lint Checking")
		.with("ko-KR",()=>"린트 체크")
		.with("ja-JP",()=>"リントチェック")
		.exhaustive(),
  command: ({packageManager, sourceDir }) =>
    `${PackageManager.toPackageManagerExecutable(packageManager)} eslint --ext .ts --ext .tsx --ext .mts --ext .mtsx ${sourceDir.join(
      " ",
    )} --fix`,
  skipCondition: [SkipCondition.NO_PRODUCT_TYPESCRIPT_FILES],
};

const TYPE_CHECKING: Step.t = {
	id:"TYPE_CHECKING",
  emoji: "🔍",
  name: (locale)=>
		match(locale)
		.with("en-US", ()=>"Type Checking")
		.with("ko-KR",()=>"타입 체크")
		.with("ja-JP",()=>"型チェック")
		.exhaustive(),
  command: ({ packageManager }) => `${packageManager} tsc -p . --noEmit`,
  skipCondition: [SkipCondition.NO_PRODUCT_TYPESCRIPT_FILES],
};

const BUILD: Step.t = {
	id:"BUILD",
  emoji: "🏗️ ",
  name: (locale)=>
		match(locale)
		.with("en-US", ()=>"Build Checking")
		.with("ko-KR",()=>"빌드 체크")
		.with("ja-JP",()=>"ビルドチェック")
		.exhaustive(),
  command: ({ packageManager }) => `${packageManager} run build`,
  skipCondition: [SkipCondition.NO_PRODUCT_TYPESCRIPT_FILES,SkipCondition.NO_COMMAND("build")],
};

const TEST:Step.t = {
	id:"TEST",
	emoji: "🧪",
	name: (locale)=>
		match(locale)
		.with("en-US", ()=>"Execute Test")
		.with("ko-KR",()=>"테스트 실행")
		.with("ja-JP",()=>"テスト実行")
		.exhaustive(),
	command: ({ packageManager }) => `${packageManager} run test`,
	skipCondition: [SkipCondition.NO_PRODUCT_TYPESCRIPT_FILES, SkipCondition.NO_COMMAND("test")],		
}

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
