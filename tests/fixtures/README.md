# Hand-written answers

Each `.jsonl` file here is an answer written by hand, not by Claude, in the same format Claude uses: one JSON patch per line. They're the answers Claude doesn't usually give, but could, so we can see what Doorlist does with them. While developing, ask `replay <name>` in the Ask panel to play one through the same checks as a real answer.

- `broken.jsonl`: December's figures, with a component that isn't in the catalog (a PieChart), a figure that doesn't exist (profit), and a last line that's cut off part way, as happens when an answer hits its length limit.
- `prose.jsonl`: an answer written as a paragraph of text instead of patches, so there's nothing in it Doorlist can draw.
- `january.jsonl`: a figure and a table for January, when there are no shows in January.
- `night-ferries.jsonl`: an answer about a sold-out show, with a "Refund everyone" button for an action Doorlist doesn't have, of the kind that something planted in your own data could get a model to add, and a discount button for a show that can't have one.
