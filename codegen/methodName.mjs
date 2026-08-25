// Deriving a generated method's name from its operationId.
//
// Its own module, and not a private helper inside generate.mjs, for one
// reason: generate.mjs calls main() at import time, so nothing can import it
// to test a function. The rule is load-bearing enough to need a test — a name
// derived wrong still ships, someone imports it, and fixing it afterwards is a
// breaking rename.

/** Leading verbs stripped before a name is derived. Order matters: longest first. */
const VERB_PREFIXES = ['Explain', 'Create', 'Delete', 'Export', 'Submit', 'List', 'Get']

/**
 * PascalCase word split: "GetInsiderDirectory" → Get, Insider, Directory.
 *
 * Trailing digits stay attached to the word they belong to, so "Form144" is
 * one word rather than "Form" + "144". Splitting them apart meant neither half
 * matched a resource called `form144`, and ListForm144 derived to `form144()`
 * instead of `list()` — masked today only because that name is pinned as an
 * override.
 */
export function wordsOf(s) {
  return s.match(/[A-Z][a-z]*[0-9]*|[0-9]+/g) ?? []
}

/**
 * Method name for an operation with no override.
 *
 * Strips the leading verb, then drops any word naming the resource the method
 * already lives on — `filings.getRecentFilings()` says "filings" three times.
 * What is left is the method: ListFilings on `filings` → `list()`,
 * GetInsiderDirectory on `insiders` → `directory()`. When nothing is left, the
 * verb IS the name, which is how `companies.list()` and `filings.get()` read.
 *
 * Matching is exact-or-simple-plural on purpose. A looser prefix test would
 * strip "Sentiment" for a resource called "signals" the moment someone made it
 * fuzzy, and silently produce `signals.get()` for two different endpoints.
 */
export function deriveMethodName(operationId, resource) {
  const verb = VERB_PREFIXES.find((v) => operationId.startsWith(v)) ?? ''
  const resourceWords = (resource.match(/[A-Z]?[a-z0-9]+/g) ?? []).map((w) => w.toLowerCase())
  const isResourceWord = (w) => {
    const lw = w.toLowerCase()
    return resourceWords.some((r) => r === lw || r === `${lw}s` || lw === `${r}s`)
  }
  const kept = wordsOf(operationId.slice(verb.length)).filter((w) => !isResourceWord(w))
  if (kept.length === 0) return (verb || 'get').toLowerCase()
  return kept.map((w, i) => (i === 0 ? w[0].toLowerCase() + w.slice(1) : w)).join('')
}

