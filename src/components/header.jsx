import React from 'react';
import PennsifLogo from './logo'
  
const Header = () => {
  return (
    <div id="primary">
        <header id="masthead" className="site-header">
          <div className="container">
              <PennsifLogo />
              <div className="strapline">Multisig is a <a href="https://steemit.com/@pennsif.witness">@pennsif.witness</a> project<span> in association with <a href="https://steemit.com/@rexthetech" target="_blank">@rexthetech</a> and <a href="https://steemit.com/@freelance.monkey" target="_blank">@freelance.monkey</a></span></div>
          </div>
        </header>
    </div>
  );
};
  
export default Header;