// CI gate: fails if src/generated.ts is out of sync with the OpenAPI spec.
//
// The whole point of generating is that a new backend endpoint reaches the SDK
// by regenerating rather than by someone remembering to hand-write it in two
// languages. Without this gate that guarantee is aspirational — the SDKs drifted
// to 5 of 12+ endpoint families exactly that way.
//
// GOTCHA (mirrors form4api-mcp): on Windows this can false-drift AFTER a commit,
// because git's autocrlf rewrites the working copy to CRLF while freshly
// generated output is LF. The tell is a reported drift with an EMPTY diff body.
// Verify locally with `git diff --ignore-cr-at-eol`; Linux CI is the source of
// truth.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const OUTPUT_PATH = path.join(REPO_ROOT, 'src/generated.ts')

const before = await fs.readFile(OUTPUT_PATH, 'utf8').catch(() => null)
if (before === null) {
  console.error('src/generated.ts is missing. Run `npm run codegen`.')
  process.exit(1)
}

execFileSync(process.execPath, [path.join(__dirname, 'generate.mjs')], { stdio: 'inherit' })

const after = await fs.readFile(OUTPUT_PATH, 'utf8')

// Compare ignoring line endings, so the CRLF trap above cannot produce a
// spurious CI failure while still catching every real content change.
const normalise = (s) => s.replace(/\r\n/g, '\n')

if (normalise(before) !== normalise(after)) {
  await fs.writeFile(OUTPUT_PATH, before, 'utf8') // leave the tree as we found it
  console.error(
    '\nsrc/generated.ts is out of date with the OpenAPI spec.\n' +
      'Run `npm run codegen` and commit the result.\n',
  )
  process.exit(1)
}

console.log('src/generated.ts is in sync with the spec.')
