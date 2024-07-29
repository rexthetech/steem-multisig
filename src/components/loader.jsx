import React from 'react';

const Spinner = () => {
    return (
        <>
            <div className="loader-overlay"></div>
            <div className="loader-center">
                <div className="loader-indicator"></div>
            </div>
        </>
    )
}
export default Spinner;