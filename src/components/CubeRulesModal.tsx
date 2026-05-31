import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

export function CubeRulesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title="Rubik's Cube Rules" onClose={onClose}>
      <div className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto pr-1 text-sm leading-relaxed text-fg-muted">
        <section>
          <h3 className="mb-1 font-semibold text-fg">Goal</h3>
          <p>
            Return the cube to a solved state where each of the six faces is one
            solid color.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-fg">Allowed moves</h3>
          <p>
            Turn the outer layers only. Standard notation uses{' '}
            <span className="font-mono text-fg">R L U D F B</span> (right, left,
            up, down, front, back). A prime (
            <span className="font-mono text-fg">'</span>) means counter-clockwise;
            <span className="font-mono text-fg"> 2</span> means a half turn.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-fg">Scramble</h3>
          <p>
            Mix the puzzle with the shown scramble before you start. Do not
            start from a partially solved state unless you are practicing a
            specific case.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-fg">Timing</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Hold any key or click the timer to arm, release to start inspection or the solve.</li>
            <li>Press a key or click again to stop and record your time.</li>
            <li>Press <span className="font-mono text-fg">Esc</span> to cancel if you started by accident.</li>
            <li>With inspection on, you get a countdown before the solve begins.</li>
          </ul>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-fg">Penalties (WCA-style)</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-semibold text-warn">+2</span> — the puzzle
              is one move away from solved, or inspection went over the limit.
            </li>
            <li>
              <span className="font-semibold text-bad">DNF</span> — the puzzle
              is not fully solved, or inspection exceeded the limit by more than
              2 seconds.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-fg">Solved state</h3>
          <p>
            All layers must be aligned. Each face must be uniform in color, and
            center pieces must match their face colors on a standard 3×3.
          </p>
        </section>
      </div>

      <div className="mt-5 flex justify-end">
        <Button variant="purple" onClick={onClose}>
          Got it
        </Button>
      </div>
    </Modal>
  );
}
