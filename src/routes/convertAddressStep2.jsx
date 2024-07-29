import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useStateMachine } from "little-state-machine";
import updateAction from "../updateAction";
import Spinner from "../components/loader";

import configData from "../config.json";

import {Client, PrivateKey} from "dsteem";
const client = new Client(configData.STEEM_API_URL);

export default function ConvertAddressStep2() {
  const navigate = useNavigate();
  const { handleSubmit, formState: { errors } } = useForm();
  const { state, actions } = useStateMachine({ updateAction });
  const [ globalErrors, setGlobalErrors ] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    actions.updateAction(data);
    setGlobalErrors("");

    // Grab data from state
    const originAccount = state.data.originAccount;
    const weightThreshold = state.data.weightThreshold;
    const signatories = state.data.signatories;

    // Grab PK from form
    const ownerKey = document.getElementById('privateOwnerKey').value;

    // Grab existing user deets
    const originAccountUser = await client.database.getAccounts([originAccount]);
    const originAccountMemoPubKey = originAccountUser[0].memo_key;

    // Build accountAuths array
    const accountAuths = Array();
    for (var i = 0; i < signatories.length; i++)
      accountAuths.push([signatories[i].account, parseInt(signatories[i].weight)]);

    // accountAuths must be in alphabetic order; sort on the account subfield
    accountAuths.sort((a, b) => {
      const nameA = a[0].toUpperCase();
      const nameB = b[0].toUpperCase();
      return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
    });

    // Build the updateAccount op
    const op = {
      "account": originAccount,
      "active": {
        "weight_threshold": parseInt(weightThreshold),
        "account_auths": accountAuths,
        "key_auths": Array()
      },
      owner: {
        "weight_threshold": parseInt(weightThreshold),
        "account_auths": accountAuths,
        "key_auths": Array()
      },
      "json_metadata": "",
      "memo_key": originAccountMemoPubKey
    };

    // Broadcast!
    try {
      client.broadcast.updateAccount(op, PrivateKey.from(ownerKey)).then(function(result) {
        setIsSubmitting(false);
        navigate("/convertaddressresult");
      }, function(error) {
        setIsSubmitting(false);
        setGlobalErrors("Error: " + error);
      });
    } catch (error) {
      setIsSubmitting(false);

      if (error.message == "private key network id mismatch")
        setGlobalErrors("Incorrect private key format");
      else
        setGlobalErrors("Error: " + error.message);
    }
  };

  return (
      <>
        <header className="entry-header">
          <h1 className="entry-title">Convert Account to Multisig - Step Two</h1>
        </header>
        <div className="entry-content">
          <p>
            Please check and confirm the details below, and enter the <strong>Private Owner Key</strong> for the account to be converted.
          </p>
          <p>
            <strong>This process is irreversible; the original account owner cannot convert the account back to non-multisig.</strong>
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
          <form onSubmit={handleSubmit(onSubmit)}  className="convert-address">
            {globalErrors && <p role="alert" className="error-message">{globalErrors}</p>}
            <div className="formfield">
              <label htmlFor="privateOwnerKey">Private Owner Key for <span className="highlight">@{state.data.originAccount}</span></label>
              <input type="password" id="privateOwnerKey"/>
              <div className="message">The Private Owner Key will <strong>not</strong> leave your browser. It won't be stored or transmitted.</div>
            </div>
            <div className="buttonRow">
              <button type="submit" disabled={isSubmitting}>Convert</button>
            </div>

            {isSubmitting && (
              <Spinner />
            )}
          </form>
        </div>
      </>
  );
};
