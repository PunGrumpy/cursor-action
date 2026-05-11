import { endGroup, setFailed, startGroup } from "@actions/core";

import { getInputs } from "./input";
import { maskSecret, setOutputs } from "./output";
import { runAgent } from "./runner";

export const run = async (): Promise<void> => {
  try {
    const inputs = getInputs();
    maskSecret(inputs.apiKey);

    startGroup("🤖 Running cursor-agent");
    const result = await runAgent(inputs);
    endGroup();

    const outputs = await setOutputs(result);

    if (outputs.exitCode !== 0) {
      setFailed(
        `cursor-agent exited with code ${outputs.exitCode}. ` +
          `See the job summary for details.`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error.message);
    } else {
      setFailed(String(error));
    }
  }
};

run();
