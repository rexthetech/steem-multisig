import React from "react";
import { useStateMachine } from "little-state-machine";
import updateAction from "../updateAction";

export default function CreateTransactionResult() {
  const { state } = useStateMachine(updateAction);

  return (
    <>
      <header className="entry-header">
        <h1 className="entry-title">Create Multisig Transaction - Completed</h1>
      </header>
      <div className="entry-content">        
        <p dangerouslySetInnerHTML={{ __html: state.data.result }}></p>
        
        <div className="process-summary">
          <div className="process-row">
            <div className="process-cell">
              <span>From (Multisig Account)</span>
              @{state.data.accountFrom}
            </div>
            <div className="process-cell">
              <span>Amount</span>
              {state.data.amount} {state.data.type}
            </div>
          </div>
          <div className="process-row">
            <div className="process-cell">
              <span>To (Recipient Account)</span>
              @{state.data.accountTo}
            </div>              
            <div className="process-cell">
              <span>Total signing weight required</span>
              {state.data.weightRequired}
            </div>
          </div>
        </div>
      </div>        
    </>
  );
};
