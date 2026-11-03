# Placket starter

Drop this folder into the repo (github.com/debajit13/placket) beside the LICENSE. It holds the documents Claude Code builds from; no code yet.

```
CLAUDE.md               how Claude Code works in this repo (read every session)
docs/PRD.md             the full product requirements and build plan
docs/MOBILE-DESIGN.md   design source of truth (tokens, type, shape, rules)
docs/tickets/T-01..22   one ticket per Claude Code session, in order; each becomes a GitHub issue
```

## One-time setup

```bash
git clone git@github.com:debajit13/placket.git && cd placket
# copy the contents of this folder here
git add . && git commit -m "docs: PRD, design spec, tickets" && git push

# labels, then one issue per ticket file
for p in 0 1 2 3 4; do gh label create "phase-$p" --color 15192B; done
for f in docs/tickets/T-*.md; do
  gh issue create --title "$(head -1 "$f" | sed 's/^# //')" --body-file "$f" \
    --label "phase-$(grep -o 'Phase: [0-9]' "$f" | cut -c8)"
done

# skills, once, outside Claude Code
claude plugin marketplace add draftbit/mobile-taste-skill
claude plugin install mobile-taste-skill
npx skills add https://github.com/vercel-labs/agent-skills
```

Then protect `main` in the repo settings (require a pull request). Create the Firebase dev project by hand in the console (asia-south1, Google sign-in) before T-04.

## Each ticket

Fresh session every time:

```
claude
> Work on issue #1 (docs/tickets/T-01-monorepo-scaffold.md). Read CLAUDE.md and docs/MOBILE-DESIGN.md first.
  Create a branch t-01-monorepo-scaffold from main, restate the acceptance criteria as a checklist,
  tell me which files you will touch, then wait for my go.
> Go.
```

Verify yourself (`pnpm test`, open the app, walk the screen in light and dark), then:

```
> Fill the Result section of the ticket, commit with message "T-01 Monorepo scaffold", push the branch,
  and open a pull request titled "T-01 Monorepo scaffold" whose body says "Closes #1" and lists the evidence.
```

Review the PR on GitHub and merge it; merging closes the issue. At the end of each phase: `Run /mobile-design-review on apps/mobile and fix only high and medium findings.`

The full method, prompts that work, and what not to do are in docs/PRD.md under "How to run this with Claude Code".
