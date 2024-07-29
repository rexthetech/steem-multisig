import React, { useState } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useStateMachine } from "little-state-machine";
import updateAction from "../UpdateAction";
import Spinner from "../components/loader";

import configData from "../config.json";
import {Client} from "dsteem";
const client = new Client(configData.STEEM_API_URL);

export default function ConvertAddressStep1() {
  const navigate = useNavigate();
  const { register, control, handleSubmit, formState: { errors } } = useForm({ 
    defaultValues: { 
      signatories: [
        { account: "", weight: "" },
        { account: "", weight: "" }
      ] 
    } 
  });
  const { actions, state } = useStateMachine({ updateAction });
  
  const [ globalErrors, setGlobalErrors ] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "signatories"
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    actions.updateAction(data);
    setGlobalErrors("");

    // Pick up form fields
    const originAccount = data.originAccount;
    const signatories = data.signatories;
    const weightThreshold = data.weightThreshold;

    // Check for at least 2 signatories
    if (signatories.length < 2) {
      setGlobalErrors("There must be at least 2 signatories to convert an account to multisig");
      setIsSubmitting(false);
      return;
    }

    // Try and grab account info
    const user = await client.database.getAccounts([originAccount]);
    
    // User exists?
    if (!user[0]) {
      setGlobalErrors("Can't find Steem account " + originAccount);
      setIsSubmitting(false);
      return;
    }

    // Trustee accounts contain a duplicate, or contain the origin account?
    var trusteesDupeCheck = [];
    for (var i = 0; i < signatories.length; i++) {
      // Check for origin account
      if (signatories[i].account == originAccount) {
        setGlobalErrors("Account to convert cannot be a signatory");
        setIsSubmitting(false);
        return;
      }

      // Check for dupe
      if (trusteesDupeCheck.includes(signatories[i].account)) {
        setGlobalErrors("Trustee " + signatories[i].account + " is duplicated");
        setIsSubmitting(false);
        return;
      }
      trusteesDupeCheck.push(signatories[i].account);
    }

    // Trustees don't exist?
    for (var i = 0; i < signatories.length; i++) {
      const trustee = await client.database.getAccounts([signatories[i].account]);
      if (!trustee[0]) {
        setGlobalErrors("Can't find Steem account " + signatories[i].account);
        setIsSubmitting(false);
        return;
      }
    }

    // Trustees not already present?
    const active = user[0].active.account_auths;

    var totalWeight = 0;
    for (var i = 0; i < signatories.length; i++) {
      for (var j = 0; j < active.length; j++) {
        if (active[j].includes(signatories[i].account)) {
          setGlobalErrors("Trustee " + signatories[i].account + " already present on account");
          setIsSubmitting(false);
          return;
        }
      }
      totalWeight += parseInt(signatories[i].weight);
    }

    // All weights wouldn't meet threshold?
    if (totalWeight < weightThreshold) {
      setGlobalErrors("Combined proposed weights of " + totalWeight + " couldn't meet proposed threshold of " + weightThreshold);
      setIsSubmitting(false);
      return;
    }

    // Owner key isn't enough to change ownership?
    /*const owner = user[0].owner;
    const ownerWeightThreshold = owner['weight_threshold'];
    var ownerHasWeight = false;
    for (var i = 0; i < owner['key_auths'].length; i++) {
      if (owner['key_auths'][i][0] == originAccountKey && owner['key_auths'][i][1] >= ownerWeightThreshold) {
        ownerHasWeight = true;
        break;
      }
    }
    if (!ownerHasWeight) {
      setGlobalErrors("Owner key isn't enough to change ownership of this account");
      return;      
    }*/
    setIsSubmitting(false);
    navigate("/convertaddress2");
  };

  return (
        <>
        <header className="entry-header">
           <h1 className="entry-title">Convert Account to Multisig - Step One</h1>
        </header>
        <div className="entry-content">
          <p>
            You can convert an existing Steem account to a multisig account below.
          </p>
          <p>          
            After conversion, in order for a proposed transaction from the multisig account to take place, a given number
            of signatories must agree to it. Agreeing signatories must have enough combined weight to meet the weight threshold set.
          </p>
          <p>
            <strong>This process is irreversible; the original account owner cannot convert the account back to non-multisig.</strong>
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="convert-address">
            {globalErrors && <p role="alert" className="error-message">{globalErrors}</p>}
            <div className="fieldgroup">
              <div className="formfield">
                <label htmlFor="originAccount">Account to Convert</label>
                <div className="prepend">
                  <span className="affix">@</span>
                  <input 
                    { ...register("originAccount", { required: "A valid origin account is required" })}
                    defaultValue={state.data.originAccount}
                  />
                </div>
                {errors.originAccount && <div role="alert" className="error-message">{errors.originAccount?.message}</div>}
              </div>
              <div className="formfield">
                <label htmlFor="originAccount">Weight Threshold</label>
                <input 
                  { ...register("weightThreshold", { required: "A weight threshold is required" })}
                  defaultValue={state.data.weightThreshold}
                />
                {errors.weightThreshold && <div role="alert" className="error-message">{errors.weightThreshold?.message}</div>}
              </div>
            </div>
            <fieldset>
              {fields.map((signatory, index) => (
                <div className="fieldgroup" key={signatory.id}>
                  <div className="formfield">
                    <label htmlFor={`signatories[${index}].account`}>Signatory Account</label>
                    <div className="prepend">
                      <span className="affix">@</span>
                      <input
                        { ...register(`signatories[${index}].account`, { required: "Signatory Account is required" })}
                        type="text"
                        defaultValue={signatory.account}
                      />
                    </div>
                    {errors.signatories?.[index]?.account && <div role="alert" className="error-message">{errors.signatories?.[index]?.account.message}</div>}
                  </div>
                  <div className="formfield">
                    <label htmlFor={`signatories[${index}].weight`}>Vote Weight</label>
                    <input
                      { ...register(`signatories[${index}].weight`, { required: "Signatory weight is required" })}
                      type="number"
                      defaultValue={signatory.weight}
                    />
                    {errors.signatories?.[index]?.weight && <div role="alert" className="error-message">{errors.signatories?.[index]?.weight.message}</div>}
                  </div>
                  <button type="button" onClick={() => remove(index)}>Remove</button>
                </div>
              ))}
            </fieldset>
            <div className="buttonRow">
              <button type="button" onClick={() => append({ account: "", weight: "" })}>Add Signatory</button>
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

