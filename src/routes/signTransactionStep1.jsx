import React, { useState } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useStateMachine } from "little-state-machine";
import updateAction from "../updateAction";
import getMultisigApiUrl from "../getMultisigApiUrl";
import Spinner from "../components/loader";

import configData from "../config.json";

import {Client} from "dsteem";
const client = new Client(configData.STEEM_API_URL);

export default function SignTransactionStep1() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { actions, state } = useStateMachine({ updateAction });
  const [ globalErrors, setGlobalErrors ] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    actions.updateAction(data);
    setGlobalErrors("");

    // Pick up form fields
    const account = data.account;

    // Account doesn't exist?
    const user = await client.database.getAccounts([account]);
    if (!user[0]) {
      setIsSubmitting(false);
      setGlobalErrors("Can't find Steem account " + account);
      return;
    }

    // Account isn't multisig?
    const active = user[0].active.account_auths;
    if (active.length < 2) {
      setIsSubmitting(false);
      setGlobalErrors("Steem account " + account + " does not appear to be a multisig account");
      return;
    }

    // Pull open transactions
    try {
      const apiUrl = getMultisigApiUrl() + "/partialTx/" + account;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      if (response.status === 500) {
        setIsSubmitting(false);
        setGlobalErrors("Error: " + result);
      } else {
        // Account doesn't have any open txs?
        if (result.length === 0) {
          setIsSubmitting(false);
          setGlobalErrors("No open multisig transactions found for " + account);
          return;
        }

        // Looks OK -- update state with potential txs and send them on their way
        let data = state.data;
        data.transactions = result;
        data.auths = active;
        actions.updateAction(data);
        
        // Only one? Take them straight to step 3, otherwise send them to step 2 to select a tx
        setIsSubmitting(false);
        if (result.length === 1) {
          data.selectedTxIndex = 0;
          data.transactionId = result[0].id;
          actions.updateAction(data);
          navigate("/signtransaction3");
        } else
          navigate("/signtransaction2");
      }        
    } catch (error) {
      setIsSubmitting(false);
      setGlobalErrors("Multisig API Error: " + error);
    }
  };

  return (
        <>
        <header className="entry-header">
            <h1 className="entry-title">Sign a Multisig Transaction - Step One</h1>
        </header>
        <div className="entry-content">
          <p>
            Enter an <strong>existing multisig account</strong> to view open transactions that can be signed.
          </p>
          <form onSubmit={handleSubmit(onSubmit)}>
            {globalErrors && <p role="alert" className="error-message">{globalErrors}</p>}
            <div className="fieldgroup">
              <div className="formfield">
                <label htmlFor="account">Multisig Account</label>
                <div className="prepend">
                  <span className="affix">@</span>
                  <input 
                    { ...register("account", { required: "A valid multisig account is required" })}
                    defaultValue={state.data.account}
                  />
                </div>
                {errors.account && <div role="alert" className="error-message">{errors.account?.message}</div>}
              </div>
            </div>
            <div className="buttonRow">
              <button type="submit" disabled={isSubmitting}>Next</button>
            </div>

            {isSubmitting && (
              <Spinner />
            )}
          </form>
        </div>
      </>
  );
};
