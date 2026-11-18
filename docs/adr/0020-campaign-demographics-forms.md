# Campaigns own their demographics forms

Admin presents demographics as questions that a Host switches on or off for a
Campaign, without exposing Comhairle's versions. System questions are available
to every Host; a Host's own questions live in its shared question bank.
Removing a question from a Campaign does not delete it from the bank.

New Campaigns receive a form containing the published system questions other
than Postcode, which is asked at join. If there are no questions, the form is
created when the first one is enabled. The Conversation must be assigned to its
Host before a form step can be created.

## Live changes

Hosts may change questions after launch. Comhairle's form publication pins
**every** entry to the latest question version, and its API cannot specify a
version per entry. Republishing the form would therefore change questions the
Host did not edit.

Instead, admin keeps the Campaign's form pinned. It disables a changed or removed
form entry with a step override and asks a changed or newly enabled question
through its own workflow step, pinned to the version chosen. The edited question
can move after the remaining form questions. Migrated Campaigns that already use
one step per question keep that structure while any such step remains. After
the last is removed, enabling a question creates a Campaign form. Other
questions, including those in other Campaigns, stay pinned until individually
changed.

## Reporting and failures

Questions, options and answers live in Comhairle, not Campaign metadata. The
current report supplies option IDs but not labels for historical versions.
Admin identifies those as unknown options rather than guessing. The anonymous
public report cannot look up option labels, so its demographic breakdown is
unavailable until the report provides them. Removing a question hides it from
the Campaign's tables; the answers remain stored. Comhairle aggregates answers
across versions, so someone who answers multiple versions can appear more than
once.

The backend operations are not transactional. A question publication may succeed
while a workflow update fails; admin attempts to restore the previous form and
reports failures that require the Host to check the Campaign.

## Participant application

The participant app reads the Campaign's live form and question steps, refreshes
them when voting ends, and submits answers against their pinned versions.
An answer is immutable for a Campaign and version. An earlier answer can be
offered as a prefill, but the participant must confirm it for another Campaign
or a new version. Special-category answers require explicit consent. Optional
questions skipped on this browser are remembered by Campaign and version, not
as account-wide completion. A skipped question is asked again if it becomes
required. Switching Campaigns or preview mode resets the poll and its drafts.
If the questions cannot load, participants may finish without sharing; that
does not record their questions as completed.

The current profile API cannot save Postcode and participants cannot discover
the system Postcode question. Until Comhairle exposes a participant-writable
Postcode, the zip entered at join is kept on the browser only. The profile does
not claim it was saved. Draft previews also report an error when the API cannot
resolve a pinned historical version rather than displaying a different version.
