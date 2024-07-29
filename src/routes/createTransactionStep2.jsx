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

export default function CreateTransactionStep2() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { state, actions } = useStateMachine({ updateAction });
  const [ globalErrors, setGlobalErrors ] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChangeAuth = (event) => {
    let data = state.data;
    data.authAccount = event.target.value;
    actions.updateAction(data);
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    actions.updateAction(data);
    setGlobalErrors("");

    // Grab data from state
    const accountFrom = state.data.accountFrom;
    const accountTo = state.data.accountTo;
    const amount = state.data.amount;
    const authAccount = state.data.authAccount;
    const type = state.data.type;

    // Grab PK from form
    const activeKey = document.getElementById('privateActiveKey').value;

    // Check tip for proposal ref block
    const props = await client.database.getDynamicGlobalProperties();
    const ref_block_num = props.head_block_number & 0xFFFF;
    const ref_block_prefix = Buffer.from(props.head_block_id, 'hex').readUInt32LE(4);
    
    // Calc expiry time
    const expireTime = 1000 * 3590; // (ms) max is 1 hour, but allow for chain timing variance and go 10 secs under 
    //const expiration = new Date(Date.now() + expireTime).toISOString().slice(0, -5);

    const now = new Date();
    const future = new Date(now.getTime() + expireTime);
    const year = future.getUTCFullYear();
    const month = ('0' + (future.getUTCMonth() + 1)).slice(-2);
    const day = ('0' + future.getUTCDate()).slice(-2);
    const hours = ('0' + future.getUTCHours()).slice(-2);
    const minutes = ('0' + future.getUTCMinutes()).slice(-2);
    const seconds = ('0' + future.getUTCSeconds()).slice(-2);
    const expiration = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    // Build multisig tx
    const operations = [[
      'transfer',
      {
        'amount': amount + ' ' + type,
        'from': accountFrom,
        'memo': '',
        'to': accountTo
      }
    ]];

    const extensions = [];

    const tx = {
      expiration,
      extensions,
      operations,
      ref_block_num,
      ref_block_prefix
    };

    // Build auth tx
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
      expiration,
      extensions,
      'operations': authOperations,
      ref_block_num,
      ref_block_prefix
    };

    // Sign both, with the one key we do have
    try {
      const partialTx = client.broadcast.sign(tx, PrivateKey.from(activeKey)); // STATIC AGAIN
      const signedAuthTx = client.broadcast.sign(authTx, PrivateKey.from(activeKey));
      const serialisedTx = {
        'partialTx': partialTx,
        'authTx': signedAuthTx,
        'randomBytes': randomBytes,
        'signedBy': [ authAccount ]
      };

      // JSONify
      const jsonTx = JSON.stringify(serialisedTx);

      // Post it
      try {
        const apiUrl = getMultisigApiUrl() + "/partialTx";
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
          navigate("/createtransactionresult");          
        }        
      } catch (error) {
        setIsSubmitting(false);
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
            <h1 className="entry-title">Create a Multisig Transaction - Step Two</h1>
        </header>
        <div className="entry-content">
          <p>
            In order to create this transaction, you must sign it as one of the below signatories.
            Please choose your signatory account, and enter your Private Active Key.
          </p>

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
          <p>
            Which signing user are you?
          </p>
          <form onSubmit={handleSubmit(onSubmit)}>
            {globalErrors && <p role="alert" className="error-message">{globalErrors}</p>}

            <div className="radioGroup process-summary">
            {state.data.auths && state.data.auths.map((account, index) => (
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
                  <button type="submit" disabled={isSubmitting}>Create</button>
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
