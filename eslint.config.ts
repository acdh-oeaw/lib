import base from "@acdh-oeaw/eslint-config";
import node from "@acdh-oeaw/eslint-config-node";
import gitignore from "eslint-config-flat-gitignore";
import { config } from "typescript-eslint";

export default config([gitignore(), ...base, ...node]);
