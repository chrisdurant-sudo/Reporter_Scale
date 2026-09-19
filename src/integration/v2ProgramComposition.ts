import type {
  DemoSnapshotV2,
  ProgramsCommandEnvelope,
  ProgramsCommandMutation,
  TeamCommandEnvelope,
  V2CommandMutation,
} from "../contracts/v2";

/** Run inside commitV2Command: Programs and its requested Team work share one acknowledgement. */
export function composeProgramsCommand(
  snapshot: DemoSnapshotV2,
  command: ProgramsCommandEnvelope,
  preparePrograms: (snapshot: DemoSnapshotV2, command: ProgramsCommandEnvelope) => ProgramsCommandMutation,
  prepareTeam: (snapshot: DemoSnapshotV2, command: TeamCommandEnvelope) => V2CommandMutation,
): V2CommandMutation {
  const program = preparePrograms(snapshot, command);
  let proposed = program.snapshot;
  const affected = new Map(program.affectedRecords.map((ref) => [`${ref.kind}:${ref.id}`, ref]));
  program.requestedWork.forEach((payload, index) => {
    const work = prepareTeam(proposed, {
      type: "work.create",
      context: {
        ...command.context,
        // Child identities are deterministic; the parent alone enters the repository replay log.
        commandId: `${command.context.commandId}/work/${index + 1}` as TeamCommandEnvelope["context"]["commandId"],
      },
      payload,
    });
    proposed = work.snapshot;
    for (const ref of work.affectedRecords) affected.set(`${ref.kind}:${ref.id}`, ref);
  });
  return { snapshot: proposed, affectedRecords: [...affected.values()], message: program.message };
}
