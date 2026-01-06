import base from "@acdh-oeaw/eslint-config";
import node from "@acdh-oeaw/eslint-config-node";
import gitignore from "eslint-config-flat-gitignore";
import { defineConfig } from "eslint/config";

export default defineConfig(gitignore({ strict: false }), base, node);
