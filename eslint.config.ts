import base from "@acdh-oeaw/eslint-config";
import node from "@acdh-oeaw/eslint-config-node";
import { defineConfig } from "eslint/config";
import gitignore from "eslint-config-flat-gitignore";

export default defineConfig(gitignore({ strict: false }), base, node);
