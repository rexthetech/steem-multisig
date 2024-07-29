import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useStateMachine } from "little-state-machine";
import updateAction from "../updateAction";
import getMultisigApiUrl from "../getMultisigApiUrl";
import Spinner from "../components/loader";

import { Buffer } from "buffer/";
window.Buffer = Buffer;

import configData from "../config.json";

import {Client, PrivateKey} from "dsteem";
const client = new Client(configData.STEEM_API_URL);

export default function SignTransactionStep3() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const { state, actions } = useStateMachine({ updateAction });
  const [ globalErrors, setGlobalErrors ] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pick up stuff from selected tx
  var selectedTxIndex, partialTx, proposer, accountFrom, accountTo, amount, expiryDate;
  var weightThreshold, weightSigned, expiryDateUTC, auths, signedByArray;
  var authsFiltered, signedBy;

  if (state.data.transactions) {
    selectedTxIndex = state.data.selectedTxIndex;
    partialTx = JSON.parse(state.data.transactions[selectedTxIndex].partialTx);

    proposer = state.data.transactions[selectedTxIndex].proposer;
    accountFrom = state.data.transactions[selectedTxIndex].accountFrom;

    accountTo = partialTx.operations[0][1].to;
    amount = partialTx.operations[0][1].amount;

    expiryDate = new Date(state.data.transactions[selectedTxIndex].expiration);
    weightThreshold = state.data.transactions[selectedTxIndex].weightThreshold;
    weightSigned = state.data.transactions[selectedTxIndex].weightSigned;
    expiryDateUTC = expiryDate.getUTCFullYear() + '-' + ('0' + (expiryDate.getUTCMonth()+1)).slice(-2) + '-' + ('0' + expiryDate.getUTCDate()).slice(-2) + ' ' + ('0' + expiryDate.getUTCHours()).slice(-2) + ':' + ('0' + expiryDate.getUTCMinutes()).slice(-2) + ':' + ('0' + expiryDate.getUTCSeconds()).slice(-2);

    // Filter auths to remove users who've already signed
    auths = state.data.auths;
    signedByArray = JSON.parse(state.data.transactions[selectedTxIndex].signedBy);

    authsFiltered = auths.filter(function(item) {
      return !signedByArray.includes(item[0]);
    });

    signedBy = signedByArray.join(", ");
  }

  const onChangeAuth = (event) => {
    let data = state.data;
    data.authAccount = event.target.value;
    actions.updateAction(data);
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setGlobalErrors("");

    // Grab PK from form
    const activeKey = document.getElementById('privateActiveKey').value;

    // Build auth tx
    const extensions = [];    
    const authAccount = state.data.authAccount;
    const randomBytes = Math.random().toString(36).substring(2);
    const authOperations = [[
      'custom_json', 
      {   
        'required_auths': [], 
        'required_posting_auths': [authAccount], 
        'id': 'authenticate',
        'json': JSON.stringify({'random_bytes': randomBytes})
      }
    ]];

    const authTx = {
      'expiration': partialTx.expiration,
      'extensions': extensions,
      'operations': authOperations,
      'ref_block_num': partialTx.ref_block_num,
      'ref_block_prefix': partialTx.ref_block_prefix
    };

    // Sign both txs
    try {
      const newPartialTx = client.broadcast.sign(partialTx, PrivateKey.from(activeKey));
      const signedAuthTx = client.broadcast.sign(authTx, PrivateKey.from(activeKey));
      const serialisedTx = {
        'partialTx': newPartialTx,
        'authTx': signedAuthTx,
        'randomBytes': randomBytes,
        'transactionId': state.data.transactionId,
        'signedBy': [ authAccount ]
      };

      // JSONify
      const jsonTx = JSON.stringify(serialisedTx);

      // Post it
      try {
        const apiUrl = getMultisigApiUrl() + "/addSig";
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: jsonTx,
        });

        const result = await response.text();
        if (response.status === 500) {
          setIsSubmitting(false);
          setGlobalErrors("Error: " + result);
        } else {
          let data = state.data;
          data.result = result;
          actions.updateAction(data);

          setIsSubmitting(false);
          navigate("/signtransactionresult");          
        }        
      } catch (error) {
        setGlobalErrors("Multisig API Error: " + error);
      }
    } catch (error) {
      setIsSubmitting(false);

      if (error.message == "private key network id mismatch" || error.message == "Non-base58 character")
        setGlobalErrors("Incorrect private key format");
      else
        setGlobalErrors("Steem API Error: " + error.message);
    }
  };

  return (
        <>
        <header className="entry-header">
            <h1 className="entry-title">Sign a Multisig Transaction - Step Three</h1>
        </header>
        <div className="entry-content">
          <p>
            In order to create this transaction, you must sign it as one of the below signatories.
            Please choose your signatory account, and enter your Private Active Key.
          </p>

          <div className="process-summary">
            <div className="process-row">
              <div className="process-cell">
                  <span>Proposer</span>
                  @{proposer}
              </div>
              <div className="process-cell">
                <span>Expiry</span>
                {expiryDateUTC}
              </div>
            </div>
            <div className="process-row">
              <div className="process-cell">
                <span>From (Multisig Account)</span>
                @{accountFrom}
              </div>
              <div className="process-cell">
                <span>Amount</span>
                {amount}
              </div>
            </div>
            <div className="process-row">
              <div className="process-cell">
                <span>To (Recipient Account)</span>
                @{accountTo}
              </div>              
              <div className="process-cell">
                <span>Weight already signed</span>
                {weightSigned} (of {weightThreshold})
              </div>
            </div>
            <div className="process-row">
              <div className="process-cell">
                <span>Users already signed</span>
                {signedBy}
              </div>
            </div>
          </div>
          <p>
            Which signing user are you?
          </p>
          <form onSubmit={handleSubmit(onSubmit)}>
            {globalErrors && <p role="alert" className="error-message">{globalErrors}</p>}

            <div className="radioGroup process-summary">
            {authsFiltered && authsFiltered.map((account, index) => (
              <div key={index} className="radioField" onChange={onChangeAuth}>
                <label>
                  <input 
                    type="radio"
                    name="auth"
                    value={account[0]}
                    {...register("authAccount", { required: "You must select an account to sign with" })}
                  />
                  <span className="label-text">{account[0]}</span> <span className="label-extra">(Weight: {account[1]})</span>
                </label>
              </div>
            ))}
            </div>
            {errors.authAccount && <p role="alert" className="error-message">{errors.authAccount?.message}</p>}
              
            {state.data.authAccount && (
              <>
                <div className="formfield">
                  <label htmlFor="privateOwnerKey">Private Active Key for <span className="highlight">@{state.data.authAccount}</span></label>
                  <input type="password" id="privateActiveKey"/>
                  <div className="message">The Private Active Key will <strong>not</strong> leave your browser. It won't be stored or transmitted.</div>
                </div>
                <div className="buttonRow">
                  <button type="submit" disabled={isSubmitting}>Sign</button>
                </div>
              </>
            )}

            {isSubmitting && (
              <Spinner />
            )}
          </form>
        </div>
      </>
  );
};
