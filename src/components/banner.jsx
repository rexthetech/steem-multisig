import React from 'react';
  
const Banner = () => {
  return (
    <div className="banner">
        <div className="container">
            <div className="banner-description">
                <h2>Vote for our witness it’s <strong>FREE</strong></h2>
                <p>Voting is a great way to to show support, if you would like to show your appreciation please vote for our witness.</p>
            </div>
            <div className="banner-cta">
                <a href="https://steemitwallet.com/~witnesses" target="_blank" className="button" >Vote Pennsif.Witness!</a>
                <div className="note">Every steemit user has 30 free  witness votes</div>
            </div>
        </div>
    </div>
  );
};
  
export default Banner;