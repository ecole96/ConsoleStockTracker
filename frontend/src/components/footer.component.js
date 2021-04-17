import React, { Component } from 'react';

export default class Footer extends Component {
    render() {
        // dynamically generates credit lists in the form of <a href={credit-link}><b>Credit Name</b></a> delimited by commas (input is array of credit names)
        function renderCredits(toCredit) {
            let urls = {'Best Buy':'https://www.bestbuy.com/', 'Gamestop':'https://www.gamestop.com/', 'Microsoft':'https://www.microsoft.com/', 'Newegg':'https://www.newwegg.com/', 
                        'Sony':'https://www.sony.com/', 'Target':'https://www.target.com/', 'Walmart':'https://www.walmart.com/','Font Awesome':'https://www.fontawesome.com/'}
            let renders = toCredit
                          .map(credit => {return <a key={credit} className="text-white" href={urls[credit]} target="_blank" rel="noreferrer noopener"><b>{credit}</b></a>})
                          .reduce((acc, element) => acc === null ? [element] : [acc, ', ', element], null);
            return renders;
        }
        return (
            <footer className="card bg-dark mb-2">
                <div className="footer-content">
                    <div className="m-1">
                        Developed by <a href="https://github.com/ecole96" className="text-info" target="_blank" rel="noreferrer noopener">Evan Cole</a> in March / April 2021. 
                        The project is <a className="text-info" href="https://github.com/ecole96/ConsoleStockTracker" target="_blank" rel="noreferrer noopener">open source</a>, 
                        and any current issues or updates will be posted in the project README. 
                    </div>
                    <div className="m-1">
                        <small>
                            <b>Credits</b> - Console images: {renderCredits(['Microsoft','Sony'])}. Stock data &amp; retail links:&nbsp;
                            {renderCredits(['Best Buy', 'Gamestop', 'Microsoft', 'Newegg', 'Sony', 'Target', 'Walmart'])}. 
                            Logo assets: {renderCredits(['Font Awesome'])}.
                        </small>
                    </div>
                </div>
            </footer>
        ); 
    }
}