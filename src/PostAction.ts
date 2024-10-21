import { execSync } from "node:child_process";
import type * as EnvSet from "./EnvSet.js";
export type t = (x: EnvSet.t) => void;
export const STAGE_TS_FILES: t = ({ TSFilesList }) => {
	TSFilesList.map((filename: string) => {
		execSync(`git add ${filename}`);
	});
};
