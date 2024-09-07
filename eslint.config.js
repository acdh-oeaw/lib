import base from "@acdh-oeaw/eslint-config";
import gitignore from "eslint-config-flat-gitignore";

const config = [gitignore(), ...base];

export default config;
