import wcswidth from "@topcli/wcwidth";
import chalk, { ChalkInstance } from "chalk";
export const Box = (message: string, colorChalk: ChalkInstance) => {
	const messageLength = wcswidth(message);
	const boxBar = new Array(messageLength).fill("━").join("");

	console.log(colorChalk(`\n┏━${boxBar}━┓`));
	console.log(`${colorChalk("┃")} ${message} ${colorChalk("┃")}`);
	console.log(colorChalk(`┗━${boxBar}━┛\n`));
};

export const Line = (message: string, colorChalk: ChalkInstance) => {
	console.log(colorChalk(message));
};

export const VerboseLog = (message: string) => {
	Line(`verbose:: ${message}`, chalk.gray);
};
