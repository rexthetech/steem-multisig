import React from "react";
import { useStateMachine } from "little-state-machine";
import updateAction from "../UpdateAction";

export default function SignTransactionResult() {
  const { state } = useStateMachine(updateAction);

  return (
        <>
        <header className="entry-header">
          <h1 className="entry-title">Sign a Multisig Transaction - Completed</h1>
        </header>
        <div className="entry-content">
          <p dangerouslySetInnerHTML={{ __html: state.data.result }}></p>
        </div>
      </>
  );
};
