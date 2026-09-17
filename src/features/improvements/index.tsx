import type { ImprovementsScreenProps } from "../../contracts";
import { TEST_ANCHORS } from "../../contracts";

export function ImprovementsScreen({ view }: ImprovementsScreenProps) {
  return (
    <section data-testid={TEST_ANCHORS.improvementsScreen}>
      <h2>Improvements</h2>
      <p>{view.statusMessage}</p>
    </section>
  );
}
