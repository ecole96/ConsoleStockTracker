import React, { Component } from 'react';
import {Modal} from 'react-bootstrap';

export default class Footer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false,
        };
        this.toggleModal = this.toggleModal.bind(this);
    }

    toggleModal() {
        this.setState({showModal: !this.state.showModal});
    }

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
                <div className="footer-content" style={{'display':"inline-block"}}>
                    <Modal contentClassName="bg-dark text-white" show={this.state.showModal} onHide={() => this.toggleModal()}>
                        <Modal.Header closeButton>
                            <Modal.Title>Notes &amp; Credits</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <h5>Notes</h5>
                            <ul>
                                <li>Newegg only stocks bundles for the PS5.</li>
                                <li>Walmart stock may not always be accurate - small quantities (often single-digits) are allegedly stocked occasionally, 
                                    but they're either sold out instantly or were never actually available (doubt much can be done here, this is seemingly on WM's end).</li>
                                <li>Best Buy sometimes lists a console as in-stock (and allows you to add it to cart) but does not allow for delivery, only pick-up at certain stores.</li>
                            </ul>
                            <h5>Credits</h5>
                            <ul>
                                <li>Developed by <a href="https://github.com/ecole96" className="text-info" target="_blank" rel="noreferrer noopener">Evan Cole</a> in April 2021</li>
                                <li>Console images courtesy of: {renderCredits(['Microsoft','Sony'])}</li>
                                <li>Stock data &amp; retail links courtesy of: {renderCredits(['Best Buy', 'Gamestop', 'Microsoft', 'Newegg', 'Sony', 'Target', 'Walmart'])}</li>
                                <li>Logo assets courtesy of {renderCredits(['Font Awesome'])}</li>
                                <li>This project is <a className="text-info" href="https://github.com/ecole96/ConsoleStockTracker" target="_blank" rel="noreferrer noopener">open source</a></li>
                            </ul>
                        </Modal.Body>
                        <Modal.Footer></Modal.Footer>
                    </Modal>
                    Developed by <a href="https://github.com/ecole96" className="text-info" target="_blank" rel="noreferrer noopener">Evan Cole</a>
                    <button type="button" className="btn btn-sm btn-info m-2" style={{'width':'fit-content'}} onClick={()=>this.toggleModal()}>Notes &amp; Credits</button>
                </div>
            </footer>
        );
    }
}