import { Outlet } from "react-router-dom";
import { Header } from '../components';
import { Footer } from '../components';

import React, { useState } from "react";

export default function Root() {
    return(
        <>
        <Header />
        <main className="site-main">
          <article>
            <Outlet />
          </article>
        </main>
        <Footer />
        </>
    );
}