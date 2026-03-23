import { endGroup, info, setFailed, startGroup } from "@actions/core";

import { getInputs } from "./input";
import { installCursorCLI } from "./installer";
import { maskSecret, setOutputs } from "./output";
import { runAgent } from "./runner";

export const run = async (): Promise<void> => {
  try {
    // Parse & validate inputs
    const inputs = getInputs();

    // Immediately mask secrets from any log output
    maskSecret(inputs.apiKey);

    startGroup("🔧 Installing Cursor CLI");
    const { cacheHit, resolvedVersion } = await installCursorCLI(
      inputs.cursorVersion
    );
    info(`Cursor CLI v${resolvedVersion} ready (cache hit: ${cacheHit})`);
    endGroup();

    startGroup("🤖 Running cursor-agent");
    const result = await runAgent(inputs);
    endGroup();

    // Parse output and set all action outputs + job summary
    const outputs = await setOutputs(result, cacheHit);

    // Fail the step if cursor-agent returned a non-zero exit code
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
