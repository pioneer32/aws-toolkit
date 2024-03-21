const { execSync } = require("child_process");

const localBranchState = execSync(`git status -uno`).toString();

if (!localBranchState.match(/branch is up to date/i)) {
  // eslint-disable-next-line no-console
  console.log(localBranchState);
  process.exit(1);
}

const packageName = "@pioneer32/data-mapper";

module.exports = {
  hooks: {
    "before:init": ["npm run typecheck", "npm run test"],
    // eslint-disable-next-line no-template-curly-in-string
    // 'after:bump': [`yarn --cwd="${urlPrefix ? '../../..' : '../..'}" run fix-missing-dev-dependencies --package "\${name}" --version "\${version}"`],
  },
  git: {
    requireCleanWorkingDir: true,
    requireBranch: "main",
    push: true,
    tagName: `${packageName}@\${version}`,
    tagAnnotation: `Release ${packageName}@\${version}`,
    commitMessage: `Release ${packageName}@\${version}`,
  },
  npm: {
    publish: true,
    publishPath: ".",
    timeout: 60, // secs
    versionArgs: ["--workspaces-update=false"],
  },
  plugins: {
    "@release-it/keep-a-changelog": {
      filename: "CHANGELOG.md",
      addUnreleased: true,
    },
  },
};
