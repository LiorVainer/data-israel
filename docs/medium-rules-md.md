Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:700/1*yo78HAxjup1HGZQMQt46MQ.png)

Claude Code Rules System

# Claude Code Rules: Stop Stuffing Everything into One CLAUDE.md

## Split your instructions into path-scoped rule files. Claude loads only what applies.

[![Rick Hightower](https://miro.medium.com/v2/resize:fill:32:32/1*ayG9RqKzsG7gJLI0PEzHfg.jpeg)](https://medium.com/@richardhightower?source=post_page---byline--0b3732bca433---------------------------------------)

[Rick Hightower](https://medium.com/@richardhightower?source=post_page---byline--0b3732bca433---------------------------------------)

11 min read

·

Mar 10, 2026

Your CLAUDE.md file started small. A few build commands, a note about the test framework, a reminder about naming conventions. Then it grew. API guidelines joined coding standards. Security rules sat next to React patterns. Database migration warnings lived alongside CSS conventions. Now it is 400 lines long, and every single line loads into context every session, whether Claude is working on a migration or a button component.

This is priority saturation. When everything is high priority, nothing is. Claude sees your migration safety rules while editing a React component and your React patterns while writing a database query. The context window fills with instructions that do not apply to the current task.

Claude Code’s rules system solves this. Instead of one massive file, you split instructions into focused rule files scoped to specific file types. Your migration rules load only when Claude touches migration files. Your React patterns load only when Claude works on `.tsx` files. Everything else stays out of context.

This article covers how the rules system works, how it compares to CLAUDE.md and auto memory, and how to…

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:700/1*27NWbDzpGPWOVsqpIfL4BA.png)

Rules allow you divide, scope and conquer

## The Rules Directory

Rules live in a `.claude/rules/` directory at two levels:

**Project rules** at `./.claude/rules/*.md` are committed to git and shared with your team. These are your project's coding standards, architectural guidelines, and workflow requirements.

**User rules** at `~/.claude/rules/*.md` are personal and apply across every project you work on. These are your individual preferences, tools you always use, and patterns you always want applied.

```
your-project/
├── .claude/
│   ├── CLAUDE.md              # Main project instructions
│   └── rules/
│       ├── code-style.md      # Always loaded
│       ├──…
```

![Claude Code Agent Skills 2.0: From Custom Instructions to Programmable Agents](https://miro.medium.com/v2/resize:fit:679/format:webp/1*9aRn7FV0j269CYc44Rti1g.png)

[![Towards AI](https://miro.medium.com/v2/resize:fill:20:20/1*JyIThO-cLjlChQLb6kSlVQ.png)](https://medium.com/towards-artificial-intelligence?source=post_page---author_recirc--0b3732bca433----0---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

In

[Towards AI](https://medium.com/towards-artificial-intelligence?source=post_page---author_recirc--0b3732bca433----0---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

by

[Rick Hightower](https://medium.com/@richardhightower?source=post_page---author_recirc--0b3732bca433----0---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

[**Skills are no longer instructions. They are programs.**](https://medium.com/towards-artificial-intelligence/claude-code-agent-skills-2-0-from-custom-instructions-to-programmable-agents-ab6e4563c176?source=post_page---author_recirc--0b3732bca433----0---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

Mar 9

[A clap icon423\\
\\
A response icon7](https://medium.com/towards-artificial-intelligence/claude-code-agent-skills-2-0-from-custom-instructions-to-programmable-agents-ab6e4563c176?source=post_page---author_recirc--0b3732bca433----0---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

![Claude Certified Architect: The Complete Guide to Passing the CCA Foundations Exam](https://miro.medium.com/v2/resize:fit:679/format:webp/1*rvzbjvmDIHS6SNse3fg9tw.png)

[![Towards AI](https://miro.medium.com/v2/resize:fill:20:20/1*JyIThO-cLjlChQLb6kSlVQ.png)](https://medium.com/towards-artificial-intelligence?source=post_page---author_recirc--0b3732bca433----1---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

In

[Towards AI](https://medium.com/towards-artificial-intelligence?source=post_page---author_recirc--0b3732bca433----1---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

by

[Rick Hightower](https://medium.com/@richardhightower?source=post_page---author_recirc--0b3732bca433----1---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

[**Everything You Need to Know to Ace the CCA Foundations Exam on Your First Try — Article 1 of 8**](https://medium.com/towards-artificial-intelligence/claude-certified-architect-the-complete-guide-to-passing-the-cca-foundations-exam-9665ce7342a8?source=post_page---author_recirc--0b3732bca433----1---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

Mar 24

[A clap icon427\\
\\
A response icon5](https://medium.com/towards-artificial-intelligence/claude-certified-architect-the-complete-guide-to-passing-the-cca-foundations-exam-9665ce7342a8?source=post_page---author_recirc--0b3732bca433----1---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

![The Great Framework Showdown: Superpowers vs. BMAD vs. SpecKit vs. GSD](https://miro.medium.com/v2/resize:fit:679/format:webp/1*L-pvTnpXV-3uF9apsM3Tag.png)

[![Artificial Intelligence in Plain English](https://miro.medium.com/v2/resize:fill:20:20/1*9zAmnK08gUCmZX7q0McVKw@2x.png)](https://medium.com/ai-in-plain-english?source=post_page---author_recirc--0b3732bca433----2---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

In

[Artificial Intelligence in Plain English](https://medium.com/ai-in-plain-english?source=post_page---author_recirc--0b3732bca433----2---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

by

[Rick Hightower](https://medium.com/@richardhightower?source=post_page---author_recirc--0b3732bca433----2---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

[**A practitioner’s comparison of the leading agentic coding frameworks**](https://medium.com/ai-in-plain-english/the-great-framework-showdown-superpowers-vs-bmad-vs-speckit-vs-gsd-360983101c10?source=post_page---author_recirc--0b3732bca433----2---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

Mar 16

[A clap icon673\\
\\
A response icon14](https://medium.com/ai-in-plain-english/the-great-framework-showdown-superpowers-vs-bmad-vs-speckit-vs-gsd-360983101c10?source=post_page---author_recirc--0b3732bca433----2---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

![Build Your First Claude Code Agent Skill: A Simple Project Memory System That Saves Hours](https://miro.medium.com/v2/resize:fit:679/format:webp/1*O2_piSNfbAuTTlXEy4i-oA.png)

[![Artificial Intelligence in Plain English](https://miro.medium.com/v2/resize:fill:20:20/1*9zAmnK08gUCmZX7q0McVKw@2x.png)](https://medium.com/ai-in-plain-english?source=post_page---author_recirc--0b3732bca433----3---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

In

[Artificial Intelligence in Plain English](https://medium.com/ai-in-plain-english?source=post_page---author_recirc--0b3732bca433----3---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

by

[Rick Hightower](https://medium.com/@richardhightower?source=post_page---author_recirc--0b3732bca433----3---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

[**How a 300-line skill became my most-used productivity tool for AI-assisted development.**](https://medium.com/ai-in-plain-english/build-your-first-claude-code-skill-a-simple-project-memory-system-that-saves-hours-1d13f21aff9e?source=post_page---author_recirc--0b3732bca433----3---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

Jan 12

[A clap icon1.3K\\
\\
A response icon30](https://medium.com/ai-in-plain-english/build-your-first-claude-code-skill-a-simple-project-memory-system-that-saves-hours-1d13f21aff9e?source=post_page---author_recirc--0b3732bca433----3---------------------59fb63bb_273b_4868_82af_c42cdf9f40d6--------------)

![10 Must-Have Skills for Claude (and Any Coding Agent) in 2026](https://miro.medium.com/v2/resize:fit:679/format:webp/1*5Nup6r8Erd-5lEhYbscyJA.png)

[![unicodeveloper](https://miro.medium.com/v2/resize:fill:20:20/0*-kqhhb24fzA5QqSY.jpeg)](https://medium.com/@unicodeveloper?source=post_page---read_next_recirc--0b3732bca433----0---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

[unicodeveloper](https://medium.com/@unicodeveloper?source=post_page---read_next_recirc--0b3732bca433----0---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

[**The definitive guide to agent skills that change how Claude Code, Cursor, Gemini CLI, and other AI coding assistants perform in production.**](https://medium.com/@unicodeveloper/10-must-have-skills-for-claude-and-any-coding-agent-in-2026-b5451b013051?source=post_page---read_next_recirc--0b3732bca433----0---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

Mar 9

[A clap icon1.2K\\
\\
A response icon21](https://medium.com/@unicodeveloper/10-must-have-skills-for-claude-and-any-coding-agent-in-2026-b5451b013051?source=post_page---read_next_recirc--0b3732bca433----0---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

![Claude Certified Architect: The Complete Guide to Passing the CCA Foundations Exam](https://miro.medium.com/v2/resize:fit:679/format:webp/1*rvzbjvmDIHS6SNse3fg9tw.png)

[![Towards AI](https://miro.medium.com/v2/resize:fill:20:20/1*JyIThO-cLjlChQLb6kSlVQ.png)](https://medium.com/towards-artificial-intelligence?source=post_page---read_next_recirc--0b3732bca433----1---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

In

[Towards AI](https://medium.com/towards-artificial-intelligence?source=post_page---read_next_recirc--0b3732bca433----1---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

by

[Rick Hightower](https://medium.com/@richardhightower?source=post_page---read_next_recirc--0b3732bca433----1---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

[**Everything You Need to Know to Ace the CCA Foundations Exam on Your First Try — Article 1 of 8**](https://medium.com/towards-artificial-intelligence/claude-certified-architect-the-complete-guide-to-passing-the-cca-foundations-exam-9665ce7342a8?source=post_page---read_next_recirc--0b3732bca433----1---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

Mar 24

[A clap icon427\\
\\
A response icon5](https://medium.com/towards-artificial-intelligence/claude-certified-architect-the-complete-guide-to-passing-the-cca-foundations-exam-9665ce7342a8?source=post_page---read_next_recirc--0b3732bca433----1---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

![Claude Code New Commands](https://miro.medium.com/v2/resize:fit:679/format:webp/1*gXdjeE_dKEvos85eZkWBiw.png)

[![Joe Njenga](https://miro.medium.com/v2/resize:fill:20:20/1*0Hoc7r7_ybnOvk1t8yR3_A.jpeg)](https://medium.com/@joe.njenga?source=post_page---read_next_recirc--0b3732bca433----0---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

[Joe Njenga](https://medium.com/@joe.njenga?source=post_page---read_next_recirc--0b3732bca433----0---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

[**Claude Code is changing faster than any AI coding tool we’ve seen, and it’s making it tough to keep up.**](https://medium.com/@joe.njenga/6-claude-code-new-commands-variables-you-likely-missed-rushed-updates-0b6d1995c2aa?source=post_page---read_next_recirc--0b3732bca433----0---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

4d ago

[A clap icon225\\
\\
A response icon2](https://medium.com/@joe.njenga/6-claude-code-new-commands-variables-you-likely-missed-rushed-updates-0b6d1995c2aa?source=post_page---read_next_recirc--0b3732bca433----0---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

![Claude Code agent architecture visualization showing 10 interconnected build steps flowing from a single Markdown file to a full multi-agent production system](https://miro.medium.com/v2/resize:fit:679/format:webp/1*lE8alsLW7zU0bpvrVzhqig.png)

[![Reza Rezvani](https://miro.medium.com/v2/resize:fill:20:20/1*jDxVaEgUePd76Bw8xJrr2g.png)](https://medium.com/@alirezarezvani?source=post_page---read_next_recirc--0b3732bca433----1---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

[Reza Rezvani](https://medium.com/@alirezarezvani?source=post_page---read_next_recirc--0b3732bca433----1---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

[**No LangChain. No CrewAI. Just Markdown files with YAML frontmatter — and the production patterns that make them work.**](https://medium.com/@alirezarezvani/how-to-build-claude-code-agents-from-scratch-the-10-step-framework-i-actually-use-in-production-6f6a358f4f8c?source=post_page---read_next_recirc--0b3732bca433----1---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

Mar 30

[A clap icon323\\
\\
A response icon9](https://medium.com/@alirezarezvani/how-to-build-claude-code-agents-from-scratch-the-10-step-framework-i-actually-use-in-production-6f6a358f4f8c?source=post_page---read_next_recirc--0b3732bca433----1---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

![Level Up Your Claude Code with This CLAUDE.md](https://miro.medium.com/v2/resize:fit:679/format:webp/0*xqFixH4LCTtYz7yL.jpeg)

[![Level Up Coding](https://miro.medium.com/v2/resize:fill:20:20/1*5D9oYBd58pyjMkV_5-zXXQ.jpeg)](https://medium.com/gitconnected?source=post_page---read_next_recirc--0b3732bca433----2---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

In

[Level Up Coding](https://medium.com/gitconnected?source=post_page---read_next_recirc--0b3732bca433----2---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

by

[Youssef Hosni](https://medium.com/@yousefhosni?source=post_page---read_next_recirc--0b3732bca433----2---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

[**Make Claude Code Like a Senior Engineer with CLAUDE.md**](https://medium.com/gitconnected/level-up-your-claude-code-with-this-claude-md-374521f1e1ab?source=post_page---read_next_recirc--0b3732bca433----2---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

Feb 25

[A clap icon620\\
\\
A response icon6](https://medium.com/gitconnected/level-up-your-claude-code-with-this-claude-md-374521f1e1ab?source=post_page---read_next_recirc--0b3732bca433----2---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

![I Turned Andrej Karpathy’s Autoresearch Into a Universal Skill](https://miro.medium.com/v2/resize:fit:679/format:webp/1*R6wdFIZKoSuR1l1dNgttMQ.png)

[![Balu Kosuri](https://miro.medium.com/v2/resize:fill:20:20/1*8PS5vEDRlh41uAjCPGvUQg.jpeg)](https://medium.com/@k.balu124?source=post_page---read_next_recirc--0b3732bca433----3---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

[Balu Kosuri](https://medium.com/@k.balu124?source=post_page---read_next_recirc--0b3732bca433----3---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

[**By Balasubramanyam Kosuri**](https://medium.com/@k.balu124/i-turned-andrej-karpathys-autoresearch-into-a-universal-skill-1cb3d44fc669?source=post_page---read_next_recirc--0b3732bca433----3---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)

Mar 21

[A clap icon232\\
\\
A response icon4](https://medium.com/@k.balu124/i-turned-andrej-karpathys-autoresearch-into-a-universal-skill-1cb3d44fc669?source=post_page---read_next_recirc--0b3732bca433----3---------------------dd645d06_53a0_4227_a2b7_73e1eb181eb3--------------)