import React, { useState } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import Select from 'react-select'
import { useNavigate } from "react-router-dom";
import { useStateMachine } from "little-state-machine";
import updateAction from "../updateAction";
import Spinner from "../components/loader";

import configData from "../config.json";
import {Client} from "dsteem";

const client = new Client(configData.STEEM_API_URL);

export default function CreateTransactionStep1() {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const { actions, state } = useStateMachine({ updateAction });  
  const [ globalErrors, setGlobalErrors ] = useState("");
  const [ isSubmitting, setIsSubmitting ] = useState(false);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    actions.updateAction(data);
    setGlobalErrors("");

    // Pick up form fields
    const accountFrom = data.accountFrom;
    const accountTo = data.accountTo;
    let amount = data.amount;
    const type = selectedOption.value;

    // Bad amount?
    if (isNaN(amount) || amount <= 0) {
      setIsSubmitting(false);
      setGlobalErrors("Amount must be numeric and greater than zero");
      return;      
    }

    // Force 3 decimal places, but stay stringy
    amount = String(parseFloat(amount).toFixed(3));

    // Accounts don't exist?
    let user = await client.database.getAccounts([accountTo]);
    if (!user[0]) {
      setIsSubmitting(false);
      setGlobalErrors("Can't find recipient Steem account " + accountTo);
      return;
    }
    user = await client.database.getAccounts([accountFrom]);
    if (!user[0]) {
      setIsSubmitting(false);
      setGlobalErrors("Can't find multisig Steem account " + accountFrom);
      return;
    }

    // Account doesn't have enough balance?
    const balanceSTEEM = user[0].balance.substring(0, user[0].balance.length - 6);
    const balanceSBD = user[0].sbd_balance.substring(0, user[0].sbd_balance.length - 4);

    if (type == "STEEM" && parseInt(balanceSTEEM * 1000) < parseInt(amount * 1000)) {
      setIsSubmitting(false);
      setGlobalErrors("Steem account " + accountFrom + " does not have enough STEEM balance (" + balanceSTEEM + " STEEM)");
      return;
    } else if (type == "SBD" && parseInt(balanceSBD * 1000) < parseInt(amount * 1000)) {
      setIsSubmitting(false);
      setGlobalErrors("Steem account " + accountFrom + " does not have enough SBD balance (" + balanceSBD + " SBD)");
      return;
    }

    const active = user[0].active.account_auths;
    const weightRequired = user[0].active.weight_threshold;

    data.weightRequired = weightRequired; // Stick stuff in state: weight required
    data.auths = active;                  // Active auths
    data.type = type;                     // And curr type
    data.amount = amount;                 // And correctly-formatted amount
    actions.updateAction(data);

    // accountFrom isn't multisig?
    if (active.length < 2) {
      setIsSubmitting(false);
      setGlobalErrors("Steem account " + accountFrom + " does not appear to be a multisig account");
      return;
    }

    // Looks ok, let's see who's signing
    setIsSubmitting(false);
    navigate("/createtransaction2");
  };

  // CyptoSelect
  const CryptoSelect = [
    { value: 'STEEM', label: 'STEEM' },
    { value: 'SBD', label: 'SBD' }
  ]

  const customStyles = {
    control: (defaultStyles) => ({
      ...defaultStyles,
      backgroundColor: "transparent",
      border: "none",
      boxShadow: "none",
      height: 32,
      minHeight: 32,
      margin: 0,
      fontSize: 14
    }),
    dropdownIndicator: (defaultStyles) => ({
      ...defaultStyles,
      padding : 4,
    }),
    option: (defaultStyles, state) => ({
      ...defaultStyles,
      fontSize: 14,
      backgroundColor: state.isSelected ? "#F3F4F6;" : "#fff",
      color: "#1F293A",

      "&:hover": {      
        ...defaultStyles,  
        backgroundColor: "#FFD731",
        color: "#1F293A",
        fontSize: 14,
      },
    }),
  };

  const [selectedOption, setSelectedOption] = useState(CryptoSelect[0]);
  const handleSelectChange = selectedOption => {
    setSelectedOption(selectedOption);
  };

  return (
    <>
        <header className="entry-header">
            <h1 className="entry-title">Create a Multisig Transaction - Step One</h1>
        </header>
        <div className="entry-content">
          <p>
            Initiate a transaction from a Multisig account below. In order for the transaction to proceed, a given number of signatories must agree to it.
          </p>
          <form onSubmit={handleSubmit(onSubmit)}>
            {globalErrors && <p role="alert" className="error-message">{globalErrors}</p>}
            <div className="fieldgroup">
              <div className="formfield">
                <label htmlFor="accountFrom">Multisig account to send from</label>
                <div className="prepend">
                  <span className="affix">@</span>
                  <input 
                    { ...register("accountFrom", { required: "A valid Multisig account is required" })}
                    defaultValue={state.data.accountFrom}
                  />
                </div>
                {errors.accountFrom && <div role="alert" className="error-message">{errors.accountFrom?.message}</div>}
              </div>

              <div className="formfield">
                <label htmlFor="accountTo">Recipient account to send to</label>
                <div className="prepend">
                  <span className="affix">@</span>
                  <input 
                    { ...register("accountTo", { required: "A valid Steem account is required" })}
                    defaultValue={state.data.accountTo}
                  />
                </div>
                {errors.accountTo && <div role="alert" className="error-message">{errors.accountTo?.message}</div>}
              </div>
              
              <div className="formfield">
                <label htmlFor="amount">Amount to send</label>
                <div className="append">
                  <input
                    { ...register("amount", { required: "A STEEM amount is required" })}
                    defaultValue={state.data.amount}
                  />
                  <span className="suffix">
                    <Select
                      styles={customStyles}
                      value={selectedOption}
                      onChange={handleSelectChange}
                      options={CryptoSelect}
                    />
                  </span>

                </div>
                {errors.amount && <div role="alert" className="error-message">{errors.amount?.message}</div>}
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

