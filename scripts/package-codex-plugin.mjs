import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const marketplaceRoot = path.join(repoRoot, "codex-marketplace");
const marketplacePath = path.join(marketplaceRoot, "marketplace.json");
const distOutputRoot = path.join(repoRoot, "dist", "pensieve-dashboard-plugin");
const repoPluginOutputRoot = path.join(
  marketplaceRoot,
  "plugins",
  "pensieve-dashboard-plugin"
);

export const PACKAGE_INCLUDE = [
  ".codex-plugin",
  "app",
  "components",
  "codex-marketplace",
  "data",
  "docs",
  "lib",
  "CODEX_PLUGIN_INSTALL.md",
  "LICENSE",
  "README.md",
  "README.zh-CN.md",
  "next-env.d.ts",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "postcss.config.js",
  "tailwind.config.ts",
  "tsconfig.json"
];

function normalizePathForManifest(relativePath) {
  return relativePath.replace(/\\/g, "/");
}

async function copyEntry(relativePath, outputRoot) {
  const sourcePath = path.join(repoRoot, relativePath);
  const destinationPath = path.join(outputRoot, relativePath);

  await cp(sourcePath, destinationPath, {
    recursive: true,
    force: true
  });
}

async function writePackageManifest(outputRoot) {
  const manifest = {
    packaged_at: new Date().toISOString(),
    plugin_name: "pensieve-dashboard-plugin",
    source_root: repoRoot,
    output_root: outputRoot,
    marketplace_path: marketplacePath,
    included_paths: PACKAGE_INCLUDE.map(normalizePathForManifest)
  };

  await writeFile(
    path.join(outputRoot, "PLUGIN_PACKAGE_MANIFEST.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
}

export async function packageCodexPlugin() {
  await rm(distOutputRoot, { recursive: true, force: true });
  await rm(repoPluginOutputRoot, { recursive: true, force: true });
  await mkdir(distOutputRoot, { recursive: true });
  await mkdir(repoPluginOutputRoot, { recursive: true });

  for (const relativePath of PACKAGE_INCLUDE) {
    await copyEntry(relativePath, distOutputRoot);
  }

  for (const relativePath of PACKAGE_INCLUDE) {
    if (relativePath === "codex-marketplace") {
      continue;
    }

    await copyEntry(relativePath, repoPluginOutputRoot);
  }

  await writePackageManifest(distOutputRoot);
  await writePackageManifest(repoPluginOutputRoot);

  return {
    distOutputRoot,
    repoPluginOutputRoot,
    marketplacePath,
    includedCount: PACKAGE_INCLUDE.length
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (invokedPath === __filename) {
  packageCodexPlugin()
    .then((result) => {
      process.stdout.write(
        [
          `Packaged ${result.includedCount} entries into ${result.distOutputRoot}`,
          `Synced installable plugin into ${result.repoPluginOutputRoot}`,
          `Marketplace manifest ready at ${result.marketplacePath}`
        ].join("\n") + "\n"
      );
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
