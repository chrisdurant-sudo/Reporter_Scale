import type { ReportersScreenProps } from "../../contracts";
import { TEST_ANCHORS } from "../../contracts";

export function ReportersScreen({ view }: ReportersScreenProps) {
  return (
    <section data-testid={TEST_ANCHORS.reportersScreen}>
      <h2>Reporters</h2>
      <p>{view.statusMessage}</p>
    </section>
  );
}
