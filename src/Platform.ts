export type Platform =
	| "aix"
	| "darwin"
	| "freebsd"
	| "linux"
	| "openbsd"
	| "sunos"
	| "win32"
	| "android";

export const getPlatform = (): Platform => process.platform as Platform;
