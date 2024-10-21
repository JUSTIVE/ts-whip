import { type Locales, getLocale } from "./Locales";
import { getPlatform } from "./Platform";

type strResourceKey = {
	NO_STAGED_FILES: string;
	NO_PRODUCT_TYPESCRIPT_FILES: string;
	NO_TYPESCRIPT_FILES: string;
	PACKAGE_MANAGER_IS: (x: string) => string;
	ASK_PACKAGE_MANAGER: string;
	RETRY_COMMAND: string;
	TOO_MANY_CHANGES: string;
	STAGED_FILES: string;
	ADDED: string;
	DELETED: string;
	FILENAME: string;
	TOTAL_ADDED: string;
	TOTAL_DELETED: string;
	TOO_MANY_CHANGES_LABEL: string;
	CANNOT_COMMIT: string;
	CAN_COMMIT: string;
	ALWAYS_FAILING_ONLY_FOR_TESTING: string;
	BRANCH_CHECKING: string;
	BRANCH_CHECKING_ERROR: string;
	FORMAT_TYPESCRIPT_FILES: string;
	LINT_CHECKING: string;
	TYPE_CHECKING: string;
	BUILD_CHECKING: string;
	EXECUTE_TEST: string;
};

const ko: strResourceKey = {
	NO_STAGED_FILES: "스테이징된 파일이 없어 종료합니다.",
	NO_TYPESCRIPT_FILES: "타입스크립트 파일이 없어 일부 단계를 건너뜁니다.",
	NO_PRODUCT_TYPESCRIPT_FILES:
		"프로덕션 타입스크립트 파일이 없어 일부 단계를 건너뜁니다.",
	PACKAGE_MANAGER_IS: (pm) => `패키지 매니저는 ${pm} 입니다.`,
	ASK_PACKAGE_MANAGER: "패키지 매니저를 선택하세요.",
	RETRY_COMMAND: "실패한 첫 번째 명령어를 다시 실행합니다",
	TOO_MANY_CHANGES: "너무 많은 변경이 있습니다",
	STAGED_FILES: "스테이징된 파일",
	ADDED: "추가됨",
	DELETED: "삭제됨",
	FILENAME: "파일명",
	TOTAL_ADDED: "총 추가됨",
	TOTAL_DELETED: "총 삭제됨",
	TOO_MANY_CHANGES_LABEL: "너무 많은 변경이 있습니다!!!",
	CANNOT_COMMIT: "커밋할 수 없습니다",
	CAN_COMMIT: "커밋할 수 있습니다",
	ALWAYS_FAILING_ONLY_FOR_TESTING: "항상 실패 (테스트용)",
	BRANCH_CHECKING: "브랜치 확인",
	BRANCH_CHECKING_ERROR:
		"위험한 브랜치에 커밋을 하고 있습니다. 다른 브랜치에서 작업해 주세요",
	FORMAT_TYPESCRIPT_FILES: "스테이징된 파일들을 포맷팅합니다",
	LINT_CHECKING: "린트 체크",
	TYPE_CHECKING: "타입 체크",
	BUILD_CHECKING: "빌드 체크",
	EXECUTE_TEST: "테스트 실행",
};

const ja: strResourceKey = {
	NO_STAGED_FILES: "ステージングされたファイルがないので、終了します。",
	NO_TYPESCRIPT_FILES:
		"TypeScriptファイルがないので、一部のステップをスキップします。",
	NO_PRODUCT_TYPESCRIPT_FILES:
		"プロダクションTypeScriptファイルがないので、一部のステップをスキップします。",
	PACKAGE_MANAGER_IS: (pm) => `パッケージマネージャーは${pm}です。`,
	ASK_PACKAGE_MANAGER: "パッケージマネージャーを選択してください。",
	RETRY_COMMAND: "最初に失敗したコマンドを再実行します",
	TOO_MANY_CHANGES: "多すぎる変更",
	STAGED_FILES: "ステージングされたファイル",
	ADDED: "追加",
	DELETED: "削除",
	FILENAME: "ファイル名",
	TOTAL_ADDED: "合計追加",
	TOTAL_DELETED: "合計削除",
	TOO_MANY_CHANGES_LABEL: "多すぎる変更があります!!!",
	CANNOT_COMMIT: "コミットできません",
	CAN_COMMIT: "コミットできます",
	ALWAYS_FAILING_ONLY_FOR_TESTING: "常に失敗 (テスト用)",
	BRANCH_CHECKING: "ブランチ確認",
	BRANCH_CHECKING_ERROR:
		"危険なブランチでコミットしています。安全なブランチにチェックアウトしてください",
	FORMAT_TYPESCRIPT_FILES: "ステージングされたファイルをフォーマットします",
	LINT_CHECKING: "リントチェック",
	TYPE_CHECKING: "型チェック",
	BUILD_CHECKING: "ビルドチェック",
	EXECUTE_TEST: "テスト実行",
};

const en: strResourceKey = {
	NO_STAGED_FILES: "There are no staged files. Exit.",
	NO_TYPESCRIPT_FILES: "There are no TypeScript files. Skip some steps.",
	NO_PRODUCT_TYPESCRIPT_FILES:
		"There are no production TypeScript files. Skip some steps.",
	PACKAGE_MANAGER_IS: (pm) => `Detected Package Manager is ${pm}`,
	ASK_PACKAGE_MANAGER: "Select your package manager",
	RETRY_COMMAND: "Run the first failed command again",
	TOO_MANY_CHANGES: "Too many changes",
	STAGED_FILES: "Staged Files",
	ADDED: "added",
	DELETED: "deleted",
	FILENAME: "filename",
	TOTAL_ADDED: "total added",
	TOTAL_DELETED: "total deleted",
	TOO_MANY_CHANGES_LABEL: "Too many changes!!!",
	CANNOT_COMMIT: "Cannot commit",
	CAN_COMMIT: "You can commit",
	ALWAYS_FAILING_ONLY_FOR_TESTING: "Always Failing (Only for testing)",
	BRANCH_CHECKING: "Branch Checking",
	BRANCH_CHECKING_ERROR:
		"You are not on a safe branch. Please checkout to a safe branch",
	FORMAT_TYPESCRIPT_FILES: "Formatting staged files",
	LINT_CHECKING: "Lint Checking",
	TYPE_CHECKING: "Type Checking",
	BUILD_CHECKING: "Build Checking",
	EXECUTE_TEST: "Execute Test",
};

const strResource: Record<Locales, strResourceKey> = {
	"en-US": en,
	"ko-KR": ko,
	"ja-JP": ja,
} as const;

let localeCache: Locales | null = null;
const getLocale_ = async (): Promise<Locales> => {
	if (localeCache) return localeCache;
	const locale = await getLocale(getPlatform());
	localeCache = locale;
	return locale;
};
export default strResource[await getLocale_()];
