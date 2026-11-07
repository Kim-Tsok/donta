# Public npm release

Versions 0.1.0 and 0.2.0 are public on npm. The project publishes two unscoped public packages:

- `donta-cli`: `npx donta-cli@latest create my-app`, `npx donta-cli@latest add .`, and the globally installed `donta` executable.
- `create-donta`: `npm create donta@latest my-app` and `npx create-donta@latest my-app`.

Both names must be available or owned by the publishing npm account. A registry 404 does not guarantee a name can be registered; npm decides that during publication.

Release 0.2.0 adds a shared coding-agent workflow and public npm download statistics.

## Prepare reviewed release artifacts

From the repository root, with dependencies installed:

```sh
npm run test:cli
npm run test:runtime
pnpm audit
pnpm typecheck
pnpm build
pnpm --dir packages/donta pack --pack-destination ../../release
pnpm --dir packages/create-donta pack --pack-destination ../../release
```

Pack these sequentially: both builders compile the shared database runtime. pnpm rewrites workspace dependency references in the packed manifest. The `prepack` scripts include the template, compiled runtime and setup assets. Each package includes its own MIT license.

Check the resulting tarballs, install them in a clean directory, and exercise both executables before publication. Do not include `.env.local`, local database directories, or npm credentials in the packages.

Audit a freshly generated app as well as the workspace: the generator's template dependencies are installed separately from the CLI. Verify that dependency overrides survive packing and work with the selected package manager. Passing tests or publishing successfully does not establish that a release is free of vulnerabilities.

## Publish the reviewed artifacts

Enable two-factor authentication on your npm account before publishing, then sign in and finish any browser verification required by npm. If you enable 2FA after signing in, your CLI session may need refreshing. Do not paste passwords or tokens into chat.

```sh
npm login --registry=https://registry.npmjs.org
npm whoami --registry=https://registry.npmjs.org
npm publish ./release/donta-cli-0.2.0.tgz --access public --registry=https://registry.npmjs.org
npm publish ./release/create-donta-0.2.0.tgz --access public --registry=https://registry.npmjs.org
```

These commands publish the already-reviewed tarballs, rather than rebuilding during the publishing step. Use the actual release version in the filenames for future releases. npm package versions are immutable; increment the affected version before shipping another release.

## Verify the public commands

From a directory outside this repository:

```sh
npm view donta-cli version
npm view create-donta version
npx --yes donta-cli@latest --version
npx --yes donta-cli@latest create my-public-test --skip-install
npm create donta@latest my-initializer-test -- --skip-install
```

Install dependencies in a generated project and verify its build and local migrations. Update the website's prepublication notices only after both registry commands succeed. Commit and deploy the documentation changes through the website's hosting workflow; publishing npm packages does not deploy the site.
