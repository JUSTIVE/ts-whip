import { execSync } from "child_process";
import { O, pipe } from "@mobily/ts-belt";
import { osLocaleSync } from "os-locale";
import { P, match } from "ts-pattern";
import { Platform } from "./Platform";

export type Locales = "en-US" | "ko-KR" | "ja-JP";

export const makeLocale = (value: string): O.Option<Locales> =>
	match(value)
		.with(P.string.startsWith("en"), () => O.Some("en-US"))
		.with(P.string.startsWith("ko"), () => O.Some("ko-KR"))
		.with(P.string.startsWith("ja"), () => O.Some("ja-JP"))
		.otherwise(() => O.None);

export const getLocale = async (platform: Platform): Promise<Locales> => {
	const getLocaleStringByPlatform: O.Option<string> = match(platform)
		.with("darwin", () =>
			pipe(execSync("defaults read -g AppleLocale"), (buffer) =>
				buffer.toString(),
			),
		)
		.otherwise(() => osLocaleSync());
	return pipe(
		getLocaleStringByPlatform,
		O.fromNullable,
		O.flatMap(makeLocale),
		O.getWithDefault<Locales>("en-US"),
	);
};
