import React from 'react'
import ReactDOM from 'react-dom/client'

import Root from "./routes/root";
import ErrorPage from "./error-page";

import Wizard from './routes/wizard';

import { StateMachineProvider, createStore } from "little-state-machine";

import ConvertAddressStep1 from './routes/convertAddressStep1';
import ConvertAddressStep2 from './routes/convertAddressStep2';
import ConvertAddressResult from './routes/convertAddressResult';

import CreateTransactionStep1 from './routes/createTransactionStep1';
import CreateTransactionStep2 from './routes/createTransactionStep2';
import CreateTransactionResult from './routes/createTransactionResult';

import SignTransactionStep1 from './routes/signTransactionStep1';
import SignTransactionStep2 from './routes/signTransactionStep2';
import SignTransactionStep3 from './routes/signTransactionStep3';
import SignTransactionResult from './routes/signTransactionResult';

import './scss/static.scss';

createStore({
  data: {}
});

// Routing stuff
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root/>,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Wizard /> }, 
      { path: "convertaddress1", element: <ConvertAddressStep1 /> },
      { path: "convertaddress2", element: <ConvertAddressStep2 /> },
      { path: "convertaddressresult", element: <ConvertAddressResult /> },
      { path: "createtransaction1", element: <CreateTransactionStep1 /> },
      { path: "createtransaction2", element: <CreateTransactionStep2 /> },
      { path: "createtransactionresult", element: <CreateTransactionResult /> },
      { path: "signtransaction1", element: <SignTransactionStep1 /> },
      { path: "signtransaction2", element: <SignTransactionStep2 /> },
      { path: "signtransaction3", element: <SignTransactionStep3 /> },
      { path: "signtransactionresult", element: <SignTransactionResult /> }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StateMachineProvider>
      <RouterProvider router={router} />
    </StateMachineProvider>
  </React.StrictMode>,
)
