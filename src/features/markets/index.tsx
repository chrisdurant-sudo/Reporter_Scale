import type { MarketsScreenProps } from "../../contracts";
import { TEST_ANCHORS } from "../../contracts";

export function MarketsScreen({ view }: MarketsScreenProps) {
  return (
    <section data-testid={TEST_ANCHORS.marketsScreen}>
      <h2>Markets</h2>
      <p>{view.statusMessage}</p>
    </section>
  );
}
