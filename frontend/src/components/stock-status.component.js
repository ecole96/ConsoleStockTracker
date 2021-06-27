import axios from 'axios';
import React, { Component } from 'react';
import StockTable from './stock-table.component';
import {getAPIDomain} from '../utils';

// StockStatus component basically serves as the wrapper for the display of all stock data, which consists of four tables (one for each console)
export default class StockStatus extends Component {
    state = {
        data: [], // console stock data (each element is a different console)
        last_runtime: null // last time the data was updated on the backend
    }

    componentDidMount() {
        var self = this; // for referencing this component in the update() function
        function update() {
            //axios.get('http://192.168.0.224:5000/api/stock/pull_data') // get latest stock data
            axios.get(`${getAPIDomain()}/api/stock/pull_data`, {timeout: 15000})
            .then(response => {
                self.setState({ data: response.data.stock, last_runtime: new Date(response.data.last_runtime).toLocaleString('en-US')});
            })
            .catch(err => console.log(err.message))
        }
        update(); // initial data pull upon page load
        this.interval = setInterval(update, 30000); // update data every 30 seconds
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
        let tables = [];
        let console_img;
        for(const element of this.state.data) { // dynamically generating stock columns (console image + stock data table)
            // console images are same as console name, but with spaces replaced with underlines, so generating image references dynamically
            console_img = `${process.env.PUBLIC_URL}/console_images/${element.console.replaceAll(' ','_')}.jpeg`;
            tables.push(<div className="col-xs-12 col-md-6 col-lg-3" key={element.console}>
                            <div className="row">
                                <div className="col-12">
                                    <img src={console_img} className="img-fluid" alt={element.console} />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-12">
                                <StockTable table_data = {element} />
                                </div>
                            </div>
                        </div>);
        }
        return (
            <div className="stock">
                <div className="card bg-dark mb-3">
                    <span>Last updated: <b>{this.state.last_runtime}</b></span>
                </div>
                <div className="row">
                    {tables}
                </div>
            </div>
        )
    }
}