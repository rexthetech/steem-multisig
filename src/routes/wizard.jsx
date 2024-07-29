import React, { useEffect } from 'react';
import { Link } from "react-router-dom";
import { useStateMachine } from "little-state-machine";

import AccountIcon from '../components/icons/account';
import CreateTransactionIcon from '../components/icons/createTransaction';
import SignTransactionIcon from '../components/icons/signTransaction';

import clearAction from "../clearAction";

export default function Wizard() {
  const { actions } = useStateMachine({ clearAction });
  useEffect(() => {
    actions.clearAction()
  }, []);

  return (
    <>
    <header className="entry-header">
        <h1 className="entry-title">Steem Multisig Wizard</h1>
    </header>
    <div className="entry-content">
      <p>
        From here, you may <strong>create a multisig address</strong> by converting an existing Steem account.
      </p>
      <p>
        You may also <strong>create a multisig transaction</strong> to pay from an existing multisig account,
        or <strong>sign a transaction</strong> that another signatory has proposed.
      </p>
      <div className="cta-buttons">
        <Link to="convertaddress1" className="button"><AccountIcon /> Create an address</Link>
        <Link to="createtransaction1" className="button"><CreateTransactionIcon /> Create a transaction </Link>
        <Link to="signtransaction1" className="button"><SignTransactionIcon /> Sign a transaction </Link>
      </div>
    </div>
  </>
  );
};
