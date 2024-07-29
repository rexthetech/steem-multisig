import React from "react";
import { useStateMachine } from "little-state-machine";
import { Link } from 'react-router-dom';
import updateAction from "../updateAction";

export default function ConvertAddressResult() {
  const { state } = useStateMachine(updateAction);

  return (
      <>
        <header className="entry-header">
          <h1 className="entry-title">Convert Account to Multisig - Completed</h1>
        </header>
        <div className="entry-content">
        <p>
          The account @{state.data.originAccount} has been converted to multisig; you may now <Link to="/createtransaction1">create multisig transactions</Link>.
        </p>
        <div className="process-summary">
          <div className="process-row">
            <div className="process-cell">
              <span>Multisig Account</span>
              @{state.data.originAccount}
            </div>
            <div className="process-cell">
              <span>Threshold Required</span>
              {state.data.weightThreshold}
            </div>
          </div>
            {state.data.signatories && state.data.signatories.map((signatory, index) => (
              <div key={index} className="process-row">
                <div className="process-cell">
                  <span>Signatory Account</span>
                  @{signatory.account}
                </div>
                <div className="process-cell">
                  <span>Signatory Weight</span>
                  {signatory.weight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
  );
};
